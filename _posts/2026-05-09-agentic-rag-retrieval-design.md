---
layout: post
title: "Agentic RAG with AWS 6: Retrieval Design, Top-k, Filters, Hybrid Search, and Reranking"
date: 2026-05-09
description: How retrieval parameters shape answer quality in an agentic RAG system.
tags: rag agents aws llm retrieval
categories:
  - artificial intelligence
thumbnail: assets/images/2026-05-09-agentic-rag-retrieval-design/agentic-rag-retrieval-design.png
og_image: assets/images/2026-05-09-agentic-rag-retrieval-design/agentic-rag-retrieval-design.png
giscus_comments: false
published: true
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/2026-05-09-agentic-rag-retrieval-design/agentic-rag-retrieval-design.png" class="img-fluid rounded z-depth-1 mx-auto d-block" alt="Retrieval design flow for an agentic RAG system showing query, semantic retrieval, filters, reranking, and final evidence" zoomable=true %}
    </div>
</div>

In the previous post, we created a working knowledge base in AWS. Documents were ingested, chunked, embedded, stored, and tested through the Bedrock console. That gets you to an important milestone: the system works. But a working knowledge base is not the same as a well-tuned one.

Once the pipeline is in place, the next question is simple to state and hard to answer well: what exactly should you retrieve for each user question?

This is where retrieval design begins.

At this stage, a working system can still feel uneven. The corpus may be reasonable and the model may be capable, but retrieval can still return too little evidence, too much noise, or results that are related without being useful.

For the AWS engineering assistant in this series, retrieval design matters because engineers ask both fuzzy conceptual questions and exact operational questions. The system needs to handle both.

This post answers five practical questions:

1. What retrieval controls should you tune after the knowledge base works?
2. How many source chunks should you return?
3. When should metadata filters be used?
4. When does reranking help?
5. How do you detect that retrieval is returning the wrong evidence?

If you want the short version first, jump to [A Practical Default](#a-practical-default).

## Starting Point From the Previous Post

At this point in the series, our baseline looks like this:

- source documents live in S3
- Bedrock Knowledge Bases handles chunking for the main path
- the embedding model is `Amazon Titan Text Embeddings V2`
- the embedding dimension is `1024`
- the vector store is `Amazon S3 Vectors`
- we already tested the knowledge base with simple queries

That means this post is not about standing up the pipeline. It is about tuning what comes back from retrieval now that the pipeline exists. We will keep using the same sample corpus and baseline questions from the earlier labs so the retrieval behavior is easier to compare.

## A Practical Retrieval Flow for the AWS Example

Before looking at each tuning lever separately, it helps to define a simple default retrieval flow.

For the internal engineering assistant, I would start with something like this:

1. embed the user query
2. run semantic retrieval against the knowledge base
3. return a modest number of source chunks, for example 5 as a starting point
4. add metadata filters only after you have designed useful metadata and know how you want to use it
5. consider lexical or hybrid retrieval later only if your vector store supports it and exact identifiers matter often
6. test reranking only if the retrieved candidate set looks promising but badly ordered

This is deliberately conservative. For the exact setup in this series, where we chose `Amazon S3 Vectors`, the starting point is semantic retrieval only. If you had chosen something like OpenSearch Serverless instead, hybrid retrieval would become much more relevant. A simple retrieval flow is easier to debug and gives you a baseline before you add more moving parts.

## How Many Chunks to Return (Top-k): More Is Not Always Better

Top-k determines how many results are passed from retrieval to the answer stage.

If top-k is too small:

- relevant evidence may be missed
- multi-step questions may lack supporting context
- small retrieval mistakes become final answer failures

If top-k is too large:

- unrelated material enters the prompt
- token cost increases
- the model has to sort through more noise

A practical default is to begin with a modest range and evaluate it explicitly rather than picking a large value for safety. For many systems, testing a range such as 5 to 10 results, depending on the chunk size, is a reasonable first pass. The exact number matters less than observing the tradeoff between omission and dilution.

If you followed the previous lab, you have already seen this control in the Bedrock test console as `Source chunks`. In retrieve-only mode, Bedrock also shows a score for each returned chunk. Use those scores directionally: if the first few chunks are strong and the later ones drop off sharply, extra chunks may only add noise.

In agentic RAG designs, top-k often trends lower than in older single-pass RAG systems because the system can retrieve more than once. Instead of stuffing one large context window upfront, the agent can gather evidence across multiple retrieval steps. We will go deeper into that agentic part in the next article.

## Metadata Filters Are Powerful, but Easy to Misuse

Metadata filters are often the cleanest way to improve relevance. They are one way to encode domain knowledge into RAG instead of relying only on semantic similarity.

For example, you might know that a question is about the payment service because the user mentions a ticket ID such as `PAYMENTS-1234`. In that case, filtering to `service=payments` may remove a lot of near-miss documents from other parts of the platform.

This is especially useful when multiple services use similar language. In the running example, the invoice service and payment service may both talk about retries, events, and idempotency, but only one is actually relevant to a given question.

Still, filters can be overused. 

If the system applies narrow filters too aggressively, it may hide valuable evidence that sits outside the expected boundary. That is common when ownership information is incomplete or when the user asks a cross-service question. I usually err on the side of a slightly wider search and trust the LLM to handle some extra context, rather than giving it too little evidence and increasing the risk of hallucinations.

## Hybrid Search Is Often More Practical Than Pure Semantic Search

Semantic retrieval is powerful, but exact terms still matter. Engineers often ask about endpoint names, event names, feature flags, environment variables, error codes, and secret names.

These are cases where hybrid search can help because it combines semantic retrieval with lexical matching, so both meaning and exact phrasing can influence the candidate set.

For the specific path in this series, though, hybrid search is a design note rather than the next lab step. We chose `Amazon S3 Vectors` in the previous post because it keeps the baseline simple, semantic-search focused, and avoids the fixed cost floor of a heavier search service. In Bedrock Knowledge Bases, hybrid search is currently tied to vector stores such as Amazon RDS, Amazon OpenSearch Serverless, and MongoDB when the store contains a filterable text field. If hybrid search becomes a hard requirement for your workload, that is a signal to revisit the vector store choice, not just a retrieval setting to toggle casually.

## Reranking Is Useful When Initial Retrieval Is Broad but Messy

Reranking means taking an initial set of candidates and scoring them again with a stronger relevance judgment.

This is often worth considering when:

- vector search returns plausible but poorly ordered results
- hybrid search produces a useful candidate set with mixed quality
- top-k needs to be a bit larger than you want in the final prompt

The tradeoff is straightforward:

- reranking can improve precision
- reranking adds latency and cost

That means reranking should solve a visible problem. It should not be added merely because it exists in modern retrieval stacks.

## Signs the Retrieval Policy Is Failing

The failure patterns here are often visible:

- answers cite vaguely related chunks
- exact identifiers are missed
- results contain too many duplicates
- cross-service questions pull only one side of the story
- increasing top-k improves recall but damages answer quality

When this happens, do not immediately blame the model. Often the retrieval policy itself is underspecified.

## A Practical Default

My default recommendation for a first serious version is:

- start with semantic retrieval
- add a small number of high-value metadata filters
- introduce hybrid search if identifiers and exact phrases matter frequently
- add reranking only if evaluation shows a ranking problem

For the AWS setup in this series, that means:

- keep `Amazon S3 Vectors` and semantic retrieval as the baseline
- tune `Source chunks` first
- test manual metadata filters with the sidecar files from the sample dataset
- try reranking only after you can see that the right evidence is present but poorly ordered

That sequence keeps the system understandable while still leaving room to improve.

## Hands-on Lab

This lab starts from the knowledge base you created in the previous post.

The goal is not to build anything new. The goal is to tune retrieval and understand what happens when you change the main retrieval controls.

By now, the working setup should be:

- two S3 data sources: `processed/hierarchical/` and `processed/semantic/`
- Bedrock-managed chunking for both sources
- `Amazon Titan Text Embeddings V2` with `1024` dimensions
- `Amazon S3 Vectors` as the vector store
- the sample markdown files and their `.metadata.json` sidecar files uploaded together

### Step 1: Start With Retrieval Only

In the Bedrock console:

1. open your knowledge base
2. choose `Test knowledge base`
3. turn off response generation so you are looking at retrieval first

This is the cleanest way to inspect retrieval quality because it removes the generation model from the loop. You should still test with response generation later, because end-to-end accuracy depends on both the retrieved evidence and how well the model uses it.

### Step 2: Change Source Chunks

The first setting to experiment with is `Source chunks`. Try the same question with several values (ex: 3, 5, 8):

Use questions such as:

- "What retries happen after a payment failure?"
- "Which service publishes invoice events?"
- "How do we rotate the webhook signing secret?"

If you are following the series with the sample dataset from post 2, these three questions should all be answerable from the uploaded markdown files. That makes them good baseline queries for comparing retrieval settings.

For each run, check:

- whether the right document appears at all
- whether the returned chunks are too short or too broad
- whether the additional chunks add useful context or only noise

### Step 3: Try Metadata Filters

If you used the sample dataset from post 2, you do not need to invent metadata files yourself. The sample package now includes metadata sidecar files for each markdown document.

For example, alongside:

- `processed/hierarchical/payments/payment-retry-runbook.md`

you should also have:

- `processed/hierarchical/payments/payment-retry-runbook.md.metadata.json`

Filters only work if Bedrock has metadata to filter on. If you uploaded only the markdown files earlier, download the [agentic RAG sample data package]({{ '/assets/files/agentic-rag/agentic-rag-sample-data.zip' | relative_url }}) and upload the matching `.metadata.json` files before running another sync.

If you want concrete examples before uploading them, here are two of the packaged sidecar files:

- [payment-retry-runbook.md.metadata.json]({{ '/assets/files/agentic-rag/sample-data/processed/hierarchical/payments/payment-retry-runbook.md.metadata.json' | relative_url }})
- [webhook-secret-rotation.md.metadata.json]({{ '/assets/files/agentic-rag/sample-data/processed/hierarchical/webhooks/webhook-secret-rotation.md.metadata.json' | relative_url }})

For an S3 source in Bedrock Knowledge Bases, the metadata file must:

- use the same name as the source file
- append `.metadata.json` to the end of the filename
- live in the same S3 folder as the source file

A metadata file uses a structure like this:

```json
{
  "metadataAttributes": {
    "service": {
      "value": {
        "type": "STRING",
        "stringValue": "payments"
      },
      "includeForEmbedding": true
    },
    "document_type": {
      "value": {
        "type": "STRING",
        "stringValue": "runbook"
      },
      "includeForEmbedding": true
    },
    "environment": {
      "value": {
        "type": "STRING",
        "stringValue": "prod"
      },
      "includeForEmbedding": false
    }
  }
}
```

The important parts are:

- `metadataAttributes`: the set of fields you want Bedrock to ingest
- `type`: the data type of the value
- `includeForEmbedding`: whether the value should also influence embeddings, not just filtering

Useful fields for this series are:

- `service`
- `document_type`
- `environment`
- `owner_team`

In the sample dataset, those fields are already filled in so you can test filters immediately. A few examples are:

- `payment-retry-runbook.md` has `service = payments` and `document_type = runbook`
- `invoice-events-overview.md` has `service = invoices` and `document_type = reference`
- `webhook-secret-rotation.md` has `service = webhooks` and `document_type = runbook`
- `customer-notification-flow.md` has `service = notifications`

For more detail on the sidecar format and supported metadata behavior, see:

- [Connect to Amazon S3 for your knowledge base](https://docs.aws.amazon.com/bedrock/latest/userguide/s3-data-source-connector.html)
- [Include metadata in a data source to improve knowledge base query](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-metadata.html)
- [Configure and customize queries and response generation](https://docs.aws.amazon.com/bedrock/latest/userguide/kb-test-config.html)

After uploading the metadata files, go back to the knowledge base data source and run a sync.

Then confirm the sync worked:

1. open the knowledge base
2. go to the `Data source` section
3. select the data source
4. check the data source overview and sync history
5. confirm that the expected source files were processed and that the metadata files were also recognized during sync

If the metadata files are malformed or named incorrectly, Bedrock can ignore them, so this is the stage where you want to catch that. Once the sync is complete, go back to `Test knowledge base`.

In the test configuration, you will notice two different ways to use filters:

- manual filters
- model-generated filters

Manual filters are explicit. You specify the metadata field, operator, and value yourself. This is the better option when:

- you know exactly what scope you want
- you are debugging retrieval behavior
- you want predictable control

Examples:

- `service = payments`
- `document_type = runbook`

Model-generated filters, which Bedrock refers to as implicit filtering, ask a model to infer the filter criteria from the query and a metadata schema. This is useful when:

- you want the system to infer filters from the user question
- the user is unlikely to specify exact filter values directly
- you already have a well-designed metadata schema

For this lab, I would start with manual filters first. Try a few simple cases such as:

- filter to `service = payments`
- filter to `document_type = runbook`
- filter to `service = webhooks`

Then compare the filtered and unfiltered retrieval results.

With the sample dataset, some useful comparisons are:

- ask "How do we rotate the webhook signing secret?" without a filter, then with `service = webhooks`
- ask "What retries happen after a payment failure?" without a filter, then with `service = payments`
- ask "Which service publishes invoice events?" without a filter, then with `service = invoices`

The goal here is not to over-tune. It is to see when filters remove obvious noise and when they start hiding useful evidence.

### Step 4: Try Reranking

Once basic retrieval is working, the next question is not only "did the right chunks appear?" but also "did the best chunks appear first?"

This is where reranking helps. Bedrock first retrieves an initial candidate set, then a reranking model reorders those results using a stronger relevance judgment.

At the time of writing, Amazon Bedrock supports these reranking models:

- `Amazon Rerank 1.0`
- `Cohere Rerank 3.5`

Which one is available depends on Region. AWS notes that in `us-east-1`, only `Cohere Rerank 3.5` is currently supported.

In the console:

1. open your knowledge base
2. choose `Test knowledge base`
3. stay in retrieval-only mode at first
4. open the configurations panel
5. expand the `Reranking` section
6. choose `Select model`
7. select a reranking model

If Bedrock asks to update the service role permissions for the reranking model, allow that update before testing.

Reranking is most useful when:

- the right documents are present, but the top order feels weak
- the first result is plausible but not the best one
- a broader initial retrieval set looks promising, but too noisy to pass directly to generation

For example, imagine the query:

- "How do we rotate the webhook signing secret?"

Without reranking, the initial retrieval might return:

- a webhook secret rotation runbook
- a generic webhook onboarding guide
- an eventing platform overview
- an engineering onboarding note

All of those may be vaguely related, but only one is the direct answer. Reranking is useful when the correct runbook is already somewhere in the candidate set and you want it pushed to the top.

Another example is:

- "Which service publishes invoice events?"

If retrieval brings back both `invoice-events-overview.md` and the more generic `eventing-platform-overview.md`, reranking can help prioritize the chunk that answers the specific question instead of the chunk that is only generally related.

Reranking is usually not the first thing to add. If the correct documents are missing entirely, reranking cannot fix that. It is for cases where retrieval is close, but the ordering is still weak.

### Step 5: Turn Response Generation Back On

After you are satisfied with retrieval and reranking behavior, enable response generation again and rerun the same questions.

Now compare:

- the retrieved chunks
- the final answer

If the chunks are strong but the answer is weak, retrieval is probably not the only issue. If the chunks are weak, then tuning retrieval is still the right priority.

### What This Lab Should Teach You

By the end of this lab, you should have a clearer sense of:

- how to choose a sensible `Source chunks` value by looking at both chunk quality and score drop-off
- whether the retrieved chunks are strong enough before response generation is turned on
- how metadata sidecar files affect filtering
- when manual filters help and when model-generated filters might be worth exploring
- when reranking improves ordering and when it is not solving the real problem
- whether your current chunking strategy is helping or hurting retrieval

That gives you a strong single-pass retrieval baseline.

In the next post, I will move from retrieval tuning to orchestration: when one retrieval pass is enough, and when the system should think in steps.
