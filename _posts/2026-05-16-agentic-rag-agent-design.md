---
layout: post
title: "Agentic RAG with AWS 7: The Agentic Layer, Planning, Tools, and Multi-Step Retrieval"
date: 2026-05-16
description: How to decide when an agentic RAG system should use iterative retrieval, planning, or tools.
tags: rag agents aws llm orchestration
categories:
  - artificial intelligence
thumbnail: assets/images/2026-05-16-agentic-rag-agent-design/agentic-rag-agent-design.png
og_image: assets/images/2026-05-16-agentic-rag-agent-design/agentic-rag-agent-design.png
giscus_comments: false
published: true
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/2026-05-16-agentic-rag-agent-design/agentic-rag-agent-design.png" class="img-fluid rounded z-depth-1 mx-auto d-block" alt="Agentic RAG orchestration layer showing retrieval, planning, tools, stopping rules, and final grounded answer" zoomable=true %}
    </div>
</div>

In the previous post, we tuned retrieval until the knowledge base could return a strong single-pass baseline: the right chunks, in a reasonable order, with enough evidence to answer many questions well.

This post begins where that one stops.

Once single-pass retrieval is working, the next question is no longer only "how do I retrieve better?" It becomes "when should I stop after one retrieval pass, and when should the system do more?"

That is the point in the series where the word "agentic" becomes operational rather than descriptive. The system is no longer just retrieving context. It is being given a bounded responsibility: decide whether the current evidence is enough, and take one more useful step when it is not.

This post answers five practical questions:

1. When is single-pass RAG enough?
2. When is an agentic loop justified?
3. How do query rewriting, decomposition, and tool use fit together?
4. What stopping conditions keep the agent under control?
5. How can you test multi-step retrieval in AWS?

If you want the short version first, jump to [A Conservative Default](#a-conservative-default).

## Standard RAG vs Agentic RAG

A standard RAG system usually follows a simple, linear pattern:

1. retrieve relevant context
2. pass it to the model
3. generate an answer

An agentic RAG system adds a decision layer around that pattern.

Instead of assuming that one retrieval step is always enough, the system can pause and ask:

- do I need to reformulate the query?
- do I need another retrieval step?
- do I need to break the question into smaller parts?
- do I need a tool or structured lookup?

That is why query rewriting, question decomposition, and tool use belong in this post. They are not random extra techniques. They are specific actions the system can take once you introduce an agentic decision layer, and each one should earn its place.

## The Agentic Loop

The simplest way to think about agentic RAG is as a loop:

1. retrieve some evidence
2. inspect what came back
3. decide whether that evidence is enough
4. if not, take another action
5. stop when the system has enough evidence or knows it does not

The extra action in step 4 is the key. In practice, it is usually one of a small set of things:

- rewrite the query
- decompose the question
- retrieve again with a narrower goal
- call a tool or structured system

The rest of this post is really about those actions and when they are justified.

## The Temptation to Add an Agent Too Early

Once teams see tool use, planning loops, and query rewriting in demos, it is easy to think that an advanced system should obviously include them. In an ideal with strong agents, which knows exactly when to stop, this can be true. However, generally this can hurt performance and accuracy. 

Every extra reasoning step adds:

- latency
- more failure modes
- more prompt complexity
- more evaluation surface

If standard retrieval is enough, agent behavior is unnecessary complexity.This connects back to the accountability problem with AI systems generally. More autonomy is only useful when the responsibility is narrow enough to test, observe, and constrain.

## When the Agentic Loop Is Worth It

An agentic step is justified when the question cannot be answered reliably from one direct retrieval pass.

Typical examples include:

- multi-hop questions that span several documents, for example: "What happens after a payment failure and where does customer notification finally happen?"
- vague questions that need reformulation before retrieval, for example: "Where do we change the secret thing for incoming webhooks?"
- questions that mix documents with structured system state, for example: "Which service publishes invoice events, and is that service currently enabled in production?"
- questions where partial evidence should trigger another targeted search, for example: "I found the payment retry runbook, but which downstream service actually consumes those retry events?"

In the running AWS example, "Which service publishes invoice events?" probably does not need a planner.

But "What happens after a payment failure and where does customer notification finally happen?" may justify multiple retrieval steps because the answer crosses service boundaries.

## Common Agent Actions

Once the system decides one retrieval pass is not enough, it usually needs to choose what kind of next step to take. The three most common actions are query rewriting, question decomposition, and tool use.

## Query Rewriting

Query rewriting helps when the user asks in a way that is natural for humans but inefficient for search. For example, an engineer might ask:

"Where do we change the secret thing for incoming webhooks?"

The system may improve retrieval by rewriting that into a more retrieval-friendly form such as:

- webhook signing secret rotation
- webhook gateway signing secret rotation
- service or environment specific variants

This is useful, but it should be bounded. Uncontrolled rewriting can drift away from the real user intent.

## Question Decomposition

Some questions are really bundles of smaller questions. A decomposition step can help the system answer them more reliably:

Original question:

"What happens after a payment failure, which events are published, and which service eventually sends the customer notification?"

Possible decomposition:

- what happens after payment failure
- which events are published
- which service sends the customer notification

This is often more effective than trying to retrieve one perfect chunk set for the entire question at once.

## Tool Use

Document retrieval is not always enough. Sometimes the answer depends partly on structured state, such as:

- a current service registry
- a configuration store
- an internal API
- a permissions-aware lookup

This is where tool use becomes more than "fancy RAG." It becomes necessary system integration. But the same rule still applies: only add tools when they answer a real information gap that retrieval cannot cover cleanly.

## Stopping Conditions Matter

An agentic system needs a clear definition of when to stop. Without that, it can fall into unhelpful loops:

- repeated retrieval with no new evidence
- tool calls that restate the same fact
- query rewrites that drift further from the original intent

Good stopping conditions are usually simple:

- maximum number of retrieval attempts
- maximum number of tool calls
- stop when no materially new evidence appears
- stop when evidence is still insufficient and say so clearly

The system should prefer a bounded "I do not have enough evidence" over a long chain of low-value actions.

## A Conservative Default

For most teams, I would start with a conservative design:

- default to one retrieval pass
- allow query rewriting only for clearly ambiguous questions
- allow decomposition only for obviously multi-hop questions
- use tools only when the answer genuinely requires structured lookups

This keeps the system understandable and makes evaluation much easier.

## Hands-on Lab

The previous labs stayed mostly inside the Bedrock console. This lab is different because the interesting behavior now lives outside retrieval itself.

Here you will move the orchestration into a small AWS Lambda function so you can see what the agentic layer actually does:

- decompose one question into smaller retrieval queries
- call the knowledge base multiple times
- filter and deduplicate the returned chunks
- call a text model to synthesize the final grounded answer

That is still a small workflow, not a general-purpose agent. That is a good thing. At this stage you want something you can inspect end to end, especially because every extra step should be visible in evaluation.

### Step 1: Download the Lab File

Download [agentic_rag_lab_lambda.py]({{ '/assets/files/agentic-rag/agentic_rag_lab_lambda.py' | relative_url }}).

This file is intentionally simple:

- it uses `Retrieve` against the Bedrock knowledge base you already created
- it asks a Bedrock text model to decompose the original question
- it performs multiple retrieval calls
- it synthesizes a final answer from the combined evidence

### Step 2: Create a Lambda Execution Role

Create an IAM role for Lambda. In the AWS console:

1. open `IAM`
2. go to `Roles`
3. choose `Create role`
4. pick `AWS service`
5. pick `Lambda`
6. attach `AWSLambdaBasicExecutionRole`

Then add an inline policy so the function can query the knowledge base and invoke the answer model.

For this lab, a simple policy is enough:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "RetrieveFromKnowledgeBase",
      "Effect": "Allow",
      "Action": [
        "bedrock:Retrieve"
      ],
      "Resource": "arn:aws:bedrock:REGION:ACCOUNT_ID:knowledge-base/KB_ID"
    },
    {
      "Sid": "InvokeAnswerModel",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": "*"
    }
  ]
}
```

Replace `REGION`, `ACCOUNT_ID`, and `KB_ID` with your values.

For the lab, using `Resource: "*"` for `bedrock:InvokeModel` is acceptable. In production, narrow that to the specific model or inference profile you actually use.

Also make sure your AWS account has model access enabled in Bedrock for the model you plan to use for decomposition and answer generation.

### Step 3: Create the Lambda Function

In the AWS console:

1. open `Lambda`
2. choose `Create function`
3. pick `Author from scratch`
4. choose `Python 3.12`
5. attach the IAM role from the previous step

Then replace the contents of the default `lambda_function.py` editor with the downloaded file.

Set these environment variables:

- `KB_ID`: the knowledge base ID from post 5
- `MODEL_ID`: a text-generation model or inference profile that supports the Converse API and that you already have access to in Bedrock
- `RESULTS_PER_QUERY`: start with `3`
- `MAX_SUBQUESTIONS`: start with `3`
- `MIN_SCORE`: start with `0.35`

Then deploy the function.

For this lab, the function is doing three agentic things explicitly:

- deciding whether the question should be split
- retrieving evidence for each sub-question
- producing one final answer from the combined evidence set

### Step 4: Test It with a Multi-Hop Question

Create a Lambda test event like this:

```json
{
  "query": "What happens after a payment failure, which events are published, and which service eventually sends the customer notification?"
}
```

Run the function and inspect the JSON response.

Pay attention to these fields:

- `sub_questions`: how the model decomposed the query
- `retrieval_log`: how many chunks came back for each sub-question
- `chunks_used`: how many unique chunks survived filtering and deduplication
- `answer`: the final synthesized response

This is the main difference from the Bedrock test console: you can now see the intermediate steps instead of only the final retrieval or final answer.

If you used the sample dataset from post 2, a good result should usually combine evidence from:

- `payment-failure-handling.md`
- `invoice-events-overview.md`
- `customer-notification-flow.md`

### Step 5: Compare It with the Single-Pass Baseline

Now go back to `Test knowledge base` in the Bedrock console and run the same question in:

- `Retrieve` mode
- `Retrieve and generate` mode

Compare that baseline with the Lambda result.

You are looking for concrete differences such as:

- whether decomposition finds source chunks that the single query missed
- whether the final answer is more complete
- whether the extra step mostly added value or mostly added latency

This comparison is important. If the multi-step version is not clearly better on this question, then the agentic layer is not earning its complexity yet.

### Step 6: Tune the Boundaries Instead of Adding More Complexity

Before adding more planner logic, tune the small controls you already have.

Try a few variations:

- raise `RESULTS_PER_QUERY` from `3` to `4` or `5` if one sub-question is missing useful evidence
- raise `MIN_SCORE` if you are keeping too many weak chunks
- lower `MAX_SUBQUESTIONS` if the decomposition becomes noisy

Then test a simpler question such as:

- "Which service publishes invoice events?"

For a question like that, the function should usually keep the query simple and avoid an elaborate retrieval path. If it starts splitting easy questions into too many parts, your agentic logic is already too aggressive.

### Step 7: Notice Where a Real Tool Would Be Needed

Now try a mixed question such as:

- "Which service publishes invoice events, and is that service currently enabled in production?"

The first half is document retrieval. The second half is probably not.

That is where the limit of this Lambda becomes clear. It can decompose and retrieve from the knowledge base, but it cannot answer questions that require current structured state unless you add another tool, such as:

- a DynamoDB lookup
- an internal API call
- a configuration service query

This is exactly why agentic RAG is not just "retrieve more." It is about deciding when another kind of action is justified, and when the honest answer is that the system does not have the right source of truth yet.

### What This Lab Should Teach You

By the end of this lab, you should have a clearer sense of:

- how the agentic layer looks when you implement it as normal AWS application code
- when multi-step retrieval produces a better answer than the single-pass baseline
- how query decomposition changes the evidence set that reaches the final model
- where document retrieval stops being enough and a real tool would be needed
- why it is better to start with a small, inspectable loop than a vague autonomous agent

That is the main point of the post: the agentic layer is not there to make every query more elaborate. It is there to add extra steps only when the simpler path is not enough.

## Where Frameworks Fit

You do not have to keep this orchestration hand-written forever.

Frameworks such as LangChain already provide patterns that cover part of this flow. A relevant example is `MultiQueryRetriever`.

That retriever uses an LLM to generate multiple query variants, runs retrieval for each, and returns the union of the retrieved documents. That is close to what this Lambda is doing, but with a slightly different emphasis:

- `MultiQueryRetriever` is mainly about query diversification
- the Lambda in this lab is using more explicit question decomposition and answer synthesis

If your main problem is "one query phrasing misses relevant chunks," `MultiQueryRetriever` is a reasonable abstraction.

If you later need state, tool calling, routing, or bounded multi-step planning, a fuller orchestration layer such as LangGraph is usually a better fit than stacking more prompt logic into one Lambda function.

## Signs the Agent Layer Is Hurting More Than Helping

You have probably gone too far if:

- latency increases sharply without better answer quality
- the system takes multiple steps on simple questions
- tool calls repeat without adding new evidence
- debugging the answer path becomes harder than debugging the answer itself

In those cases, the system may be compensating for weak retrieval with excessive orchestration.

Agent behavior is valuable when it handles questions that simpler pipelines cannot answer well. It is not valuable when it turns easy questions into elaborate workflows.

In the next post, I will look at what happens after retrieval and planning are finished: how to assemble context and prompt the model so the final answer stays grounded in evidence instead of drifting into polished guesswork.
