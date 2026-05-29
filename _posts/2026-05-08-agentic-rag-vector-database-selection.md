---
layout: post
title: "Agentic RAG with AWS 5: Choosing the Vector Database"
date: 2026-05-02
description: How to choose a vector database for an agentic RAG system based on scale, filters, and operational ownership.
tags: rag agents aws llm vector-database
categories:
  - artificial intelligence
thumbnail: assets/images/2026-05-08-agentic-rag-vector-database-selection/agentic-rag-vector-database-selection.png
og_image: assets/images/2026-05-08-agentic-rag-vector-database-selection/agentic-rag-vector-database-selection.png
giscus_comments: false
published: true
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/2026-05-08-agentic-rag-vector-database-selection/agentic-rag-vector-database-selection.png" class="img-fluid rounded z-depth-1 mx-auto d-block" alt="Abstract vector database selection concept for an agentic RAG system" zoomable=true %}
    </div>
</div>

In the previous post, we chose `Amazon Titan Text Embeddings V2` as the working default for the engineering assistant with AWS and stopped before creating the knowledge base. That pause was deliberate.

Once you commit to an embedding model, the next commitment is where those vectors will live.

This is where many teams ask, "Which vector database is best?"

That question is usually too broad to help. The better question is: which storage and retrieval layer fits the workload, the filtering needs, and the amount of operational complexity your team is willing to own?

For the engineering assistant with AWS in this series, the answer depends on more than nearest-neighbor search. The system also needs metadata filters, predictable enough latency, clean updates from S3 data sources, and enough operational simplicity that the team can keep it healthy over time.

This post answers five practical questions:

1. What does the vector layer actually do?
2. Which AWS vector store options are available through Bedrock Knowledge Bases?
3. When should you use auto-create versus an existing vector store?
4. Why is Amazon S3 Vectors a good default for this learning path?
5. How do you create and test the first working knowledge base?

If you want the short version first, jump to [A Practical Default](#a-practical-default).

## What the Vector Layer Actually Does

The vector layer is responsible for more than nearest-neighbor lookup.

In a real RAG system, it often needs to support:

- vector similarity search
- metadata filtering
- document updates and deletions
- index maintenance
- stable latency under query load
- sometimes hybrid lexical and semantic retrieval

That means the right choice depends on the full retrieval shape, not just vector math performance.

## Practical AWS Options in Bedrock Knowledge Bases

For this post, it makes more sense to talk about the concrete options you will actually see in Amazon Bedrock Knowledge Bases rather than staying at the generic `pgvector` versus OpenSearch level.

As of May 2026, the main AWS-native vector store choices you are likely to consider are:

- Amazon S3 Vectors
- Amazon OpenSearch Serverless
- Amazon Aurora PostgreSQL
- Amazon Neptune Analytics

In the Bedrock console, these show up in two broad paths:

- `Quick create a new vector store`
- `Use an existing vector store`

The second path exposes more options because it can connect to stores you prepared yourself, including OpenSearch managed clusters and some third-party databases. In this series, I want to stay focused on the AWS-native options that are easiest to reason about in a practical internal RAG setup.

| Option | Type | Auto create | Query profile | Cost shape | Best for |
| --- | --- | --- | --- | --- | --- |
| Amazon S3 Vectors | Serverless vector storage in S3 | Yes | Sub-second, but best for infrequent or moderate query workloads | Pay for storage, PUTs, and queries; no infrastructure to provision | Learning, lower-cost RAG, and production systems where the query load is not extremely high |
| Amazon OpenSearch Serverless | Search-oriented managed vector store | Yes | Strong for low-latency search, metadata filtering, and search-heavy workloads | Always-on baseline cost from OpenSearch Serverless capacity, plus storage | Production search systems where retrieval speed and filtering matter more than minimizing baseline cost |
| Amazon Aurora PostgreSQL | Relational database with vector support | Yes | Good when you want vectors close to relational data and a familiar SQL model | Can scale to zero in serverless quick create, but still more database-shaped operationally than S3 Vectors | Teams that already want PostgreSQL in the design or need tight integration with relational workflows |
| Amazon Neptune Analytics | Graph and vector store combined | Yes | Useful when graph relationships are a core part of retrieval | More specialized architecture choice | GraphRAG and relationship-heavy knowledge problems |

That table is not a ranking. It is a fit map.

For the engineering assistant with AWS in this series:

- `Amazon S3 Vectors` is attractive because it is simple, auto-creatable, and cost-efficient for a learning-oriented setup
- `Amazon OpenSearch Serverless` is attractive when speed, filtering, and search behavior are more important than keeping baseline cost low
- `Amazon Aurora PostgreSQL` is attractive if you already want a PostgreSQL-centered architecture
- `Amazon Neptune Analytics` is a different style of solution and is not the path I want for this series

The key difference is not just where vectors are stored. It is what kind of retrieval system you are choosing to operate. S3 Vectors keeps the storage and retrieval layer small. OpenSearch gives you a more search-oriented engine. Aurora keeps vectors close to relational workflows. Neptune makes sense only when graph relationships are part of the retrieval problem.

### A Note on Existing Vector Stores

If you choose `Use an existing vector store` in the Bedrock console, you will see more possibilities than in the quick-create path.

That route is useful when you already have infrastructure or stronger preferences. For example, you might bring:

- an existing Amazon OpenSearch Serverless collection
- an Amazon OpenSearch managed cluster
- an existing Aurora PostgreSQL setup
- an S3 vector bucket and vector index you created yourself

Bedrock also supports some non-AWS vector stores through the existing-vector-store path, but I am not bringing those into this series because the goal here is to keep the stack AWS-native and easy to reproduce.

## A Practical Default

For this series, I would start with **Amazon S3 Vectors**.

That is not because S3 Vectors is universally best. It is because it is the best fit for the setup we are building:

- Bedrock can create it automatically
- it fits a low-ops learning environment
- it does not force us into an always-on search bill before we have even validated the workflow
- it is a clean match for the moderate-scale internal knowledge assistant example in this series

There are tradeoffs. S3 Vectors is a semantic-search-oriented path, so it is not the place I would start if hybrid lexical and vector search is already a hard requirement. It also has metadata limits that matter if you plan to attach large or complex metadata to every chunk. Those constraints are acceptable for this series because our first goal is a clean baseline knowledge base, not the final production retrieval architecture.

By contrast, Amazon OpenSearch Serverless is more attractive for a production search-heavy design, especially when low-latency retrieval, richer filtering, or hybrid search matter from day one. But it comes with a meaningful fixed cost floor because it maintains search capacity even before the workload is large enough to justify it. That makes it a weaker fit for a tutorial series where the goal is to learn the architecture step by step inside a normal AWS account.

So for this series:

- we pick `Amazon S3 Vectors`
- we acknowledge that `Amazon OpenSearch Serverless` may be the better production choice for some teams
- we postpone that heavier path until there is a clear reason to pay for it

That gives us a simple baseline that still connects correctly to the earlier decisions: S3 source documents, Bedrock-managed chunking, Titan V2 embeddings, and now an AWS-native vector store created as part of the knowledge base flow.

## What Goes Wrong When the Vector Store Is the Wrong Fit

Assume the earlier parts of the pipeline are working well: the right documents were ingested, chunks are coherent, embeddings are good enough, and metadata exists. Even then, the vector store can still become the limiting choice.

The failure usually does not look like "RAG is broken." It looks more specific:

- **Exact terms start to matter more than semantic similarity.** Semantic search is good for conceptual matches, but it can miss exact operational references such as error codes, event names, API fields, command flags, service identifiers, ticket IDs, and configuration keys. If users often search for things like `PAYMENT_RETRY_EXHAUSTED` or `invoice.events.published`, a semantic-only store may not be enough. This is one reason OpenSearch Serverless becomes more attractive than S3 Vectors.

- **Metadata filtering becomes a correctness requirement.** The same query may need to be constrained by service, environment, document type, freshness, or permission scope. If the store has limited filter operators, awkward metadata mapping, or small metadata limits, retrieval becomes harder to control. For example, S3 Vectors in Bedrock Knowledge Bases currently has metadata limits and does not support `startsWith` or `stringContains` filters.

- **The index shape fights the retrieval design.** Existing vector stores can require very specific field mappings, engines, metadata columns, or indexes. If those do not match how Bedrock expects to retrieve and filter, you end up debugging vector index configuration instead of improving retrieval quality.

- **The cost model no longer matches the workload.** For a small corpus with occasional use, an always-on search-oriented store may be more infrastructure than you need. For a high-traffic internal search surface with strict latency expectations, the cheaper low-ops choice may become the bottleneck.

For this series, S3 Vectors is still the honest starting point. The upgrade signal is when retrieval becomes more search-heavy, filter-heavy, or latency-sensitive than this simple baseline is meant to handle.

## Hands-on Lab

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/2026-05-08-agentic-rag-vector-database-selection/agentic-rag-knowledge-base-lab-setup.png" class="img-fluid rounded z-depth-1 mx-auto d-block" alt="Amazon Bedrock Knowledge Base lab setup with S3 document prefixes, chunking strategies, Titan embeddings, S3 Vectors, and test queries" zoomable=true %}
    </div>
</div>

This is the point where the first five posts turn into a working system.

So far, we have chosen the source layout, metadata shape, chunking strategy, embedding model, and vector store. In this lab, we finally create the Amazon Bedrock Knowledge Base, sync the documents, and run the first retrieval tests against the sample engineering corpus.

The AWS console changes over time, so treat the exact button text below as directional. The important flow is stable: create a knowledge base, connect an S3 data source, choose chunking, choose embeddings, choose a vector store, create, sync, and test.

By now, we already decided:

- source documents live under `processed/hierarchical/` and `processed/semantic/` in S3
- chunking is managed by Bedrock Knowledge Bases for the main path in this series
- the embedding model default is `Amazon Titan Text Embeddings V2`
- the embedding dimension default is `1024`
- the vector store default is `Amazon S3 Vectors`

### Before You Start

You need three things before opening the Bedrock console:

1. An AWS account and Region where Amazon Bedrock Knowledge Bases, the embedding model, and S3 Vectors are available.
2. An IAM identity with permission to create and manage Bedrock Knowledge Bases. Do not use the AWS root user.
3. Source files in an S3 general purpose bucket in the same Region as the knowledge base.

If you followed [Part 2: Documents, Ingestion, and Metadata Design]({{ '/agentic-rag-ingestion-and-metadata/' | relative_url }}), you already have the sample dataset. If not, download [agentic-rag-sample-data.zip]({{ '/assets/files/agentic-rag/agentic-rag-sample-data.zip' | relative_url }}) and upload the `processed/` folder into your S3 bucket.

The bucket should contain at least these two prefixes:

- `processed/hierarchical/`
- `processed/semantic/`

Keep the `.metadata.json` sidecar files next to their matching markdown files. Bedrock uses those metadata files later for filtering and source inspection.

### Step 1: Create the Knowledge Base

In the Amazon Bedrock console:

1. open `Knowledge bases`
2. choose to create a knowledge base with a vector store
3. give the knowledge base a clear name, such as `engineering-assistant-kb`
4. let Bedrock create the service role for this lab unless your account requires a custom role
5. choose `Amazon S3` as the first data source

When the console asks for the S3 source, select the bucket that contains the sample files. Use `processed/hierarchical/` as the inclusion prefix for the first data source.

Name the data source something explicit, such as `engineering-hierarchical-docs`, because we will add a second data source in a moment.

In the content parsing and chunking section, choose `Hierarchical chunking` for this first data source. This matches the prefix design from the earlier posts: structured operational documents go under `processed/hierarchical/`.

This first data source should include documents such as:

- `processed/hierarchical/payments/payment-retry-runbook.md`
- `processed/hierarchical/payments/payment-failure-handling.md`
- `processed/hierarchical/invoices/invoice-events-overview.md`
- `processed/hierarchical/webhooks/webhook-secret-rotation.md`

One important detail: Bedrock applies chunking settings per data source, and AWS documents that the chunking strategy cannot be changed after the data source is connected. That is why we are using separate prefixes and separate data sources for different chunking strategies.

### Step 2: Choose Embeddings and Vector Storage

When you reach the embeddings section, use the default path we chose in the previous post:

- embedding model: `Amazon Titan Text Embeddings V2`
- vector dimensions: `1024`

If the model or dimension selector looks slightly different in your Region, keep the intent the same: use a text embedding model supported by Bedrock Knowledge Bases, and avoid changing embedding models casually after creation.

When you reach the vector database section, choose the managed path:

- vector store path: `Quick create a new vector store`
- vector store type: `Amazon S3 Vectors`

With this option, Bedrock creates the S3 vector bucket and vector index for you. That keeps the lab focused on the RAG pipeline rather than manual vector-index setup.

Review the knowledge base settings in the final screen, then create it. The exact review page may vary, but before creating, confirm the four decisions that matter for this series:

- first S3 source prefix: `processed/hierarchical/`
- first data source chunking: `Hierarchical chunking`
- embedding model and dimension: `Amazon Titan Text Embeddings V2`, `1024`
- vector store: `Amazon S3 Vectors`

### Step 3: Add the Second Data Source

After the knowledge base is created, add a second S3 data source for the narrative documents:

- data source type: `Amazon S3`
- S3 source prefix: `processed/semantic/`
- chunking strategy: `Semantic chunking`

Name this data source something like `engineering-semantic-docs`.

This second data source should include documents such as:

- `processed/semantic/shared/customer-notification-flow.md`
- `processed/semantic/shared/eventing-platform-overview.md`
- `processed/semantic/shared/webhook-onboarding-guide.md`
- `processed/semantic/shared/engineering-onboarding.md`

This matches the prefix design from the ingestion and chunking posts. Structured operational documents are grouped under `processed/hierarchical/`; narrative flow and overview documents are grouped under `processed/semantic/`. Because Bedrock applies chunking settings per data source, this layout gives us different chunking behavior without mixing document types inside the same data source.

### Step 4: Sync the Data Sources

After both data sources are connected, start a sync for each data source so Bedrock can:

- read the files from each selected S3 prefix
- parse and chunk them
- generate embeddings
- write the vectors into the new S3 vector index

When the sync completes, check the sync history for warnings or failed files. If a file is skipped, first check the basics: file format, file size, S3 permissions, metadata sidecar naming, and whether the source file and `.metadata.json` file are in the same prefix.

This is the point where the previous posts finally connect into one working pipeline: S3 source files, metadata sidecars, Bedrock chunking, Titan embeddings, and S3 Vectors.

### Step 5: Test Retrieval First

Once ingestion finishes, use the `Test knowledge base` option in the AWS console.

You can test it in two different ways:

- `Retrieve` only, to see how well retrieval and chunking are working
- `Retrieve and generate`, to test the full end-to-end flow with a foundation model

I would start with retrieval only, because it is the cleanest way to inspect whether the right chunks are being found before generation adds another layer of behavior.

In the console:

1. open your knowledge base
2. choose `Test knowledge base`
3. for retrieval-only testing, clear `Generate responses for your query`
4. open the configurations panel
5. set `Source chunks` to the number of chunks you want returned
6. enter a test query and run it

Start with a modest number of chunks, such as `5`, so you can inspect the output without too much noise.

Good starter queries are the same ones used throughout the series:

- "What retries happen after a payment failure?"
- "Which service publishes invoice events?"
- "How do we rotate the webhook signing secret?"
- "What happens after a payment failure, which events are published, and which service eventually sends the customer notification?"

If you used the sample dataset from post 2, those questions should map cleanly to the uploaded markdown files and give you a predictable baseline before we tune retrieval in the next post.

In retrieval-only mode, Bedrock returns the source chunks directly in relevance order. Under the output, use `Show source details` to inspect what was retrieved, where it came from, and what metadata was attached.

For the first three queries, the top result should usually come from the direct operational document:

- payment retries should retrieve the payment retry or payment failure documents
- invoice publishing should retrieve the invoice events overview
- secret rotation should retrieve the webhook secret rotation document

The fourth query is intentionally broader. It should pull evidence from more than one area of the corpus, and it gives us a useful baseline for the next post on retrieval design.

### Step 6: Try Retrieve and Generate

After retrieval-only testing looks reasonable, switch to full end-to-end testing:

1. turn on `Generate responses for your query`
2. choose `Select model`
3. pick a foundation model for response generation
4. run the same query again

Now you can compare two things:

- whether the same chunks were retrieved
- whether the generated answer uses them well

At this stage, the goal is still not perfect quality. It is to confirm that:

- the documents were ingested
- the chunking approach is at least reasonable
- the embedding model is producing usable retrieval behavior
- the knowledge base can produce a grounded answer when response generation is enabled

You will also start seeing additional query controls in the console, including ranking behavior and metadata filters. I would not tune those yet. They belong naturally in the next post, which is about retrieval design.

### What to Notice After the First Test

As you test the knowledge base, pay attention to:

- whether the right documents are being retrieved at all
- whether the returned chunks feel too small, too large, or repetitive
- whether the answer is grounded in the correct source
- whether the selected prefix and chunking strategy feel appropriate for that document group

Those observations are the real output of this lab. If the wrong chunks are retrieved, the issue is probably earlier in the pipeline. If the right chunks are retrieved but the answer is weak, then retrieval and response generation need closer inspection. That is exactly why the next post focuses on retrieval design.

In the next post, I will stay in the retrieval layer and tune the system we just created: top-k, metadata filters, hybrid search tradeoffs, score interpretation, and reranking.
