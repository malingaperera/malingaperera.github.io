---
layout: post
title: "Agentic RAG with AWS 4: Embedding Model Selection"
date: 2026-04-25
description: How to choose an embedding model for an agentic RAG system based on quality, latency, and cost.
tags: rag agents aws llm embeddings
categories:
  - artificial intelligence
thumbnail: assets/images/2026-05-01-agentic-rag-embedding-model-selection/agentic-rag-embedding-model-selection-hero.png
og_image: assets/images/2026-05-01-agentic-rag-embedding-model-selection/agentic-rag-embedding-model-selection-hero.png
giscus_comments: false
published: true
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/2026-05-01-agentic-rag-embedding-model-selection/agentic-rag-embedding-model-selection-hero.png" class="img-fluid rounded z-depth-1 mx-auto d-block" alt="Embedding model overview showing a user query and document chunks transformed into vectors and positioned in vector space" %}
    </div>
</div>

Once documents are clean and you have a sensible chunking strategy, the next question is how to represent those future chunks for retrieval.

That is the job of the embedding model.

A common simplification is to treat embedding selection as "pick the strongest model you can afford." In practice, that is usually not specific enough to guide a good decision. Strength matters, but so do latency, corpus shape, operational simplicity, and the hidden cost of changing your mind later.

For the AWS engineering assistant in this series, the corpus contains runbooks, service flow notes, platform overviews, and onboarding material. That means the embedding model needs to handle both conceptual descriptions and concrete operational language.

This post answers five practical questions:

1. What does the embedding model actually control?
2. How should you compare quality, latency, cost, and operational complexity?
3. When do model dimensions matter?
4. Should you use a managed model or self-host one?
5. Why is changing the embedding model hard to undo later?

If you want the short version first, jump to [A Practical Default](#a-practical-default-for-the-running-example).

## What the Embedding Model Is Actually Doing

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/2026-05-01-agentic-rag-embedding-model-selection/embedding-model-what-it-does.png" class="img-fluid rounded z-depth-1 mx-auto d-block" alt="Three-step diagram showing text converted into vectors, semantically related chunks clustering together, and the top retrieved chunk selected for a payment failure query" %}
    </div>
</div>


An embedding model turns a piece of text into a vector so that semantically related texts end up closer together in a search space.

That sounds abstract, but the consequence is practical: retrieval quality depends on whether the model places the right chunk near the right query.

If an engineer asks, "What retries happen after a payment failure?", the ideal model should place that query close to the payment retry runbook section, even if the document never uses exactly the same wording.

## The Main Tradeoffs

When comparing embedding options, focus on these tradeoffs first:

- **Retrieval quality**: This is the first filter. If the model does not consistently bring back the right evidence for your actual queries, lower cost elsewhere does not help much. In practice, better embeddings usually mean better semantic grouping in vector space, which often improves retrieval quality.
- **Latency**: Most teams starting out do not need to worry much about embedding latency yet. It becomes more important when you are serving a larger number of users or when response-time targets are strict. Larger embedding models can be slower than smaller ones, and higher-dimensional vectors can also add latency downstream in storage and retrieval.
- **Dimension, cost, and storage**: Higher-dimensional vectors often improve retrieval quality, but they also increase storage cost and can increase retrieval latency. That is why dimension is not a small technical detail. It is part of the quality versus cost tradeoff.
- **Operational complexity**: A model that looks slightly better in isolation may still be the wrong choice if it makes deployment, scaling, or maintenance noticeably harder for your team. When the differences are small, the simpler option is often the better starting point.

### Concrete Bedrock Comparison

A practical comparison is `Amazon Titan Text Embeddings V2` versus `Cohere Embed 3 English`.

| Model | Quality | Cost |
| --- | --- | --- |
| `Amazon Titan Text Embeddings V2` | Strong default for text-first RAG. A good fit for internal documentation, runbooks, and service notes. Supports `256`, `512`, and `1024` dimensions, so you can trade off quality against storage more easily. | `$0.02` per `1M` input tokens. |
| `Cohere Embed 3 English` | A reasonable option when the corpus is overwhelmingly English and you prefer the Cohere embedding family. | `$0.10` per `1M` input tokens. |

For the running example in this series, which is mainly English engineering documentation, `Amazon Titan Text Embeddings V2` is still the more natural starting point. `Cohere Embed 3 English` is a reasonable alternative when you want to stay with an English-only Cohere model family.

These details change over time, so check the current [Amazon Bedrock pricing page](https://aws.amazon.com/bedrock/pricing/) and the current model documentation before making a final decision.

Unfortunately AWS knowledge base does not allow change of the embedding systems at this point. That mean you would need to create a new knowledge base were you have to pay the intial embedding cost again. 

## General-Purpose vs Domain-Specific Models

A general-purpose text embedding model is often the best starting point. It is simpler, easier to evaluate, and usually strong enough for a broad engineering corpus.

A more specialized model becomes interesting when the workload has a dominant shape, such as:

- heavily code-oriented repositories
- multilingual documentation
- highly domain-specific terminology

For the AWS assistant example, I would not begin with a niche model unless evaluation clearly shows that the corpus demands it. Runbooks, service flow notes, and platform overviews are technical, but they are still mostly natural language.

## Model Size and Dimension Are Not Free

Higher-dimensional embeddings can improve retrieval quality, but they also affect index size, memory footprint, and retrieval performance downstream.

That means embedding choice is not isolated. It interacts with vector store cost and latency.

This matters more as the corpus grows. A model that looks fine in a small prototype may produce a more expensive storage and retrieval profile than expected at production scale.

The lesson is not "avoid larger embeddings." The lesson is "treat model quality and index cost as one joint decision."

## Managed Endpoint or Self-Hosted Model

In AWS-based systems, this is often the practical fork in the road.

A managed endpoint or API is appealing because it reduces operational burden. It is usually the fastest path to a working system, and in many cases that matters more than squeezing out a marginal gain through self-hosting.

A self-hosted model becomes more attractive when infrastructure control, scale economics, or privacy constraints matter enough to justify running the serving layer yourself.

If you do go down that path, some well-known open-source embedding models to evaluate include [BAAI/bge-small-en-v1.5](https://huggingface.co/BAAI/bge-small-en-v1.5), [mixedbread-ai/mxbai-embed-large-v1](https://huggingface.co/mixedbread-ai/mxbai-embed-large-v1), and [nomic-ai/nomic-embed-text-v1](https://huggingface.co/nomic-ai/nomic-embed-text-v1).

Operating another critical service adds real ongoing work. Unless there is a clear reason otherwise, I would start managed and revisit self-hosting only after the system proves its value.

## A Practical Default for the Running Example

For the internal engineering assistant, I would start with:

- one strong general-purpose embedding model (Amazon Titan Text Embeddings V2)
- managed deployment unless there is a strong reason not to (AWS knowledge base)
- a small evaluation set that includes runbook, service-flow, and onboarding-style queries

## Signs the Embedding Choice Is Failing

Common warning signals include:

- retrieval seems overly sensitive to shared vocabulary and misses chunks that use different wording for the same idea
- semantically similar operational chunks do not consistently cluster near the corresponding user queries
- retrieval quality is acceptable for one document type, such as onboarding notes, but noticeably weaker for another, such as runbooks or service procedures

These patterns matter because they point to the job embeddings are supposed to do: place genuinely similar meanings near each other in vector space. If that mapping is weak, retrieval may still look superficially related while failing to return the most useful evidence.

When those signals appear, the next step is not automatically to switch models. First confirm that ingestion, chunking, and metadata are sound. But once those are solid, embedding quality becomes a legitimate target for improvement.

## Hands-on Lab

This lab is a continuation of the previous chunking lab.

In the last post, the goal was to inspect the Bedrock Knowledge Bases chunking choices without fully creating the knowledge base. In this post, the goal is similar: inspect the embedding-related choices in the AWS console and understand what they mean before we commit to a full setup.

We still will not create the final knowledge base yet as it requires you to commit to a vector store, and that deserves its own discussion in the next post.

### Continue the Console Walkthrough

If you follow the same create-knowledge-base flow in Amazon Bedrock, the next important selections after parsing and chunking are the embedding-related settings in the knowledge base configuration.

The exact screen layout may change over time, but conceptually you will be choosing:

- the embedding model
- the embedding dimension, if the selected model supports multiple dimensions

This is the point where the design starts to become more expensive to undo, so it is worth pausing and understanding the options before clicking through the rest of the flow.

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/2026-05-01-agentic-rag-embedding-model-selection/bedrock-embedding-model-selection.png" class="img-fluid rounded z-depth-1 mx-auto d-block" alt="Amazon Bedrock model selection dialog showing Amazon model provider, Titan Text Embeddings V2 selected, and on-demand inference" %}
    </div>
</div>

### What to Look At in the Console

When you reach the embeddings section, focus on two things.

#### 1. Model choice

The model determines how your chunks and user queries are turned into vectors.

At the time of writing, Amazon Bedrock Knowledge Bases supports these commonly used text embedding models:

- `Amazon Titan Embeddings G1 - Text`
- `Amazon Titan Text Embeddings V2`
- `Cohere Embed English`
- `Cohere Embed Multilingual`

I would think about them like this:

- `Amazon Titan Text Embeddings V2`: the strongest default for this series because it is widely supported in Bedrock Knowledge Bases and gives dimension flexibility
- `Amazon Titan Embeddings G1 - Text`: an older fixed-dimension option that can still work, but I would usually start with Titan V2 unless I had a compatibility reason not to
- `Cohere Embed English`: a reasonable option when the corpus is overwhelmingly English and you prefer the Cohere embedding family
- `Cohere Embed Multilingual`: the option to consider when your documents or user questions span multiple languages

For our running AWS example, where the source content is mainly English engineering documentation, `Amazon Titan Text Embeddings V2` is the most natural starting point.

#### 2. Dimension choice

Dimension is not just a technical footnote. It directly affects vector size, storage cost, and often retrieval quality.

In Bedrock Knowledge Bases today:

- `Amazon Titan Embeddings G1 - Text` uses `1536` dimensions
- `Amazon Titan Text Embeddings V2` supports `256`, `512`, and `1024`
- `Cohere Embed English` uses `1024`
- `Cohere Embed Multilingual` uses `1024`

That means the dimension selector is mostly relevant when you choose Titan V2.

A simple way to think about the Titan V2 options is:

- `256`: smaller vectors, lower storage cost, useful when cost and scale matter more than squeezing out every bit of retrieval quality
- `512`: a middle ground
- `1024`: the safer starting point when quality matters more and the dataset is still manageable

For this series, if I were choosing today for a moderate-sized internal engineering knowledge base, I would start with Titan V2 at `1024` dimensions unless there was already a strong storage or latency reason to go smaller.

### Why This Choice Is Hard to Undo

This is the important operational note to remember: you cannot freely swap the embedding model later inside the same knowledge base.

AWS documents this in the `UpdateKnowledgeBase` API: you cannot change the `knowledgeBaseConfiguration` after the knowledge base is created. In practice, that means changing the embedding model requires recreating the knowledge base and reprocessing the data.

That is why I do not want to rush through this step just because the console makes it look like a simple dropdown choice.

A good habit is to try a few embedding model options on a smaller dataset before committing to a large knowledge base build. That lets you compare retrieval quality and cost with much less rework. In this series, though, the choice is straightforward enough that I am comfortable standardizing on `Amazon Titan Text Embeddings V2` as the default path.

### What to Do in This Lab

For this lab, I would do the following:

1. continue the knowledge base creation flow in the Bedrock console up to the embedding model section
2. inspect which embedding models are available in your Region
3. inspect whether the dimension selector appears for Titan V2
4. note down the model you would choose for this series and why
5. stop before completing the knowledge base creation

If you want a concrete lab answer for the running example, my recommendation is:

- model: `Amazon Titan Text Embeddings V2`
- dimension: `1024`

But treat that as the working default for this series, not as a universal answer for every workload.

We will actually create the knowledge base after the next post, once the vector database choice is properly covered.

In the next post, I will look at where those embeddings live: how to choose the vector database based on corpus size, filter complexity, hybrid search needs, and the amount of operational ownership your team actually wants.
