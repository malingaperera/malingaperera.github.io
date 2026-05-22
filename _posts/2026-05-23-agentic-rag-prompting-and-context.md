---
layout: post
title: "Agentic RAG with AWS 8: Prompting and Context Assembly"
date: 2026-05-23
description: How to turn retrieved evidence into grounded answers without overloading the model context window.
tags: rag agents aws llm prompting
categories:
  - artificial intelligence
thumbnail: assets/images/2026-05-23-agentic-rag-prompting-and-context/agentic-rag-prompting-and-context.png
og_image: assets/images/2026-05-23-agentic-rag-prompting-and-context/agentic-rag-prompting-and-context.png
giscus_comments: false
published: true
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/2026-05-23-agentic-rag-prompting-and-context/agentic-rag-prompting-and-context.png" class="img-fluid rounded z-depth-1 mx-auto d-block" alt="Prompting and context assembly flow showing retrieved chunks ordered, filtered, and sent to the final model" zoomable=true %}
    </div>
</div>

In the previous post, we built a small agentic layer on top of the knowledge base. The system could decompose a question, retrieve evidence multiple times, and produce a final answer. That still leaves one important step: how the collected evidence is assembled and presented to the model. 

The model may ignore the best chunk. It may over-focus on a weak chunk. It may merge partial evidence into a confident but wrong answer. That is why context assembly and prompting still matter. From my experience, context is everything when it comes to quality outputs from LLMs.

The final answer quality depends not only on what evidence you retrieve, but also on how you present that evidence to the model.

This post answers five practical questions:

1. How should retrieved evidence be assembled before the final model call?
2. How should chunks be ordered, filtered, and separated?
3. How much context is too much?
4. What instructions keep the answer grounded?
5. How do you detect context assembly and prompting failures?

If you want the short version first, jump to [A Good Default](#a-good-default).

## Context Assembly Is an Information Design Problem

The model sees exactly what you give it, in the order you give it, with the instructions you attach. It is a decision about:

- which evidence to include
- how to order it
- how much explanation the system should give the model about how to use it

For the engineering assistant we are building in this series, this matters because different questions need different context shapes.

A direct operational question should usually give the model one dominant source first, with any supporting chunks kept secondary. A multi-hop question should arrange evidence in the order the answer needs to follow. A question with near-miss documents should preserve source names clearly so the model does not blend generic background material with the authoritative runbook.

For example:

- "How do we rotate the webhook signing secret?" should put `webhook-secret-rotation.md` first and avoid letting `webhook-onboarding-guide.md` dilute the answer.
- "Which service publishes invoice events?" should keep `invoice-events-overview.md` as the dominant source, because this is a direct lookup.
- "What happens after a payment failure, which events are published, and which service eventually sends the customer notification?" should order the context as `payment-failure-handling.md`, then `invoice-events-overview.md`, then `customer-notification-flow.md`.

The point is not only whether those chunks were retrieved. The point is whether they are arranged in a shape the model can use safely.

## Order the Context for the Answer You Want

Once you have decided what evidence belongs in the final prompt, the next question is order.

Order is not just presentation. It influences what the model notices first, what it treats as primary, and how easily it can connect evidence across documents.

There are three useful ordering patterns:

- **Strongest evidence first**: useful for direct lookup or operational questions where one source should dominate the answer.
- **Grouped by source document**: useful when several chunks come from the same document and should be read together.
- **Grouped by reasoning step**: useful for multi-hop questions where the answer needs to follow a sequence.

For straightforward answers, strongest-first is usually enough. If the question is "Which service publishes invoice events?", the chunk from `invoice-events-overview.md` should appear before generic eventing background material.

For more complex questions, grouping by reasoning step can make the final answer easier to synthesize. If the question traces payment failure through customer notification, the context should follow that path instead of mixing all retrieved chunks by score alone:

1. payment failure handling
2. invoice event publication
3. customer notification

That becomes especially useful once the agentic layer has already decomposed the question and retrieved evidence in steps.

Whatever ordering strategy you choose, preserve source identity and chunk boundaries. The model should be able to tell where one source ends and the next begins. Otherwise it can blend an authoritative runbook, a background overview, and a near-miss onboarding guide into one smooth but unsafe answer.

## Tell the Model How to Treat the Evidence

The final prompt should not try to solve retrieval problems. Its job is narrower: tell the model how to use the evidence it has been given.

For a grounded RAG answer, the important instructions are usually simple:

- answer using the provided evidence
- do not invent unsupported details
- mention uncertainty when evidence is incomplete
- cite or reference the relevant sources in the response

Those instructions are not decorative. They define the boundary between a grounded answer and a fluent guess.

What I would avoid is a long prompt that tries to encode every possible edge case. If the evidence is clean, ordered, and clearly separated, the instruction layer can stay short. If the evidence is messy, a longer prompt usually hides the problem rather than fixing it.

## More Context Is Not the Same as Better Context

One of the easiest mistakes in RAG is to keep adding chunks because it feels safer. It is often not safer.

Too much context dilutes the strongest evidence, increases cost, makes contradictions harder to notice, and forces the model to spend effort sorting instead of answering.

Two practical rules are enough for a first version:

- filter obviously weak chunks before they reach the prompt
- cap the assembled context so there is still room for the model to answer

I would not treat one score threshold as universal. But once chunk scores fall well below the leading evidence, they should be treated with suspicion rather than included automatically. A practical rule of thumb is to leave at least 30 to 40 percent of the available context window for the model's own response.

## Handle Contradictions Explicitly

Internal documents are not always consistent. An older runbook may say one thing while a newer architecture note says another. A draft API page may conflict with the current production behavior.

The system should not pretend this never happens.

A useful instruction is to tell the model to surface conflicting evidence rather than silently flatten it into a single answer. For operational systems, that honesty is much more valuable than a smooth but incorrect synthesis.

For example, imagine the context contains two chunks like this:

- `webhook-secret-rotation.md`, updated in May, says production webhook signing secrets must be rotated using a dual-secret rollout.
- `legacy-webhook-runbook.md`, updated last year, says the old secret should be replaced directly.

The model should not average those into a generic rotation procedure. It should say that the sources conflict, prefer the newer operational runbook if the prompt tells it to do that, and make the conflict visible to the user.

## A Simple Prompt Shape

For many systems, the final model call only needs a simple structure:

```text
You are answering questions using only the provided internal documents.
If the evidence is insufficient or conflicting, say so clearly.
Prefer the most directly relevant and recent evidence when the sources disagree.

Question:
<user question>

Retrieved evidence:
<chunk 1 with source>
<chunk 2 with source>
<chunk 3 with source>
```

This is intentionally plain. The goal is not clever prompt engineering. The goal is grounded answers.

For operational use, the important details are:

- source name
- retrieval score or rank
- a clear separator between chunks

Those details help the model see where one evidence block ends and the next begins. They also make debugging much easier when an answer is weak.

For the sample dataset, a concrete assembled context for the multi-hop payment-failure question might look like:

```text
Question:
What happens after a payment failure, which events are published, and which service eventually sends the customer notification?

Retrieved evidence:
[Source: payment-failure-handling.md]
Payment Orchestrator publishes PaymentFailed. Invoice Service consumes PaymentFailed and publishes InvoicePaymentFailed.

[Source: invoice-events-overview.md]
Invoice Service is the canonical publisher for invoice-domain events, including InvoicePaymentFailed.

[Source: customer-notification-flow.md]
Notification Dispatcher consumes InvoicePaymentFailed and sends the customer email notification.
```

That is enough evidence for a grounded answer. Adding unrelated onboarding or platform overview chunks would usually make the answer worse rather than safer.

## Signs Prompting and Context Assembly Are Failing

The clearest warning signs are:

- **The answer uses a weaker source while a stronger source was present.** For example, it follows generic onboarding material even though the operational runbook was retrieved.
- **The answer blends separate sources into one unsupported procedure.** This usually means chunk boundaries or source names were not visible enough in the assembled context.
- **Adding more chunks makes the answer worse.** That is a sign the prompt is carrying weak or distracting evidence instead of a focused context set.
- **Conflicting evidence is flattened into one confident answer.** The model should surface the conflict, not hide it behind smooth wording.

## A Good Default

For the Lambda-based path in this series, my starting defaults would be:

- sort direct lookup answers by retrieval score, with the highest-scoring authoritative source first
- group multi-hop answers by sub-question or reasoning step before building the final prompt
- include `source`, `score`, and a clear separator for every chunk
- cap the assembled context before the final model call, using a simple character limit if you do not have token counting yet
- tell the model to answer only from the provided context and to say when evidence is missing or conflicting

The safest answer is not the longest one. It is the one that stays closest to the evidence.

## Hands-on Lab

This lab keeps the setup deliberately small. Instead of changing retrieval, we will change only the final context assembly and synthesis prompt in the Lambda from post 7.

The goal is to show one practical benefit of prompt design: when RAG retrieves both a correct operational source and a near-miss source, context assembly should help the model prefer the right one.

You will use the same knowledge base, the same `Retrieve` call, and the same question for both runs. The only thing that changes is how the returned chunks are turned into the final model prompt.

### Step 1: Use the Existing Lambda

Open [agentic_rag_lab_lambda.py]({{ '/assets/files/agentic-rag/agentic_rag_lab_lambda.py' | relative_url }}).

The function to focus on is `synthesize_answer()`. Retrieval has already happened by the time this function runs:

```python
def synthesize_answer(question: str, sub_questions: List[str], chunks: List[Dict[str, Any]]) -> str:
    ...
```

For this lab, test with a direct operational question:

```text
How do we rotate the webhook signing secret?
```

This question is useful because the sample dataset contains two related documents:

- `webhook-secret-rotation.md`, which is the correct operational runbook
- `webhook-onboarding-guide.md`, which mentions signing secrets but is only for first-time provider setup

Run the Lambda once and check the `sources` field in the response. If both documents appear, this is a good test case. If the onboarding guide does not appear, temporarily raise `RESULTS_PER_QUERY` to `5` and rerun the query.

### Step 2: Try Naive Context Assembly

First, replace `synthesize_answer()` with a deliberately naive version. This is close to what many first RAG implementations do: join the retrieved text and ask the model to answer.

```python
def synthesize_answer(question: str, sub_questions: List[str], chunks: List[Dict[str, Any]]) -> str:
    if not chunks:
        return "I could not find enough relevant evidence in the knowledge base to answer this question."

    context_text = "\n\n".join(chunk["text"] for chunk in chunks)

    system_prompt = "Answer the user's question using the provided context."
    user_prompt = f"""
Question:
{question}

Context:
{context_text}
""".strip()

    return call_text_model(system_prompt, user_prompt, max_tokens=900)
```

Run the Lambda again with:

```json
{
  "query": "How do we rotate the webhook signing secret?"
}
```

The answer may still be mostly correct, especially with a strong model. But look for these weak behaviors:

- does it mention onboarding steps such as registering endpoints or mapping event types?
- does it treat "set the initial webhook signing secret" as part of rotation?
- does it fail to distinguish first-time setup from production rotation?
- does it omit validation or revocation of the old provider secret?

If any of those happen, the problem is not retrieval. The right evidence was present. The issue is that the final prompt did not make the evidence shape clear enough.

### Step 3: Try Source-Aware Context Assembly

Now replace `synthesize_answer()` with a source-aware version. Retrieval is still unchanged. The difference is that the final prompt preserves source identity, score, chunk boundaries, and the rule that operational runbooks should beat related background material.

```python
def synthesize_answer(question: str, sub_questions: List[str], chunks: List[Dict[str, Any]]) -> str:
    if not chunks:
        return "I could not find enough relevant evidence in the knowledge base to answer this question."

    ordered_chunks = sorted(chunks, key=lambda chunk: chunk["score"], reverse=True)

    context_blocks = []
    for chunk in ordered_chunks:
        context_blocks.append(
            f"[Source: {chunk['source']}]\n"
            f"[Retrieval score: {chunk['score']:.2f}]\n"
            f"{chunk['text']}\n"
            "---"
        )

    system_prompt = (
        "Answer only from the provided context. "
        "Prefer the most direct operational source over related background or onboarding material. "
        "If a source says it is out of scope for the user's task, do not use it as the main procedure. "
        "If the evidence is incomplete or conflicting, say so clearly. "
        "End with a short Sources section."
    )
    user_prompt = f"""
Question:
{question}

Retrieved context:
{chr(10).join(context_blocks)}
""".strip()

    return call_text_model(system_prompt, user_prompt, max_tokens=900)
```

Run the same Lambda test event again.

This code does not add new facts. It changes the context shape:

- the highest-scoring evidence appears first
- each evidence block has a source and score
- separators make chunk boundaries explicit
- the instruction tells the model how to treat competing evidence

### Step 4: Compare the Answers

The stronger answer should be closer to this shape:

1. create a new secret in AWS Secrets Manager
2. update `WEBHOOK_SIGNING_SECRET` for `Webhook Gateway`
3. deploy the configuration change
4. validate signed webhook delivery
5. check for `WebhookSignatureValidationFailed`
6. revoke the old provider secret after validation

It should not include first-time onboarding steps such as registering a provider endpoint or mapping provider event types.

That is the point of the lab. Prompt design is not about making the model sound better. It is about making the evidence harder to misuse.

### What This Lab Should Teach You

By the end of this lab, you should have seen that:

- the same retrieved evidence can produce different answers depending on context assembly
- source labels and separators reduce evidence blending
- ordering matters when one source should dominate the answer
- a short instruction about source authority can be more useful than a long generic prompt

In the next post, I will look at how to evaluate whether the system is actually working. Without that discipline, every improvement is just a guess with good formatting.
