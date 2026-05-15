#!/usr/bin/env python3
"""
Minimal custom agentic RAG orchestration for Amazon Bedrock Knowledge Bases.

Flow:
1. Decompose a complex question into smaller search queries.
2. Call Retrieve on the knowledge base for each query.
3. Filter and deduplicate the returned chunks.
4. Use a Bedrock text model to synthesize a grounded final answer.

This file can run as:
- an AWS Lambda function via lambda_handler
- a local script for quick testing
"""

from __future__ import annotations

import argparse
import json
import os
from typing import Any, Dict, List

import boto3


AWS_REGION = os.environ.get("AWS_REGION") or os.environ.get("AWS_DEFAULT_REGION") or "us-east-1"
KB_ID = os.environ.get("KB_ID", "")
MODEL_ID = os.environ.get("MODEL_ID", "")
RESULTS_PER_QUERY = int(os.environ.get("RESULTS_PER_QUERY", "3"))
MAX_SUBQUESTIONS = int(os.environ.get("MAX_SUBQUESTIONS", "3"))
MIN_SCORE = float(os.environ.get("MIN_SCORE", "0.35"))

bedrock_agent_runtime = boto3.client("bedrock-agent-runtime", region_name=AWS_REGION)
bedrock_runtime = boto3.client("bedrock-runtime", region_name=AWS_REGION)


def require_configuration() -> None:
    missing = []
    if not KB_ID:
        missing.append("KB_ID")
    if not MODEL_ID:
        missing.append("MODEL_ID")
    if missing:
        raise ValueError(f"Missing required environment variables: {', '.join(missing)}")


def extract_text_from_converse(response: Dict[str, Any]) -> str:
    blocks = response.get("output", {}).get("message", {}).get("content", [])
    parts = [block["text"] for block in blocks if "text" in block]
    return "\n".join(parts).strip()


def call_text_model(system_prompt: str, user_prompt: str, *, max_tokens: int) -> str:
    response = bedrock_runtime.converse(
        modelId=MODEL_ID,
        system=[{"text": system_prompt}],
        messages=[{"role": "user", "content": [{"text": user_prompt}]}],
        inferenceConfig={"maxTokens": max_tokens, "temperature": 0.1},
    )
    return extract_text_from_converse(response)


def decompose_question(question: str) -> List[str]:
    system_prompt = (
        "You rewrite questions for a retrieval system. Return only a JSON array of strings. "
        f"Return between 1 and {MAX_SUBQUESTIONS} items. If the question is already simple, "
        "return an array containing the original question only."
    )
    user_prompt = f"""
Create focused search queries for this user question.

Rules:
- Keep each query short and concrete.
- Cover different parts of the original question when decomposition is useful.
- Do not invent facts or system names that are not implied by the question.
- Return only valid JSON.

Question:
{question}
""".strip()

    raw = call_text_model(system_prompt, user_prompt, max_tokens=300)

    try:
        start = raw.index("[")
        end = raw.rindex("]") + 1
        queries = json.loads(raw[start:end])
        cleaned = [item.strip() for item in queries if isinstance(item, str) and item.strip()]
        if cleaned:
            return cleaned[:MAX_SUBQUESTIONS]
    except (ValueError, json.JSONDecodeError):
        pass

    return [question]


def extract_source(location: Dict[str, Any]) -> str:
    if "s3Location" in location:
        return location["s3Location"].get("uri", "s3://unknown")
    if "webLocation" in location:
        return location["webLocation"].get("url", "web://unknown")
    if "confluenceLocation" in location:
        return location["confluenceLocation"].get("url", "confluence://unknown")
    if "salesforceLocation" in location:
        return location["salesforceLocation"].get("url", "salesforce://unknown")
    if "sharePointLocation" in location:
        return location["sharePointLocation"].get("url", "sharepoint://unknown")
    return "unknown-source"


def retrieve_chunks(query: str) -> List[Dict[str, Any]]:
    response = bedrock_agent_runtime.retrieve(
        knowledgeBaseId=KB_ID,
        retrievalQuery={"text": query},
        retrievalConfiguration={
            "vectorSearchConfiguration": {
                "numberOfResults": RESULTS_PER_QUERY,
            }
        },
    )

    chunks = []
    for item in response.get("retrievalResults", []):
        score = float(item.get("score", 0.0))
        text = item.get("content", {}).get("text", "").strip()
        if not text or score < MIN_SCORE:
            continue

        chunks.append(
            {
                "query": query,
                "score": round(score, 4),
                "source": extract_source(item.get("location", {})),
                "text": text,
            }
        )
    return chunks


def deduplicate_chunks(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen = set()
    unique = []
    for chunk in chunks:
        key = (chunk["source"], chunk["text"][:180])
        if key in seen:
            continue
        seen.add(key)
        unique.append(chunk)
    return unique


def synthesize_answer(question: str, sub_questions: List[str], chunks: List[Dict[str, Any]]) -> str:
    if not chunks:
        return "I could not find enough relevant evidence in the knowledge base to answer this question."

    context_blocks = []
    for chunk in chunks:
        context_blocks.append(
            f"[Sub-question: {chunk['query']}]\n"
            f"[Source: {chunk['source']}]\n"
            f"[Score: {chunk['score']:.2f}]\n"
            f"{chunk['text']}"
        )

    system_prompt = (
        "You are a careful assistant. Answer only from the supplied context. "
        "If the context is incomplete, say so clearly. End with a short Sources section."
    )
    user_prompt = f"""
Original question:
{question}

Sub-questions used:
{json.dumps(sub_questions, indent=2)}

Context:
{chr(10).join(context_blocks)}
""".strip()

    return call_text_model(system_prompt, user_prompt, max_tokens=900)


def run_agentic_rag(question: str) -> Dict[str, Any]:
    require_configuration()

    sub_questions = decompose_question(question)
    all_chunks: List[Dict[str, Any]] = []
    retrieval_log = []

    for sub_question in sub_questions:
        chunks = retrieve_chunks(sub_question)
        retrieval_log.append(
            {
                "sub_question": sub_question,
                "chunks_found": len(chunks),
                "top_score": max((chunk["score"] for chunk in chunks), default=0.0),
            }
        )
        all_chunks.extend(chunks)

    unique_chunks = deduplicate_chunks(all_chunks)
    answer = synthesize_answer(question, sub_questions, unique_chunks)

    return {
        "question": question,
        "sub_questions": sub_questions,
        "retrieval_log": retrieval_log,
        "chunks_used": len(unique_chunks),
        "sources": [chunk["source"] for chunk in unique_chunks],
        "answer": answer,
    }


def lambda_handler(event: Dict[str, Any], _context: Any) -> Dict[str, Any]:
    body = event
    if isinstance(event.get("body"), str):
        try:
            body = json.loads(event["body"])
        except json.JSONDecodeError:
            body = event

    question = body.get("query", "").strip()
    if not question:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "Provide a 'query' field in the event payload."}),
        }

    try:
        result = run_agentic_rag(question)
        return {"statusCode": 200, "body": json.dumps(result)}
    except Exception as exc:  # pragma: no cover - defensive for Lambda output
        return {"statusCode": 500, "body": json.dumps({"error": str(exc)})}


def main() -> None:
    parser = argparse.ArgumentParser(description="Run a minimal agentic RAG flow against a Bedrock Knowledge Base.")
    parser.add_argument("query", help="Question to ask")
    args = parser.parse_args()
    print(json.dumps(run_agentic_rag(args.query), indent=2))


if __name__ == "__main__":
    main()
