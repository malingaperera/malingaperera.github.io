---
layout: post
title: "Agentic RAG with AWS 3: Chunking Strategy, Size, Overlap, and Boundaries"
date: 2026-04-18
description: How chunk size and document boundaries affect retrieval quality, noise, and context usefulness.
tags: rag agents aws llm chunking
categories:
  - artificial intelligence
thumbnail: assets/images/2026-04-18-agentic-rag-chunking-strategy/agentic-rag-chunking-strategy.svg
og_image: assets/images/2026-04-18-agentic-rag-chunking-strategy/agentic-rag-chunking-strategy.png
giscus_comments: false
published: true
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/2026-04-18-agentic-rag-chunking-strategy/agentic-rag-chunking-strategy.svg" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

Chunking sounds like a small implementation detail. **In practice, it decides what your retrieval system is even capable of finding.**

In the previous post, we organized the source data in S3 and deliberately grouped `processed/` documents by the chunking strategy we expect to use. This post explains what that choice means and how to make it without guessing.

If chunks are too large, retrieval becomes coarse. If they are too small, the system loses context. If boundaries ignore document structure, you end up retrieving fragments that are technically related but not actually useful.

For the AWS engineering assistant in this series, chunking matters because the documents are heterogeneous. A runbook is not shaped like an architecture decision record (ADR). An API reference is not shaped like an incident review. A payment retry explanation may include both narrative text and a numbered operational procedure. If chunking treats all of that as one flat stream, retrieval quality drops.

This post answers five practical questions:

1. Why does chunking matter for retrieval quality?
2. Which chunking strategies should you consider in Bedrock Knowledge Bases?
3. How should chunk size and overlap be selected?
4. When do different document types need different chunking rules?
5. How do you detect that chunking is hurting retrieval?

If you want the short version first, jump to [A Practical Default](#a-practical-default).

## Why Chunking Exists

Most knowledge systems cannot retrieve and embed entire long documents as the basic unit of reasoning. The search layer needs smaller pieces that can stand on their own.

A chunk is that unit.

The ideal chunk has two properties:

- it is small enough to be retrieved precisely
- it is large enough to remain meaningful without the entire original document

**That balance is the real chunking problem.**

## Fixed-Size Chunking Is a Good Baseline, Not a Good Ending

The simplest approach is fixed-size chunking, often based on characters, words, or tokens, with optional overlap.

Its strengths are obvious:

- easy to implement
- predictable output size
- easy to reason about operationally

Its weakness is just as obvious: documents do not naturally think in equal-length windows.

If a heading, procedure, and warning note are cut across arbitrary boundaries, retrieval may surface a chunk that contains half the explanation and none of the operational constraint that makes it safe.

For a quick prototype, fixed-size chunking is acceptable. **For a production knowledge assistant, it should usually be the fallback, not the goal.**

## Structure-Aware Chunking Usually Produces Better Evidence

**A better default is to respect document structure whenever it is available.**

For example:

- use headings and subheadings as natural boundaries
- keep code blocks intact
- keep numbered procedures intact when possible
- treat tables carefully instead of flattening them blindly

This matters because the user rarely needs "a random 500-token window." They need a coherent section that explains one idea or one procedure.

For the running AWS example, a runbook section titled "Rotate webhook signing secret" is already a natural retrieval unit. Splitting it halfway through a checklist makes the final answer weaker and more error-prone.

## Chunk Size: Small Improves Precision, Large Preserves Context

There is no universal right size, but the tradeoff is stable.

Smaller chunks tend to:

- improve retrieval precision
- reduce unrelated context
- help on focused operational queries

Larger chunks tend to:

- preserve surrounding explanation
- help with multi-step or conceptual questions
- reduce the chance of retrieving a detail with no context

**In practice, many teams start by experimenting within a moderate size band rather than choosing an extreme.** If you want concrete starting values, jump to [A Practical Default](#a-practical-default).

For example:

- if chunks are very small, you may retrieve isolated sentences that cannot answer anything safely
- if chunks are very large, you may retrieve a whole section where only a tiny fraction is relevant

The right starting point depends on document shape. API docs and command references often benefit from smaller, tighter chunks. Architecture narratives often benefit from larger sections. We will turn this into concrete defaults below.

## Overlap Helps, Until It Starts Creating Duplicates

Overlap exists to avoid losing meaning at boundaries. If one chunk ends just before an important sentence and the next chunk begins with it, overlap can preserve continuity.

That is useful.

But overlap also creates repetition. Too much overlap fills retrieval results with near-identical chunks. That wastes context budget and makes reranking harder.

The practical lesson is simple:

- use enough overlap to protect meaning at boundaries
- avoid so much overlap that search results collapse into duplicates

If you need a concrete starting point for overlap, use the values in [A Practical Default](#a-practical-default). The important idea here is that overlap should solve a boundary problem, not become a default way to duplicate content.

**If your top results look like the same paragraph repeated three times, the overlap strategy is working against you.**

## Different Document Types Need Different Rules

**A strong chunking strategy often uses different logic for different document classes.**

For the AWS assistant:

- Runbooks: chunk by operational section or procedure step group. Keep prerequisites, warnings, and rollback notes close to the main procedure.
- API documentation: keep endpoint description, request contract, and key behavioral notes near each other. Avoid splitting examples away from the endpoint they explain.
- Architecture documents: chunk by conceptual section. These documents often need slightly larger chunks because local details depend on surrounding rationale.
- Incident reviews: keep timeline sections, root cause, and remediation actions coherent. These are often used to answer "why did this happen?" rather than "what is the exact command?"

## Signs That Chunking Is Failing

Chunking problems are often visible in retrieval outputs before they are obvious in user feedback.

Warning signs include:

- retrieved chunks feel incomplete
- answers miss key qualifiers, warnings, or prerequisites
- top results contain multiple near-duplicates
- the model sees a detail but not the section that explains it
- queries about one service retrieve generic organizational material instead of the right local section

When this happens, **changing the embedding model is not always the right next step. Often the representation unit itself is wrong.**

## A Practical Default

These are not final values. They are a practical starting point to get you moving, run a few retrieval tests, and then adjust based on what the returned chunks look like.

For most teams, I would start with:

- structure-aware chunking where source structure is available. In Bedrock Knowledge Bases, this usually means starting with `Hierarchical chunking` for structured documents such as runbooks, procedures, and documents with useful headings
- chunk sizes in the `400-800` token range for general documentation, `200-500` tokens for precise operational or API material, and `700-1,200` tokens for narrative documents where surrounding rationale matters
- `10-15%` overlap for fixed-size chunking, increasing only when useful context is being cut at boundaries
- chunking rules that vary by document type when the corpus justifies it

If you are not sure whether to start at the lower or higher end of a range, use the document shape as the guide. Start lower for lookup-heavy content where users ask narrow questions, such as commands, endpoints, status codes, and short procedures. Start higher for explanatory content where the answer depends on surrounding rationale, such as architecture notes, incident reviews, and design tradeoffs.

I would avoid:

- designing the system assuming one global chunking rule will be enough for every document class
- aggressive overlap by default
- forcing every chunk toward the same token count when headings, procedures, or section boundaries would produce better retrieval units

### Tune by Looking at Retrieved Chunks

After starting with these defaults, do not tune blindly. Run a few representative questions and inspect the returned chunks directly.

**The simplest useful question to ask is this: when a chunk is retrieved on its own, does it still make sense?**

If the answer is often no, the chunking policy needs work. Then tune from what you see in retrieval results:

- If the right document is found but the answer lacks the surrounding warning or prerequisite, increase chunk size or use parent-child context.
- If the retrieved chunk contains too many unrelated ideas, reduce chunk size or split by structure.
- If multiple chunks are needed to answer every simple question, your chunks may be too small.
- If one returned chunk contains most of a long page, your chunks may be too large.
- If several returned chunks are almost identical, reduce overlap.
- If the correct answer is split across multiple document types, separate those document groups and use different chunking strategies.

## Hands-on Lab

This lab has two paths:

- a simpler path using chunking options in Amazon Bedrock Knowledge Bases
- a manual path using Python libraries

**For the rest of this blog series, I will use the Bedrock Knowledge Bases path** because it keeps the setup smaller and lets us focus on the bigger design questions step by step.

That said, manual chunking is still worth exploring. It gives you a better feel for what chunking is actually doing, and it becomes important when you want tighter control than the managed options give you. There is also a practical AWS reason: because a Bedrock knowledge base has a limited number of data sources, you may not always be able to create a separate data source for every chunking variation you want. In those cases, manually chunking some document groups and placing them under `chunked/` can give you more control without spending another managed data source. My recommendation is simple: try the Bedrock path first, then come back and experiment with manual chunking after you have seen the easier option working.

### Lab Setup From the Previous Post

At the end of the ingestion lab, your source files should now live under the `processed/` prefix in S3, grouped by the chunking strategy we plan to test. If you used the sample dataset from the previous post, that includes documents such as:

- `processed/hierarchical/payments/payment-retry-runbook.md`
- `processed/hierarchical/payments/payment-failure-handling.md`
- `processed/hierarchical/invoices/invoice-events-overview.md`
- `processed/hierarchical/webhooks/webhook-secret-rotation.md`
- `processed/semantic/shared/customer-notification-flow.md`
- `processed/semantic/shared/engineering-onboarding.md`

Reserve `chunked/` for manually split outputs later. That gives us a clean distinction:

- `processed/` contains source documents ready for chunking, grouped by intended chunking strategy
- `chunked/` contains manually processed documents when we choose to create them ourselves

### Option 1: Explore Amazon Bedrock Knowledge Bases Chunking

We are not going to create the full knowledge base yet, because the full creation flow also asks us to choose an embedding model and a vector store. Those are topics for the next two posts. Right now, the goal is only to reach the chunking step, inspect the available choices, and understand what they mean.

In the AWS console:

1. open Amazon Bedrock
2. go to `Knowledge bases`
3. choose to create a knowledge base with a vector store
4. keep the general settings simple and let AWS create the IAM role if this is just a lab account
5. choose `Amazon S3` as the data source
6. select your bucket
7. for the inclusion prefix, pick `processed/hierarchical/`

That last point matters. **During the initial knowledge base creation flow, you select one data source, so we start with `processed/hierarchical/`.** After the knowledge base exists, we will add additional data sources that point to other prefixes in the same bucket, such as `processed/semantic/` or `chunked/custom/`.

There is also a quota to keep in mind here. Amazon Bedrock currently allows up to 5 data sources per knowledge base, so prefix design matters early. If you know several document groups will need the same chunking strategy, it is often better to group them under a shared prefix instead of spending one data source per narrow folder. AWS documents this limit in the Bedrock quotas reference: [Amazon Bedrock endpoints and quotas](https://docs.aws.amazon.com/general/latest/gr/bedrock.html) and the general data-source workflow is described in [Connect a data source to your knowledge base](https://docs.aws.amazon.com/bedrock/latest/userguide/data-source-connectors.html).

The final shape might look like this:

- one data source for `processed/hierarchical/` containing structured operational documents such as runbooks, invoice event notes, and secret-rotation guidance
- one data source for `processed/semantic/` containing narrative documents such as customer flow notes, platform overviews, and onboarding material
- one data source for `chunked/custom/payments/` if you manually chunked a payments document group yourself

After the data source selection, you will reach the content parsing and chunking step. This is the part we care about for now.

At the time of writing, Amazon Bedrock Knowledge Bases supports these text chunking choices:

- `Default chunking`
- `Fixed-size chunking`
- `Hierarchical chunking`
- `Semantic chunking`
- `No chunking`

In practice, I would think about them like this:

- `Default chunking`: a reasonable starting point when you want the simplest managed setup and do not yet know enough to tune chunk sizes
- `Fixed-size chunking`: useful when you want explicit control over maximum tokens and overlap percentage
- `Hierarchical chunking`: useful when you want smaller child chunks for retrieval but larger parent chunks for answer context
- `Semantic chunking`: useful when meaning should drive boundaries more than fixed token windows, at the cost of more complexity and additional model cost
- `No chunking`: useful when you want to do chunking yourself before the documents ever reach the knowledge base

For completeness, there is one more option worth noticing in the Bedrock ingestion flow: a custom transformation function. AWS lets you attach a Lambda transformation at the post-chunking step. That means Bedrock can parse and chunk the documents first, then call your Lambda before embeddings are created.

This is useful when you want to enrich the chunks rather than replace the whole managed pipeline. For example, you might want to:

- add chunk-level metadata
- normalize or enrich chunk content
- attach document attributes that will later help filtering

AWS also supports using a transformation Lambda together with `No chunking` if you want the Lambda itself to perform custom chunking and write the resulting chunked files back to S3.

For this lab, notice how these two prefixes map to different chunking strategies:

- use `hierarchical` chunking for structured operational documents under `processed/hierarchical/`
- use `semantic` chunking for narrative documents under `processed/semantic/`

That split is useful because it shows the core tradeoff clearly: operational documents often benefit from predictable boundaries, while more narrative documents may benefit from meaning-aware boundaries.

Manually prepared content under `chunked/` should later use `No chunking` in the knowledge base.

**Stop at this point in the console.** We will come back and actually create the knowledge base after we cover embeddings and vector storage.

### Option 2: Manual Chunking With Python

If you want to understand chunking more deeply, manual chunking is the best way to do it.

In this path, your script reads from `raw/` and writes processed files into `chunked/`. Then, when you later connect `chunked/` to a Bedrock Knowledge Base, you would choose `No chunking` so the knowledge base does not split the already prepared files again.

Good Python libraries to explore are:

- [LangChain text splitters](https://docs.langchain.com/oss/python/integrations/splitters/index) for fixed-length, token-based, and structure-aware chunking
- [LangChain Markdown header splitter](https://docs.langchain.com/oss/python/integrations/splitters/markdown_header_metadata_splitter) for markdown files where headings matter
- [LlamaIndex Semantic Splitter](https://docs.llamaindex.ai/en/latest/api_reference/node_parsers/semantic_splitter/) for embedding-based semantic chunking
- [Unstructured chunking](https://docs.unstructured.io/open-source/core-functionality/chunking) for element-aware chunking after document parsing

If you want a simple manual progression, try them in this order:

1. fixed-length chunking using LangChain
2. markdown-aware chunking using headings
3. semantic chunking using LlamaIndex

That progression makes the tradeoffs easier to see. You start with explicit size rules, then move to document structure, then move to meaning-based boundaries.

The key idea for the manual path is this:

- `raw/` is the source of truth
- your Python job produces curated files in `chunked/`
- the knowledge base later uses `No chunking` for that curated prefix

That gives you a clean mental model and avoids mixing two chunking systems on the same documents.

In the next post, I will move from chunk representation to embedding choice: how to select a model that fits the content, the latency budget, and the operational cost of the system you are actually building.
