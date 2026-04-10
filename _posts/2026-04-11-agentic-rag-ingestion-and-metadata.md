---
layout: post
title: "Agentic RAG with AWS 2: Documents, Ingestion, and Metadata Design"
date: 2026-04-11
description: How source documents, preprocessing, and metadata choices shape the quality of an agentic RAG system.
tags: rag agents aws llm ingestion
categories:
  - artificial intelligence
thumbnail: assets/images/2026-04-11-agentic-rag-ingestion-and-metadata/agentic-rag-ingestion-and-metadata.svg
og_image: assets/images/2026-04-11-agentic-rag-ingestion-and-metadata/agentic-rag-ingestion-and-metadata.png
giscus_comments: false
published: true
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/2026-04-11-agentic-rag-ingestion-and-metadata/agentic-rag-ingestion-and-metadata.svg" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

When people discuss RAG systems, they often jump straight to embeddings, vector databases, and prompts. That is understandable, because those are the visible parts of the stack.

But the quality of the system is usually decided earlier.

Even before documents arrive, you face a fundamental structural choice: where will your source documents live, and what shape will that storage take? Selecting the right data store—whether S3, a database, or another system—determines how easily ingestion can scale, how fresh your content stays, and what cleanup work you can do before indexing. That choice ripples through everything that follows.

If the wrong documents enter the system, if text extraction is sloppy, or if metadata is missing, the rest of the design has to compensate for bad raw material. It rarely does so gracefully.

For the AWS example in this series, imagine an internal engineering assistant that pulls knowledge from S3. The company has payment, invoice, and webhook services. The documents include runbooks, service flow notes, platform overviews, and onboarding material. The system needs to answer questions without mixing stale instructions, draft notes, and permission-sensitive information.

That means ingestion is not just a loading step. **It is the stage where you decide what counts as trusted knowledge.**

This post answers five practical questions:

1. What documents actually need indexing?
2. What data store should serve as the data source?
3. How should that data source be organized?
4. How should the ingestion flow be designed?
5. How do you detect ingestion problems early?

If you want the short version first, jump to [A Good Default for the Running Example](#a-good-default-for-the-running-example).

## Start With What and Why, Not Scale

When selecting a data source, one of the first practical questions is, “How big is your data?” That matters because scalability and cost depend on it. But two even more important questions come first when selecting the data source for a knowledge base:

- What questions will users ask this system?
- What is the minimum set of documents needed to answer those questions reliably?

Those are the questions we start with in the ingestion stage, and they are the same ones we will come back to in the evaluation stage.

For our running example, questions we want the engineering knowledge assistant to answer include:

1. Which service owns invoice event publishing?
2. What retries run after a payment failure?
3. How do we rotate a webhook signing secret safely?
4. What happens after a payment failure, which events are published, and which service eventually sends the customer notification?

Create your own set of questions, ideally with answers, because this becomes the start of your **gold set**. Unfortunately, this is not optional in a serious RAG design. This gold set gives you the "why?": if someone asks why a document is being ingested, you should be able to point to one or more questions in the gold set that require it.

Once you have the questions, you can decide what documents to ingest based on whether they help answer those questions reliably.

For an engineering knowledge assistant, some documents are high value:

- operational runbooks (`Q2`, `Q3`)
- versioned API documentation (`Q1`, `Q4`)
- incident reviews with concrete lessons (`Q2`, `Q4`)
- onboarding docs that are actively maintained (`Q1`, `Q4`)
- architecture decision records (`Q1`, `Q4`)
- auto-generated code documentation (`Q1`, `Q2`)

Some documents are much riskier:

- informal chat exports (low signal)
- duplicated exports from multiple systems (conflicting copies)
- stale drafts with no clear owner (unknown authority)
- temporary investigation notes (unfinished thinking)
- content with mixed permission scopes (access risk)
- old design docs that are no longer valid (outdated guidance)

If you index everything because it is available, retrieval gets noisier and trust falls quickly. Engineers stop using the system not because the model is weak, but because the evidence base feels unreliable.

A practical default is to start with the **most authoritative document classes** first, even if that means the initial corpus is smaller. In practice, I have found auto-generated code documentation and customer-facing, regularly used documents, such as API docs, to be more reliable.

## Choosing a Data Store to Serve as the Data Source

Once you know which documents should enter the system, the next question is where they should come from.

That choice matters because the data source is not just a storage location. It shapes:

- how easy ingestion is to automate
- how expensive the pipeline is to run
- how fresh the content can be
- how tightly the RAG system is coupled to operational systems

At the time of writing, Amazon Bedrock Knowledge Bases natively supports the following unstructured data sources:

- Amazon S3
- Confluence (preview)
- Microsoft SharePoint (preview)
- Salesforce (preview)
- Web Crawler (preview)
- custom data sources

For structured data, AWS documents currently list:

- Amazon Redshift
- AWS Glue Data Catalog through the Amazon Redshift query engine

Native support is a real advantage because it can remove some glue code from the ingestion path. But "native" is not the same as "best." The right source still depends on where your content lives and how much control you want over preprocessing.


### Why S3 Is a Good Default for This Series, and Often for Yours

For this series, S3 is the right default because it solves the storage problem cleanly without forcing us into a complicated ingestion architecture too early.

It gives us:

- native support in Amazon Bedrock Knowledge Bases
- low storage cost
- a simple landing zone for documents from many different systems
- clean separation between source systems and the RAG ingestion pipeline
- a storage layer that works well with both batch and event-driven processing

For the AWS engineering assistant example, S3 is therefore "good enough" in the best possible sense. It is native, cheap, operationally familiar, and flexible enough to **act as the canonical staging layer for ingestion**. That matters because internal knowledge is rarely born clean. A runbook export, a markdown document, and an internal HTML page should not necessarily go into chunking in their raw original forms. They usually need extraction, cleanup, normalization, or enrichment first.

## Data Source Organisation

To keep the ingestion pipeline clean and modular, we organize the S3 bucket with a clear prefix hierarchy:

- `raw/`: This prefix holds the original, unprocessed source documents. These are the raw files as they come from source systems, before any extraction or normalization. This is the landing zone for all incoming knowledge. If you directly write formatted and processed data, you may not need this prefix.

- `processed/`: This prefix holds extracted, normalised, and formatted documents, ready for chunking and indexing. It serves as the final input layer for Bedrock Knowledge Bases.

- `chunked/`: This prefix is reserved for processed and chunked output, where processed documents have been split into chunks or does not need chunking and ready for indexing. If you're not planning to use custom chunking solutions (i.e. you use native Bedrock chunking) or don't have any data that does not need chunking, you won't need this prefix. It serves as the final input layer for Bedrock Knowledge Bases which skips chunking (don't worry too much about this as will explore chunking in next post).

## Ingestion Flow Design Decisions

We've covered what documents we need and how they'll be organized in the data store. Now we'll discuss the design decisions for the ingestion flow that populates the source data store.

Here we will discuss a few ingestion flows based on how documents enter the system and what processing they require:

- **Raw documents needing full processing**: These land in the `raw/` prefix and require extraction, normalization, and structuring before chunking. The ingestion pipeline processes them and outputs cleaned versions to `processed/`. For example, a PDF runbook from the payments service might arrive in `raw/payments/payment-runbook.pdf`, get converted to structured Markdown with preserved headings and code blocks, then saved to `processed/payments/payment-runbook.md`.

- **Pre-processed documents**: These are already clean and structured, so they land directly in the `processed/` prefix, skipping extraction and normalization. For example, a well-formatted Markdown onboarding guide for webhooks might be written directly to `processed/webhooks/webhook-onboarding.md` if it comes from a docs-as-code system.

- **Documents needing custom chunking or no chunking**: These require specialized splitting or are already optimally sized, landing in the `chunked/` prefix. For example, a short, self-contained incident review for invoices might go to `chunked/invoices/incident-review.md` if it doesn't need further division, or a long platform overview might be pre-chunked into logical sections before saving to `chunked/shared/platform-overview/`.

At a minimum, the pipeline needs to solve the following problems:

1. How to detect new or changed documents?
2. How to extract usable text?
3. How to normalize structure?
4. How to uncover and attach metadata? (in our case metadata will become a sidecar file)
5. Writing cleaned output to the appropriate prefix (processed/ or chunked/)

For most systems, change identification, extraction, and normalization depend on the data, and I will not go into implementation details. But we will discuss some important design decisions you have to make.

#### Event-Driven or Batch Ingestion?

The first big choice is how the pipeline is triggered. Event-driven ingestion reacts to source changes immediately, which keeps the knowledge base fresh for operational documents like runbooks and incident notes. Batch ingestion processes a set of updates on a schedule, which is easier to operate and often sufficient for more stable content.

This is not a pure either/or decision. Many teams benefit from a mixed approach: treat critical, frequently changing operational documents as event-driven, while using scheduled runs for bulk refreshes, cleanup, and backfills.

#### Process the Wiki or Generate the Wiki? (Docs-as-Code for the Win)

Another core decision is whether you want to keep processing messy source formats or change the way content is authored. Documentation as code means capturing knowledge in structured text formats like Markdown with predictable structure. That makes ingestion simpler because the content is already machine-friendly, and it often removes entire extraction stages from the pipeline.

This is especially valuable when your source material is internally created documentation rather than external reports. If you can move a portion of your content creation to docs-as-code, you reduce the amount of fragile parsing and improve the quality of the documents entering the system.

#### How You Handle Versions and Replacements?

Knowledge is not static. Runbooks are updated, APIs evolve, and guidance gets superseded. If the ingestion layer only appends new documents, retrieval can surface conflicting or outdated answers.

A strong default is to treat each document with a stable identity, capture version or update metadata, and explicitly mark superseded content. That lets the retrieval layer and your LLM distinguish current operational guidance from historical reference without hiding history entirely.

This is one of the fastest trust-saving design decisions you can make in ingestion.

## Why Extraction and Normalization Matter

Different document types fail in different ways.

Markdown may be structurally clean but inconsistent in heading depth. PDFs may look polished to humans while producing broken line order when extracted mechanically. Internal HTML pages may include navigation noise and boilerplate. Runbooks may contain command blocks that should stay intact, while API docs may have tables that collapse badly during extraction.

If extraction destroys structure, chunking becomes blind. If code blocks get merged into paragraphs, retrieval quality for operational questions drops. If headings disappear, the system loses valuable context boundaries.

The safest default is to normalize documents into an intermediate text representation that preserves (markdown files are perfect):

- title
- section hierarchy
- code blocks
- tables where feasible
- source identity
- last-updated information

That normalized representation becomes the real input to chunking, not the raw original file.

## Metadata Is Not Optional

When a RAG system performs badly, teams often blame embeddings first. In many cases, metadata design is the actual problem.

Good metadata allows the system to narrow retrieval intelligently. For the AWS assistant, useful fields might include:

- service name, such as `payments`, `invoices`, or `webhooks`
- document type, such as `runbook`, `adr`, `api-doc`, or `incident-review`
- environment, such as `prod` or `staging`
- owner team
- source path or canonical document ID
- last updated timestamp
- permission scope

Without metadata, retrieval has to rely entirely on semantic similarity. That sounds elegant, but it breaks down fast in real systems because many documents are semantically similar while being operationally different.

A query about rotating a production secret should not quietly pull a staging-only guide just because the wording is close.

## How Do You Detect Ingestion Problems Early?

Some ingestion failures are easy to detect. Others quietly degrade quality for weeks.

The most common ones are:

- Duplicated documents from multiple exports
- Missing or inconsistent metadata
- Partial extraction where tables or code blocks are destroyed
- Draft and authoritative documents mixed together
- Permission-sensitive content indexed into a shared retrieval pool
- Stale documents left active after replacement

Notice that none of these problems are solved later by a better prompt.

## A Good Default

If you do not want to read the whole article before making progress, these are the defaults I would start with for many RAG systems in the AWS ecosystem:

- Documents to index: start by creating a gold set of questions, then pick the document groups that answer those questions. If you have multiple options, prefer authoritative documents
- Data store: Amazon S3 as the data source and staging layer
- Data source organization: keep three prefixes, `raw/`, `processed/`, and `chunked/`
- Ingestion flow: prefer docs-as-code when you can, decide on which document classes need event driven updates vs bulk
- Issue detection: watch for duplicates, stale content, broken extraction, missing metadata, and mixed-authority documents early

That may feel slower than "index everything and improve later", but it produces a much cleaner system to build on.

The larger lesson is simple: retrieval quality begins long before retrieval. It begins when you decide what knowledge is allowed into the system, where it lands, how it is processed, and how quickly you notice when ingestion quality starts drifting.

## Hands-on Lab

If you want to follow this series in your own AWS account, this is a good point to set up the source layer for the running example.

For this post, you do not need a full RAG stack yet. You only need a clean place to store source documents in a way that will make the next posts easier.

To make the rest of the series reproducible, I created a small sample dataset you can use directly instead of writing the documents yourself. The later chunking, retrieval, and agent examples assume this dataset or something very similar to it.

Download [agentic-rag-sample-data.zip]({{ '/assets/files/agentic-rag/agentic-rag-sample-data.zip' | relative_url }}) and upload the `processed/` folder into your S3 bucket as-is. That package also includes `.metadata.json` sidecar files that we will use later in the retrieval post.

I will not go into processing raw files (because that is highly data- and implementation-specific) or custom chunking techniques outside what is natively available in Bedrock. So you will not need the `raw/` and `chunked/` prefixes to follow this example. If you want to extend the lab, feel free to turn it into a full example by placing raw files (PDFs, HTML, etc.) into `raw/` and data that does not need chunking into `chunked/`.

The sample files live under the same `processed/` structure used in the article:

- `processed/payments/payment-retry-runbook.md`
- `processed/payments/payment-failure-handling.md`
- `processed/invoices/invoice-events-overview.md`
- `processed/webhooks/webhook-secret-rotation.md`
- `processed/shared/customer-notification-flow.md`
- `processed/shared/eventing-platform-overview.md`
- `processed/shared/webhook-onboarding-guide.md`
- `processed/shared/engineering-onboarding.md`

If you want to inspect the files before uploading them, use these links:

- [payment-retry-runbook.md]({{ '/assets/files/agentic-rag/sample-data/processed/payments/payment-retry-runbook.md' | relative_url }})
- [payment-failure-handling.md]({{ '/assets/files/agentic-rag/sample-data/processed/payments/payment-failure-handling.md' | relative_url }})
- [invoice-events-overview.md]({{ '/assets/files/agentic-rag/sample-data/processed/invoices/invoice-events-overview.md' | relative_url }})
- [webhook-secret-rotation.md]({{ '/assets/files/agentic-rag/sample-data/processed/webhooks/webhook-secret-rotation.md' | relative_url }})
- [customer-notification-flow.md]({{ '/assets/files/agentic-rag/sample-data/processed/shared/customer-notification-flow.md' | relative_url }})
- [eventing-platform-overview.md]({{ '/assets/files/agentic-rag/sample-data/processed/shared/eventing-platform-overview.md' | relative_url }})
- [webhook-onboarding-guide.md]({{ '/assets/files/agentic-rag/sample-data/processed/shared/webhook-onboarding-guide.md' | relative_url }})
- [engineering-onboarding.md]({{ '/assets/files/agentic-rag/sample-data/processed/shared/engineering-onboarding.md' | relative_url }})

The dataset includes both direct-answer documents and near-miss documents on purpose. For example:

- `webhook-secret-rotation.md` should answer the secret rotation question directly
- `webhook-onboarding-guide.md` is related but not the right operational answer
- `invoice-events-overview.md` should answer who publishes invoice events
- `eventing-platform-overview.md` is useful background but should not be the best answer to that same query

The markdown files should be intentionally well structured. That means:

- a clear title at the top
- section headings that reflect the topic
- short, coherent paragraphs
- command blocks kept intact
- one main idea per section

That matters because in the next post we will talk about chunking, and badly structured source files make chunking decisions much harder to reason about.

If you are uploading the files manually through the S3 console, keep the folder layout exactly as shown above. The later Bedrock Knowledge Base steps use prefixes like `processed/payments/` and `processed/shared/`, so the path structure matters.

In the next post, I will move one step forward in the pipeline and look at chunking: how large each unit should be, where boundaries should fall, and why bad chunking can make even a good embedding model look weak.
