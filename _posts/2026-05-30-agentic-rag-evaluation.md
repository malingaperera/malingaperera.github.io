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

If you want the short version first, jump to [A Practical Default](#a-practical-default).

## Start With a Small Gold Set

You do not need a giant benchmark to begin.

For the engineering assistant with AWS in this series, a useful first evaluation set should reflect the exact kinds of questions we have been using:

- direct factual lookup questions
- operational procedure questions
- cross-service reasoning questions
- near-miss questions where a generic document should not beat the right runbook
- questions that should return "not enough evidence"
- questions that documents alone cannot answer because they need structured state

For each question, capture:

- the expected answer shape
- the acceptable supporting sources
- whether the answer requires one document or several

This already gives you something much more useful than ad hoc testing.

For the sample dataset in this series, a first evaluation set could look like this:

| Question | Type | Expected primary sources | Notes |
| --- | --- | --- | --- |
| Which service publishes invoice events? | direct lookup | `invoice-events-overview.md` | Should be answered from one dominant source |
| How do we rotate the webhook signing secret? | operational | `webhook-secret-rotation.md` | `webhook-onboarding-guide.md` is a near miss, not the best answer |
| What retries happen after a payment failure? | operational | `payment-retry-runbook.md` | Good for chunking and retrieval evaluation |
| What happens after a payment failure, which events are published, and which service eventually sends the customer notification? | multi-hop | `payment-failure-handling.md`, `invoice-events-overview.md`, `customer-notification-flow.md` | Good for agentic and context-assembly evaluation |
| Which document explains the internal eventing platform? | background lookup | `eventing-platform-overview.md` | Should not drift to onboarding docs |
| Which service publishes refund events? | not enough evidence | none | The system should say the evidence is insufficient |
| Which service publishes invoice events, and is it currently enabled in production? | tool-needed boundary | `invoice-events-overview.md` for first half only | The second half needs structured state, not documents alone |

## Separate Retrieval Quality From Answer Quality

One of the biggest mistakes in RAG evaluation is to treat the final answer as one indivisible result.

That hides the real failure mode.

A bad answer can come from:

- bad retrieval
- decent retrieval but poor ranking
- good evidence but weak prompting
- good evidence and prompt, but poor agent behavior

A practical split is:

- retrieval evaluation: did the right evidence show up?
- grounding evaluation: did the answer actually use the evidence?
- final usefulness evaluation: was the answer clear and operationally helpful?
- agent evaluation: did the extra retrieval or decomposition steps help, or just add noise and latency?

That separation matters even more in this series because by post 8 we have both:

- a single-pass Bedrock knowledge base path
- a small Lambda-based multi-step path

Those should not be judged as though they are the same system behavior.

## Look at Failures by Category

A simple error taxonomy is much more useful than a vague failure count.

For example:

- wrong document retrieved
- right document retrieved, wrong chunk chosen
- relevant chunk present, but ranked too low
- evidence present, but answer ignored it
- conflicting evidence present, but answer flattened it incorrectly
- context assembly included too many weak chunks
- final prompt preserved too little source identity
- agent took extra steps that added noise rather than value

This kind of categorization tells you where to intervene.

If most failures are retrieval failures, do not spend a week tuning the final prompt.

## Include Negative and Boundary Cases

A good evaluation set should not only contain answerable questions.

It should also contain:

- questions with incomplete evidence
- questions phrased poorly
- questions that tempt the model to overstate confidence
- questions that need a real tool rather than more document retrieval

These cases matter because production systems fail at boundaries, not just at the happy path.

For the sample dataset, two especially useful boundary cases are:

- "Which service publishes refund events?" because the dataset does not contain that answer
- "Which service publishes invoice events, and is it currently enabled in production?" because the second half needs a real tool or structured lookup

Those questions test two different failure modes:

- unsupported answer generation
- pretending documents can answer a stateful operational question

## Manual Review Still Matters Early

At the beginning, manual review is usually the most honest tool you have.

That may sound unsophisticated, but it is often the fastest way to see whether the system is grounded, useful, and safe enough for real use.

A disciplined manual review process can answer questions like:

- did retrieval include the right evidence?
- did the answer preserve important qualifiers?
- did the answer miss a better source?
- did the agent take unnecessary steps?

At this stage of the series, I would absolutely keep the first evaluation loop manual. The dataset is small, the question set is manageable, and the point is to learn where the system fails before automating the scorekeeping.

## A Simple Review Rubric

Manual review works best when the rubric is explicit.

For each question, I would score four things:

1. retrieval quality
2. grounding quality
3. answer usefulness
4. agent behavior, only when the multi-step path is used

A simple rating scale such as `good / partial / bad` is enough for a first pass.

The questions behind those ratings are straightforward:

- retrieval quality: did the right source documents appear?
- grounding quality: did the answer stay anchored to those sources?
- answer usefulness: would an engineer actually trust and use this answer?
- agent behavior: did the extra steps improve the outcome enough to justify their cost?

This rubric is what I would use to create and maintain the gold set. The automated layer should then score that same set consistently over time.

But manual review is not enough.

Once the system starts changing regularly, you need automated evaluation as well. Otherwise every model change, prompt change, chunking change, or document refresh turns into another round of subjective spot checks.

## Use Bedrock RAG Evaluations for Automated Checks

Amazon Bedrock now gives you a managed evaluation path that is directly relevant to this series: RAG evaluations.

This is the first automation path I would add because it is designed for the exact thing we are building: a knowledge base plus optional answer generation.

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

## AWS-Native Evaluation vs Open-Source Tooling

For this series, my default recommendation is still AWS-native first:

- use Bedrock RAG evaluations for repeatable offline scoring
- use Bedrock Guardrails grounding checks for runtime protection

That is the lowest-friction path when your stack already lives mostly inside Bedrock.

But that is not the only serious option. The current evaluation landscape is broader, and a few tools are common enough to be worth knowing.

### RAGAS

`RAGAS` is one of the best-known open-source RAG evaluation frameworks. It became popular because it gives teams a practical way to score things like faithfulness, answer relevance, and context relevance without needing a fully managed platform.

It is a strong fit when:

- you want open-source, code-driven evaluation
- you want to run evaluations inside notebooks, scripts, or your own CI jobs
- you do not want your evaluation workflow to depend entirely on one cloud console

### LangSmith

`LangSmith` is especially useful when evaluation, tracing, datasets, and experiments need to live together.

It is a strong fit when:

- you already use LangChain or LangGraph
- you want dataset-based experiments plus evaluation history
- you want evaluation to stay tightly connected to traces and application debugging

### Phoenix

`Phoenix` is strong when you care about both evaluation and observability.

It is a strong fit when:

- you want to inspect traces, retrieval behavior, and evaluation results in one place
- you want both code-driven and UI-driven evaluation flows
- you expect to evaluate production traces, not only offline datasets

### DeepEval

`DeepEval` is strong when you want a testing-oriented workflow and many built-in metrics.

It is a strong fit when:

- you want evaluation to feel closer to unit and regression testing
- you want to run LLM evaluation inside CI
- you want a broad metric toolbox without building each evaluator yourself

The important pattern across these tools is more interesting than the brand names:

- a gold dataset
- LLM-as-a-judge or rubric-based metrics
- regression tracking across versions
- some form of tracing or observability
- automation in CI, scheduled jobs, or production sampling

That is what "state of the art" looks like in practice right now. It is less about one magic framework and more about combining dataset-based evaluation, tracing, and automated regression checks.

For this series, I would still start with Bedrock RAG evaluations because they fit the stack directly. Then I would look at RAGAS, LangSmith, Phoenix, or DeepEval if the team wants:

- more control
- cross-platform portability
- richer tracing and experiment management
- a stronger code-first evaluation workflow

## Your Test Set Is the Asset

The most valuable part of evaluation is not the code that runs the checks. It is the curated question set with known expectations.

Evaluation code can be replaced.

Your test set is harder to build and far more valuable over time.

A good test set should grow from:

- the sample questions you started with in this series
- real user queries that exposed weak behavior
- new documents added to the corpus
- boundary cases that failed in production or pre-release testing

The practical implication is simple: treat the gold set as a living artifact, not a one-time spreadsheet.

## Automate on Three Triggers

For this kind of system, I would automate evaluation on three triggers.

### 1. When data changes

If new documents are added or existing ones are updated, rerun evaluation after the knowledge base sync.

This catches:

- new content conflicting with existing content
- broken metadata on newly uploaded files
- chunking behavior that works poorly on new document shapes

### 2. When code or configuration changes

If you change:

- prompt instructions
- context assembly logic
- chunking settings
- embedding model
- retrieval parameters
- agent behavior

then rerun the evaluation suite before you trust the new configuration.

This is the cleanest way to stop regressions from slipping through on a deploy.

### 3. At runtime

Production behavior always drifts away from lab behavior eventually.

So even after release, keep lightweight runtime monitoring for things like:

- low retrieval scores
- groundedness failures
- latency regressions
- new query patterns your gold set did not cover

That does not have to mean heavy real-time judging on every request, but it does mean you should be collecting enough traces to notice drift.

## Online Evaluation Should Stay Lightweight

Once the system is used by real engineers, you want some form of production feedback. But that does not require a heavy platform immediately.

A simple starting point may include:

- thumb-up or thumb-down signals
- source usefulness feedback
- sampled review of failed or uncertain answers
- tracing of retrieval and prompt context for investigation

The key is not to confuse raw feedback volume with diagnostic quality. A hundred "bad answer" clicks help less than ten carefully reviewed failure traces.

This is the lightweight, runtime side of evaluation. The final post on production operations goes deeper into observability, monitoring, and runtime grounding checks.

## A Practical Default

For a first serious version of the engineering assistant with AWS, I would start with:

- a small but representative gold set
- a manual review rubric
- Bedrock RAG evaluations for automated regression checks
- separate retrieval and answer assessment
- an error taxonomy that can be applied consistently
- lightweight production feedback after release

That setup is enough to make real engineering decisions.

## Hands-on Lab

This lab evaluates the system you built in posts 2 to 8.

The goal is not to invent a fancy benchmark platform. The goal is to create a repeatable manual evaluation loop that can tell you whether a change actually helped.

### Step 1: Create a Small Evaluation Sheet

Create a simple spreadsheet or markdown table with these columns:

- question
- type
- expected primary sources
- retrieval quality
- grounding quality
- answer usefulness
- agent behavior
- notes

Use at least these questions from the sample dataset:

- "Which service publishes invoice events?"
- "How do we rotate the webhook signing secret?"
- "What retries happen after a payment failure?"
- "What happens after a payment failure, which events are published, and which service eventually sends the customer notification?"
- "Which service publishes refund events?"
- "Which service publishes invoice events, and is it currently enabled in production?"

### Step 2: Run the Single-Pass Baseline First

For each question, use the Bedrock knowledge base test console first.

Check:

- retrieval-only output
- retrieve-and-generate output

Record:

- whether the expected source documents appeared
- whether the answer stayed grounded
- whether the answer was useful or misleading

This gives you the non-agentic baseline.

### Step 3: Run the Multi-Step Lambda on the Same Questions

Now run the same set through the Lambda from post 7 for the questions where multi-step behavior might help.

The most important comparison question is:

- "What happens after a payment failure, which events are published, and which service eventually sends the customer notification?"

For that question, compare:

- the single-pass answer from the knowledge base
- the multi-step answer from the Lambda

Then score whether the extra decomposition and retrieval steps actually improved the result.

### Step 4: Turn the Gold Set into a Prompt Dataset

Now convert that manually reviewed question set into a RAG evaluation prompt dataset in S3.

Amazon Bedrock expects JSONL for this. A minimal retrieve-and-generate example looks like:

```json
{"conversationTurns":[{"prompt":{"content":[{"text":"Which service publishes invoice events?"}]},"referenceResponses":[{"content":[{"text":"Invoice Service is the canonical publisher for invoice-domain events."}]}],"referenceContexts":[{"content":[{"text":"Invoice Service is the canonical publisher for invoice-domain events."}]}]}]}
```

If you want to evaluate your own response data instead of letting Bedrock invoke the knowledge base, Bedrock also supports that. This is particularly useful for the Lambda-based agentic path from post 7, because you can evaluate your own RAG outputs directly instead of pretending they came from a single knowledge base call.

Upload the JSONL dataset to S3. That becomes the input to your automated evaluation jobs.

### Step 5: Create a Bedrock RAG Evaluation Job

In the Bedrock console:

1. open `Inference and assessment`
2. choose `Evaluations`
3. choose `RAG evaluations`
4. select either:
   - `Retrieve only` for retrieval scoring
   - `Retrieve and generate` for end-to-end scoring
5. point the job at:
   - your Bedrock Knowledge Base, or
   - your own inference response data
6. choose the built-in metrics relevant to what you are testing
7. choose an evaluator model
8. run the job and review the report

For this series, a sensible first split is:

- run `Retrieve only` to check the KB baseline
- run `Retrieve and generate` to check the final answer path
- run a separate evaluation on the Lambda outputs when you want to compare the multi-step path

This gives you an automated report card instead of relying only on ad hoc manual judgments.

### Step 6: Mark the Failure Category, Not Just the Score

For every `partial` or `bad` result, add one dominant failure label such as:

- wrong document
- weak ranking
- answer ignored evidence
- prompt/context issue
- unnecessary agent step
- missing evidence
- tool needed

This is the part that turns review into engineering guidance. A low score alone does not tell you what to fix next.

### Step 7: Compare Similar Questions That Should Behave Differently

Now compare pairs like these:

- "How do we rotate the webhook signing secret?" versus the generic webhook onboarding material
- "Which service publishes invoice events?" versus "Which service publishes invoice events, and is it currently enabled in production?"

The first pair tests whether the system prefers the right operational source over a near miss.

The second pair tests whether the system knows the boundary between document retrieval and live structured state.

### Step 8: Add One Lightweight Automated Pipeline

Each team will choose its own automation path, but the minimum useful pattern is straightforward:

- store the gold-set JSONL file in S3
- trigger an evaluation job on a schedule
- trigger another evaluation job after important data or code changes
- store the results for history
- alert when key metrics drop below your threshold

A simple AWS-shaped version looks like this:

- `EventBridge` scheduled rule or deploy trigger
- `Lambda` or pipeline step that starts the evaluation job
- evaluation report stored in S3
- summary metrics pushed to CloudWatch
- `SNS` or Slack alert if scores fall below the agreed threshold

That is enough to detect regressions without forcing every team into the same implementation.

### Step 9: Add Runtime Grounding Checks

For production, a useful complement to offline evaluation is Amazon Bedrock Guardrails with contextual grounding checks.

This is not a replacement for offline evaluation. It is a runtime safety layer that can assess:

- whether the response is grounded in the provided source
- whether the response is relevant to the user's query

That makes it a good production companion to the offline metrics like faithfulness and correctness.

### Step 10: Summarize What Helped and What Hurt

At the end of the lab, do not just count wins and losses.

Write down conclusions like:

- metadata filters improved direct service-specific questions
- reranking helped when the right documents were present but poorly ordered
- the agentic Lambda helped the multi-hop payment-failure question
- the agentic Lambda did not help simple one-document questions enough to justify the extra steps
- prompt tightening improved grounding when near-miss documents were retrieved
- automated RAG evaluation caught regressions that ad hoc spot checks would have missed

Those are the kinds of conclusions that should drive the next system change.

### What This Lab Should Teach You

By the end of this lab, you should have a clearer sense of:

- how to evaluate the system without relying on cherry-picked demos
- how to separate retrieval, prompting, and agent behavior failures
- why unsupported and tool-needed questions belong in the evaluation set
- why manual review is still the right first step, but not the whole evaluation strategy
- how Bedrock RAG evaluations can automate repeatable scoring
- why evaluation should run on data changes, code changes, and production drift
- how to decide whether a system change actually improved the parts that matter

## What Good Evaluation Changes

Evaluation does not just tell you whether the system is good. It tells you which part of the system is not good enough yet.

That is the real value.

Without it, system changes become opinion battles. With it, you can say things like:

- chunking improved retrieval but hurt ranking precision
- reranking improved ordering without changing recall
- agent planning helped multi-hop questions but slowed simple lookups
- context assembly improved grounding without changing retrieval
- stricter prompting reduced confident unsupported answers

Those are actionable conclusions.

In the final post of the series, I will move from measurement to operations: freshness, security, observability, failure handling, and cost control in production.
