---
layout: post
title: "Agentic RAG with AWS 9: Evaluation, How to Know Whether the System Is Good"
date: 2026-05-30
description: A practical evaluation framework for measuring retrieval and answer quality in an agentic RAG system.
tags: rag agents aws llm evaluation
categories:
  - artificial intelligence
thumbnail: assets/images/2026-05-30-agentic-rag-evaluation/agentic-rag-evaluation.png
og_image: assets/images/2026-05-30-agentic-rag-evaluation/agentic-rag-evaluation.png
giscus_comments: false
published: true
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/2026-05-30-agentic-rag-evaluation/agentic-rag-evaluation.png" class="img-fluid rounded z-depth-1 mx-auto d-block" alt="Agentic RAG evaluation flow showing a gold set, retrieval checks, answer scoring, and regression monitoring" zoomable=true %}
    </div>
</div>

In the previous post, we improved the final stage of the system: how retrieved evidence is assembled, ordered, and prompted before the model answers. With that in place, the whole pipeline now exists end to end, from documents in S3 through chunking, retrieval, optional agentic decomposition, and final answer generation. The question is no longer whether we can build it, but whether it actually works.

That is harder than it sounds, because RAG systems are easy to demonstrate and hard to measure. You can always find a question that makes the system look impressive; the real test is whether it holds up across the questions that matter. Without a disciplined test loop, teams end up arguing from anecdotes like "it felt better after we changed the prompt" or "the new embedding model seems smarter." Those impressions may even be correct, but they are not engineering evidence.

This post answers five practical questions:

1. What should be in the gold set?
2. How do you evaluate retrieval separately from final answer quality?
3. Which failures should be categorized explicitly?
4. How can Bedrock RAG evaluations and open-source tools automate checks?
5. When should evaluation run automatically?

Throughout, it helps to keep two modes in mind. Offline evaluation scores the system against a fixed gold set, and that is where you make most engineering decisions. Online evaluation watches real production traffic after release. Most of this post is about the offline loop; the online side is lighter and leads into the final post on operations.

## Start With a Small Gold Set

You do not need a giant benchmark to begin.

For the engineering assistant with AWS in this series, a useful first evaluation set should reflect the exact kinds of questions we have been using:

- direct factual lookups
- operational procedures
- cross-service reasoning
- near-miss questions (a generic doc should not beat the right runbook)
- "not enough evidence" cases
- questions that need the current state of the system, not just documents

For each question, capture:

- its type
- the expected primary sources
- the expected answer shape

This already gives you something much more useful than ad hoc testing.

For the sample dataset in this series, a first evaluation set could look like this:

| Question | Type | Expected primary sources | Answer shape |
| --- | --- | --- | --- |
| Which service publishes invoice events? | direct lookup | `invoice-events-overview.md` | One service name, from a single dominant source |
| How do we rotate the webhook signing secret? | operational | `webhook-secret-rotation.md` | The rotation procedure from the runbook, not the onboarding guide |
| What retries happen after a payment failure? | operational | `payment-retry-runbook.md` | A short description of the retry steps |
| What happens after a payment failure, which events are published, and which service eventually sends the customer notification? | multi-hop | `payment-failure-handling.md`, `invoice-events-overview.md`, `customer-notification-flow.md` | A synthesized answer tracing the failure event to the notifying service across all three sources |
| Which document explains the internal eventing platform? | background lookup | `eventing-platform-overview.md` | The name of the overview document, without drifting to onboarding docs |
| Which service publishes refund events? | not enough evidence | none | An explicit "not enough evidence" answer |
| Which service publishes invoice events, and is it currently enabled in production? | tool-needed boundary | `invoice-events-overview.md` for first half only | The publisher from documents, plus a note that the production status needs a live lookup |

It is worth adding at least one deliberately unhappy-path question, not just questions the system should answer well. The refund-events row has no answer in the corpus, so the right response is to say so. The invoice-plus-production row can be half-answered from documents, but its second part needs a live lookup they cannot provide. Together they check two behaviors happy-path questions never exercise: refusing when evidence is missing, and flagging when a question needs a tool rather than more retrieval.

This set, not the code that scores it, is the real asset: treat it as a living artifact that grows from real user queries, new documents, and cases that failed in production, rather than a one-time spreadsheet.

## Separate the Types of Evaluation

One of the biggest mistakes in RAG evaluation is to treat the final answer as one indivisible result and score it with a single pass-or-fail judgment. A bare count of good and bad answers tells you the system is imperfect, but not where it broke or what to fix.

The way out is to run a few distinct types of evaluation, each aimed at a different stage of the pipeline. The point of splitting them is not tidiness. It is that each type collects different signals, so a failure comes back labeled with a likely cause instead of just a lower score:

- **Retrieval evaluation** asks whether the right evidence showed up, at a usable rank. It surfaces failures like the wrong document being retrieved, the right document but the wrong chunk, or a relevant chunk ranked too low to matter.
- **Grounding evaluation** asks whether the answer actually used the evidence it was given. It surfaces answers that ignored retrieved evidence, or that flattened conflicting sources into one confident but wrong claim.
- **Answer usefulness evaluation** asks whether the final answer was clear and operationally helpful. It surfaces answers that are technically grounded but vague, incomplete, or hard to act on, often because the context was padded with weak chunks or lost track of which source said what.
- **Agent evaluation** asks whether the extra retrieval or decomposition steps earned their cost. It surfaces multi-step runs that added latency and noise without improving the answer.

This is what makes the split worth the effort. If most failures land under retrieval evaluation, there is no point spending a week tuning the final prompt. The type that caught the failure tells you which layer to fix.

## Manual Review Still Matters Early

At the beginning, manual review is usually the most honest tool you have. That may sound unsophisticated, but it is often the fastest way to see whether the system is grounded, useful, and safe enough for real use. At this stage of the series, I would absolutely keep the first evaluation loop manual: the dataset is small, the question set is manageable, and the point is to learn where the system fails before automating the scorekeeping.

Manual review works best when the rubric is explicit. For each question, I would score the same four dimensions the evaluation types describe, on a simple `good / partial / bad` scale:

1. retrieval quality: did the right source documents appear?
2. grounding quality: did the answer stay anchored to those sources?
3. answer usefulness: would an engineer actually trust and use this answer?
4. agent behavior: did the extra steps improve the outcome enough to justify their cost? (only when the multi-step path is used)

This rubric is what I would use to create and maintain the gold set, but manual review is not enough on its own. Once the system starts changing regularly, you need an automated layer to score that same set consistently over time. Otherwise every model change, prompt change, chunking change, or document refresh turns into another round of subjective spot checks.

## Automate the Scoring

Once manual spot checks stop scaling, you want automated, repeatable scoring against the gold set. Two families are worth knowing: AWS-native evaluation built into Bedrock, and the broader open-source tooling ecosystem. When your stack already lives mostly inside Bedrock, the AWS-native path is the lowest-friction place to start.

### AWS-Native: Bedrock RAG Evaluations

Amazon Bedrock now gives you a managed evaluation path that is directly relevant to this series: RAG evaluations.

This is the first automation path I would add because it is designed for the exact thing we are building: a knowledge base plus optional answer generation.

It runs against the same gold set you built earlier. You export those questions, with their expected answers and supporting sources, as a JSONL prompt dataset, and the job scores the system's responses against them. The hands-on lab walks through that export.

There are two evaluation job types:

- `Retrieve only`, which evaluates just the retrieval stage
- `Retrieve and generate`, which evaluates the full RAG path

For retrieve-only evaluation, Bedrock provides built-in metrics such as:

- `Builtin.ContextRelevance`
- `Builtin.ContextCoverage`

In plain terms, context relevance asks whether the retrieved passages are actually on topic for the question, while context coverage asks whether they contain enough of the information needed to answer it.

For retrieve-and-generate evaluation, Bedrock provides built-in metrics such as:

- `Builtin.Correctness`
- `Builtin.Completeness`
- `Builtin.Helpfulness`
- `Builtin.LogicalCoherence`
- `Builtin.Faithfulness`
- `Builtin.CitationPrecision`
- `Builtin.CitationCoverage`
- `Builtin.Harmfulness`
- `Builtin.Stereotyping`
- `Builtin.Refusal`

The names that matter most in practice are faithfulness, which asks whether the answer stayed grounded in the retrieved evidence instead of inventing details; correctness and completeness, which ask whether the answer is right and whole; citation precision and coverage, which ask whether the cited sources are the ones actually used and whether every used source was cited; and refusal, which asks whether the system correctly declined when the evidence was missing.

This matters because it lets you automate much more than "did the answer look okay to me?" You can score both retrieval quality and answer quality in a repeatable way.

One caveat applies to all of these scores: most of them are produced by an evaluator model, not a human. That is what makes them scalable, but it also means the judge can be wrong, biased toward longer or more confident answers, or inconsistent between runs. Treat automated scores as a fast regression signal rather than ground truth, and periodically check the judge against your own manual ratings on a handful of questions. Those evaluator-model calls also cost money, so scope the suite and how often it runs deliberately instead of scoring everything on every change.

Another important detail is that Bedrock can evaluate either:

- an Amazon Bedrock Knowledge Base directly
- your own inference response data from an external RAG path

That means it can fit both parts of this series:

- the single-pass Bedrock knowledge base path
- the custom Lambda-based multi-step path from post 7

### Open-Source Tooling

Bedrock is not the only serious option. The current evaluation landscape is broader, and a few tools are common enough to be worth knowing, even though this series stays on the AWS-native path:

- `RAGAS` — an open-source, code-driven framework that scores faithfulness, answer relevance, and context relevance from notebooks, scripts, or CI, with no managed platform required.
- `LangSmith` — keeps evaluation, tracing, datasets, and experiments together; a natural fit if you already use LangChain or LangGraph.
- `Phoenix` — pairs evaluation with observability across code- and UI-driven flows, and is built to evaluate production traces, not just offline datasets.
- `DeepEval` — a testing-oriented toolkit with many built-in metrics, designed to run LLM evaluation inside CI like unit and regression tests.

The brand names matter less than the shared pattern: a gold dataset, LLM-as-a-judge or rubric metrics, regression tracking across versions, some tracing, and automation in CI or scheduled jobs. For this series I would still start with Bedrock RAG evaluations because they fit the stack directly, and reach for one of these only when the team wants more control, cross-platform portability, or richer tracing and experiment management.

## Online Evaluation Should Stay Lightweight

Once the system is used by real engineers, you want some form of production feedback. But that does not require a heavy platform immediately.

A simple starting point may include:

- thumb-up or thumb-down signals
- source usefulness feedback
- sampled review of failed or uncertain answers
- tracing of retrieval and prompt context for investigation

The key is not to confuse raw feedback volume with diagnostic quality. A hundred "bad answer" clicks help less than ten carefully reviewed failure traces.

This is the lightweight, runtime side of evaluation. The final post on production operations goes deeper into observability, monitoring, and runtime grounding checks.

## When to Run Evaluation

Automate evaluation on three triggers:

- **When data changes** — rerun after a knowledge base sync, so new or updated documents cannot quietly introduce conflicting content, broken metadata, or chunking that works poorly on new document shapes.
- **When code or configuration changes** — rerun the suite before trusting any change to prompts, chunking, embedding model, retrieval parameters, or agent behavior. This is the cleanest way to stop regressions slipping through on a deploy.
- **At runtime** — keep the lightweight production monitoring described above, so you notice drift, low retrieval scores, or groundedness failures after release.

## Hands-on Lab

This lab evaluates the system you built in posts 2 to 8.

The goal is not to invent a fancy benchmark platform. The goal is to create a repeatable manual evaluation loop that can tell you whether a change actually helped.

### Step 1: Manually Validate Single-Pass vs Multi-Step

Before automating anything, score the system by hand. The dataset is small, so a manual pass is the fastest way to see where it fails and to build the baseline every later step compares against.

Start from a simple evaluation sheet. You can download a ready-made one here: [agentic-rag-evaluation-sheet.csv]({{ '/assets/files/agentic-rag/agentic-rag-evaluation-sheet.csv' | relative_url }}). It has a row per question and two scoring areas, one for the single-pass knowledge base path and one for the multi-step Lambda path, each rated on retrieval, grounding, and answer usefulness, plus a column for the dominant failure.

A couple of example rows look like this:

| Question | Type | Expected sources | Single-pass | Multi-step | Dominant failure |
| --- | --- | --- | --- | --- | --- |
| Which service publishes invoice events? | direct lookup | `invoice-events-overview.md` | retrieval:<br>grounding:<br>answer usefulness: | retrieval:<br>grounding:<br>answer usefulness: | |
| What happens after a payment failure, which events are published, and which service eventually sends the customer notification? | multi-hop | `payment-failure-handling.md`, `invoice-events-overview.md`, `customer-notification-flow.md` | retrieval:<br>grounding:<br>answer usefulness: | retrieval:<br>grounding:<br>answer usefulness: | |

The downloadable sheet includes all the gold-set questions, not just these two.

Fill the **single-pass** column first. Run each question through the Bedrock knowledge base test console. If you have not used it before, the post 5 lab covers the exact console steps for both [retrieval-only and retrieve-and-generate testing]({{ '/agentic-rag-vector-database-selection/#step-5-test-retrieval-first' | relative_url }}). Record whether the expected sources appeared, whether the answer stayed grounded, and whether it was actually useful. This is your non-agentic baseline.

Then fill the **multi-step** column by running the same questions through the Lambda from post 7, focusing on the ones where decomposition could plausibly help. The clearest comparison is the multi-hop payment-failure question: score whether the extra decomposition and retrieval steps improved the answer enough to justify the added latency, or just added noise. For simple one-document questions, multi-step usually should not change much, and that is a useful result to record too.

When a path scores partial or bad, note the single biggest cause in the `dominant failure` column, such as `wrong document`, `weak ranking`, `answer ignored evidence`, `prompt/context issue`, `unnecessary agent step`, `missing evidence`, or `tool needed`.

This manual pass is your baseline. Everything after this automates and scales what you just did by hand.

### Step 2: Turn the Gold Set into a Prompt Dataset

Now turn the evaluation sheet you filled in Step 1 into a RAG evaluation prompt dataset in S3. Each row becomes one line of JSONL: the question becomes the prompt, the answer you confirmed as correct during the single-pass review becomes the reference response, and the expected source becomes the reference context.

Amazon Bedrock expects JSONL for this. A minimal retrieve-and-generate example, built from the first row of the sheet, looks like:

```json
{"conversationTurns":[{"prompt":{"content":[{"text":"Which service publishes invoice events?"}]},"referenceResponses":[{"content":[{"text":"Invoice Service is the canonical publisher for invoice-domain events."}]}],"referenceContexts":[{"content":[{"text":"Invoice Service is the canonical publisher for invoice-domain events."}]}]}]}
```

A ready-made dataset covering all the gold-set questions is available here: [agentic-rag-evaluation-dataset.jsonl]({{ '/assets/files/agentic-rag/agentic-rag-evaluation-dataset.jsonl' | relative_url }}). The reference answers and contexts in it are starter values written against the sample dataset, so adjust them to match your own documents before you rely on the scores.

If you want to evaluate your own response data instead of letting Bedrock invoke the knowledge base, Bedrock also supports that. This is particularly useful for the Lambda-based agentic path from post 7, because you can evaluate your own RAG outputs directly instead of pretending they came from a single knowledge base call.

Upload the JSONL dataset to S3. That becomes the input to your automated evaluation jobs.

### Step 3: Create a Bedrock RAG Evaluation Job

In the Bedrock console:

1. open `Inference and assessment`
2. choose `Evaluations`
3. choose `RAG evaluations`
4. select either:
   - `Retrieve only` for retrieval scoring
   - `Retrieve and generate` for end-to-end scoring
5. choose the JSONL prompt dataset you uploaded in Step 2 as the evaluation input
6. point the job at:
   - your Bedrock Knowledge Base, or
   - your own inference response data
7. choose the built-in metrics relevant to what you are testing
8. choose an evaluator model
9. set an S3 output location, run the job, and review the report

For this series, a sensible first split is:

- run `Retrieve only` to check the KB baseline
- run `Retrieve and generate` to check the final answer path
- run a separate evaluation on the Lambda outputs when you want to compare the multi-step path

This gives you an automated report card instead of relying only on ad hoc manual judgments.

When the job finishes, Bedrock writes the results to the S3 output location and shows a summary in the console, at two levels of detail.

The first level is an aggregate score per metric across the whole dataset, for example:

| Metric | Average score |
| --- | --- |
| Context relevance | 0.82 |
| Context coverage | 0.74 |
| Faithfulness | 0.91 |
| Correctness | 0.79 |
| Completeness | 0.68 |
| Refusal | 1.00 |

Scores are normalized to roughly 0 to 1, where higher is better, so this is the view that tells you which dimension is weakest overall.

The second level is a per-question breakdown. For each prompt you can see the generated answer, the retrieved context it was scored against, the score for each metric, and the evaluator model's short explanation for why it scored that way.

To use the report, read the aggregate scores first to find the weakest dimension, then drill into the low-scoring rows:

- a low `Context relevance` or `Context coverage` points at retrieval, not the prompt
- a high context score but low `Faithfulness` points at grounding or prompt assembly
- low `Completeness` on the multi-hop question usually means a missing sub-answer
- `Refusal` should stay high on the refund-events row; if it drops, the system is answering a question it has no evidence for

The per-question explanations are what make this actionable. A low score alone does not tell you what to fix, but the explanation, plus the failure label you recorded in the sheet, does. Keep the aggregate scores from each run, too: a drop after a prompt, chunking, or model change is your regression signal.

### Step 4: Summarize What Helped and What Hurt

At the end of the lab, do not just count wins and losses.

Write down conclusions like:

- metadata filters improved direct service-specific questions
- reranking helped when the right documents were present but poorly ordered
- the agentic Lambda helped the multi-hop payment-failure question
- the agentic Lambda did not help simple one-document questions enough to justify the extra steps
- prompt tightening improved grounding when near-miss documents were retrieved
- automated RAG evaluation caught regressions that ad hoc spot checks would have missed

Those are the kinds of conclusions that should drive the next system change.

## Final Thoughts

Evaluation is what turns system changes from opinion battles into engineering decisions. It does not just tell you whether the system is good; it tells you which part is not good enough yet, so you can say concrete things like chunking improved retrieval but hurt ranking precision, reranking reordered evidence without changing recall, or the agentic path helped multi-hop questions while slowing simple lookups. With a gold set, a clear split between retrieval and answer quality, and a repeatable scoring loop, every later change becomes measurable instead of anecdotal.

In the final post of the series, I move from measuring the system to operating it: freshness, security, observability, failure handling, and cost control in production.
