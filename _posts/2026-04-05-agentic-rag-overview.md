---
layout: post
title: "Agentic RAG with AWS 1: What Agentic RAG Is and What This Series Will Build"
date: 2026-04-05
last_modified_at: 2026-04-19
description: A practical introduction to agentic RAG using a simple AWS-based engineering knowledge assistant.
tags: rag agents aws llm
categories:
  - artificial intelligence
thumbnail: assets/images/2026-04-05-agentic-rag-overview/agentic-rag-overview.svg
og_image: assets/images/2026-04-05-agentic-rag-overview/agentic-rag-overview.png
giscus_comments: false
published: true
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/2026-04-05-agentic-rag-overview/agentic-rag-overview.svg" class="img-fluid rounded z-depth-1 mx-auto d-block" alt="Agentic RAG system overview with user query, agent, retrieval, tools, and final answer" %}
    </div>
</div>

Many teams can demo a RAG application. Far fewer can explain, with precision, **why their system is retrieving the right evidence**, how large the chunks should be, which embedding model fits the workload, how many results should be returned, when reranking is worth it, or when the system should stop being simple RAG and start behaving more like an agent.

**That is the real gap this series is trying to close.**

The hard part is usually not understanding the high-level idea of RAG. The hard part is making concrete design choices at each step, understanding the tradeoffs behind them, and tuning the system without turning it into guesswork.

This series is my attempt to make that design space concrete, using one small but realistic system that grows step by step.

## What Is RAG?

**RAG stands for retrieval-augmented generation.** Instead of asking a model to answer from its built-in training alone, you first retrieve relevant external information and then give that information to the model as context.

That shifts the system from answering mainly from **model memory** to answering with **retrieved evidence in context**. That matters because models can otherwise fill gaps with plausible but unavailable or incorrect details. In practice, that is what makes RAG useful for internal knowledge, technical documentation, policies, runbooks, and other information that changes over time.

## Why RAG Is Needed

A model on its own may sound confident, but confidence is not the same as correctness. For enterprise and engineering use cases, the problem is usually not generating fluent text. The problem is producing an answer that is grounded in the right documents, reflects current information, and can be traced back to a source.

RAG helps because it gives the model access to **current, domain-specific knowledge at query time**. That makes it much more suitable for questions where freshness, traceability, and relevance matter.

## The Basic Stages of a RAG System

At a high level, a RAG pipeline usually looks like this:

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/2026-04-05-agentic-rag-overview/agentic-rag-basic-stages.svg" class="img-fluid rounded z-depth-1 mx-auto d-block" alt="Basic stages of an agentic RAG workflow from ingestion to retrieval and response generation" %}
    </div>
</div>

1. choose and prepare source documents
2. ingest and normalize the content
3. chunk the documents into retrievable units
4. convert those chunks into embeddings
5. store them in a vector database or other retrieval system
6. retrieve the most relevant chunks for a user query
7. assemble context and send it to the model
8. generate a grounded answer

Each of those steps has **parameters, tradeoffs, and failure modes**. Much of this series is about how to make those choices deliberately instead of accepting defaults blindly.

## The Running Example for This Series

The running example is an internal engineering knowledge assistant on AWS. The documents live in S3. The system needs to answer questions like the following:

- "What retries happen after a payment failure?"
- "Which service publishes invoice events?"
- "How do we rotate the webhook signing secret?"
- "What happens after a payment failure, which events are published, and which service eventually sends the customer notification?"

That example is intentionally small, but the design questions are real. Which documents should enter the system? How should they be chunked? Which embedding model and vector store fit the workload? When is one retrieval pass enough? When should the system think in steps? How do you evaluate and operate the whole thing once it is live?

## What Agentic RAG Actually Means

Standard RAG is straightforward:

1. retrieve relevant context
2. pass it to the model
3. generate an answer

**Agentic RAG adds one more layer: the system can decide that one pass is not enough.**

Instead of treating retrieval as fixed, it can:

- rewrite a vague query
- decompose a multi-hop question
- retrieve again after seeing partial evidence
- use a tool or structured lookup when documents are not enough
- stop and say the evidence is insufficient

That does not automatically make the system better. It makes the system more capable, but also more complex. **The point of this series is not to glorify that complexity.** It is to help you decide when it is justified and how to build it without losing control of the system.

## What This Series Covers

The rest of the series walks from raw documents all the way to production operations. Each part adds one design layer to the same system, so the later posts build on the earlier ones instead of starting over.

### Part 2: [Documents, Ingestion, and Metadata Design]({{ '/agentic-rag-ingestion-and-metadata/' | relative_url }})

This post starts at the real beginning: the source documents. It covers which data sources are worth indexing, why S3 is the right default for our AWS example, how to think about ingestion quality, and why metadata is not optional. It also includes the sample dataset used throughout the series so the later labs have a concrete foundation.

### Part 3: [Chunking Strategy, Size, Overlap, and Boundaries]({{ '/agentic-rag-chunking-strategy/' | relative_url }})

This post explains why chunking is one of the highest-leverage choices in the whole system. It covers fixed-size, hierarchical, semantic, and manual chunking; how chunk boundaries affect retrieval quality; and how to reason about different document types in the sample corpus. The hands-on section stays close to Bedrock Knowledge Bases so the reader can inspect real chunking options in AWS.

### Part 4: Embedding Model Selection `Coming soon`

This post covers what embeddings are actually doing, how to compare models, why dimensions matter, and why this choice is more expensive to reverse than it first appears. It uses the AWS console flow to explain the Bedrock embedding choices and sets up the default path used in the rest of the series.

### Part 5: Choosing the Vector Database `Coming soon`

This post moves from vectors in theory to vectors in storage. It compares the practical AWS-native options you will actually see, explains when S3 Vectors is enough and when a heavier search-oriented store becomes justified, and completes the first working knowledge base in AWS. It is the point where the earlier design choices become a running system.

### Part 6: Retrieval Design, Top-k, Filters, Hybrid Search, and Reranking `Coming soon`

This post is about tuning the system you just built. It covers top-k, score interpretation, metadata filters, reranking, and the difference between a working knowledge base and a well-tuned one. It also uses metadata sidecar files and concrete sample queries so retrieval behavior can be inspected rather than guessed.

### Part 7: The Agentic Layer, Planning, Tools, and Multi-Step Retrieval `Coming soon`

This is where the system becomes genuinely agentic. It explains when query rewriting, question decomposition, and tool use are actually worth adding. The hands-on part moves beyond the console and uses a small Lambda-based workflow so the reader can see what multi-step retrieval looks like in practice.

### Part 8: Prompting and Context Assembly `Coming soon`

This post covers what happens after retrieval and planning: how evidence is ordered, filtered, budgeted, and presented to the model. It focuses on grounded prompting rather than prompt theatrics, and it shows why context assembly is an information-design problem rather than just a token-packing exercise.

### Part 9: Evaluation, How to Know Whether the System Is Good `Coming soon`

This post turns the system into something measurable. It covers gold sets, failure taxonomies, retrieval-versus-answer evaluation, Bedrock RAG evaluations, automated regression checks, and the difference between manual review and continuous evaluation. The point is to replace intuition with evidence before the system reaches production.

### Part 10: Production Security, Freshness, Observability, and Cost `Coming soon`

This final post closes the series by focusing on how to run the system safely over time. It covers the production API shape, data freshness, security, observability, cost, scaling, CI/CD, fallback behavior, and a set of practical operating best practices. It is where the architecture becomes a real service rather than a successful demo.

## What You Will Learn From This Series

If you read the whole series, you should come away with a practical mental model for designing and operating an agentic RAG system, not just a bag of disconnected techniques or product screenshots.

The objective is not to produce the fanciest possible chatbot. It is to show how to build a system that is **grounded in real evidence**, **simple by default**, **more agentic only when needed**, **measurable**, and **operable**.

More specifically, you should know:

- how to choose and prepare source documents
- how to think about chunking based on document type
- how to choose an embedding model and vector store in AWS
- how to tune retrieval instead of treating it as a black box
- when agentic behavior is actually justified
- how to assemble context so the final answer stays grounded
- how to evaluate the system systematically
- how to operate the system with enough freshness, security, visibility, and cost discipline to trust it in real work

That is the standard I care about for production AI systems. Not **"can it answer one demo question?"** but **"can we trust the whole pipeline enough to use it without guessing what it is doing?"**

## A Good Starting Mental Model

The easiest way to reason about agentic RAG is this: it is a pipeline that turns **messy organizational knowledge into bounded, searchable evidence**, then decides how much reasoning and how many steps are justified before producing a grounded answer.

That framing keeps the priorities in the right order:

1. make knowledge retrieval trustworthy
2. keep the reasoning loop as simple as possible
3. add sophistication only where it clearly earns its cost

That is the thread running through every post in this series.

If this is the problem you care about, this page should stay useful as the series grows. The later posts will go deep into each decision, but this is the map for the whole journey.

In [the next post]({{ '/agentic-rag-ingestion-and-metadata/' | relative_url }}), I start at the beginning of the pipeline: which documents should enter the system, how they should be processed, and why metadata design quietly determines much of the system's eventual quality.
