---
layout: post
title: "Managing Context Is the Real Skill in AI-Assisted Development"
date: 2026-05-26
description: How to use context files and a two-phase workflow to get consistent output from AI agents, even on long and complex tasks.
tags: ai agents llm context-engineering productivity software-engineering
categories:
  - artificial intelligence
thumbnail: assets/images/2026-05-26-context-management-ai-agents/context-management-ai-agents.png
og_image: assets/images/2026-05-26-context-management-ai-agents/context-management-ai-agents.png
giscus_comments: true
published: false
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/2026-05-26-context-management-ai-agents/context-management-ai-agents.png" class="img-fluid rounded z-depth-1 mx-auto d-block" alt="Two-phase context management workflow: research phase filling the context window, distilled into context files, then a clean implementation phase" zoomable=true %}
    </div>
</div>

If you have never seen your AI agent's context window reach 90%, or watched it silently compress your conversation history to make room for more, this post is probably not for you yet.

But if you have hit that wall — if you have seen **output quality drop mid-session**, watched the agent forget decisions you made an hour ago, or noticed it start repeating earlier mistakes after a compression — this post is about the skill that fixes it. Of all the signals that separate fluent AI users from everyone else, **how someone manages context is the one that matters most**.

That skill is **context management**. Not in the abstract sense, but as a practical discipline: designing files, updating them continuously, and structuring your sessions so that **clearing the context is something you can do at any time** without losing anything important.

## Why Context Degrades

LLM models process everything inside a fixed context window. As that window fills, two things happen.

First, **quality degrades**. Research from multiple independent benchmarks has found that every tested model produces worse output as context grows. One study found that 11 out of 13 models dropped below 50% of their baseline accuracy at just 32,000 tokens. A separate finding showed that performance can drop by more than 30% when the most relevant information drifts to the **middle** of a long context, rather than sitting near the beginning or end. The problem is not just size — it is **position and noise**.

Second, **the agent compresses**. When context runs out, the system summarizes earlier parts of the conversation to make room. This compression is **automatic and indiscriminate**. It does not know which decisions mattered, which wrong turns are now irrelevant, or which context is load-bearing for the task ahead. You get a lossy summary of a process that may have taken hours.

Neither of these outcomes is a bug. They are properties of the technology. The question is whether you design your workflow around them or hope they do not cause problems.

Modern flagship models are getting significantly better at handling long contexts and at producing useful compressions. That is real progress. But it does not change the fundamental asymmetry: **a user who knows what matters will always select better context than a model that has to guess**. Compression is a heuristic applied to a conversation the model did not fully understand. A context file is a decision made by the person who did. No matter how good auto-compression gets, it is working with less information than you have.

## The Signal Most People Miss

If you have never used `/clear` — or its equivalent in whatever agent tool you use — you are probably not managing context intentionally.

That sounds like a strong claim, but it follows from the problem above. If context degrades as it grows, and if compression removes things you may still need, then the right response is to **reset deliberately** before the system resets for you. Doing that safely requires that the important parts of your session are **already written down** somewhere other than the conversation history.

**The ability to clear at any time is not the goal. It is the result of doing context management well.** If clearing feels risky — if you worry about losing something — that is the signal that you have not yet externalized what matters.

## The Two-Phase Technique

Context fills fastest during research — exploring approaches, hitting dead ends, evaluating options. By the time you know what to build, the window is full of everything you considered, including what you rejected. The two-phase model is a useful way to structure around this.

**Phase one: research and capture.** Go wide with the agent. Write to context files as you go — every ruled-out approach, every confirmed constraint. When you have converged on a direction, inspect the files you have created, then clear.

**Phase two: implementation.** Load the **required files**. Build against them. Keep updating as implementation decisions accumulate. If context fills again, clear and reload — the files are the source of truth, not the conversation.

The discipline is not a strict two-step process. It is **writing to files continuously** throughout the session — during research and during implementation — so that clearing is always safe. A practical trigger: **context crossed 50%? Update the files.**

## What the Files Look Like

For a typical coding task, phase one might produce files like these (this is only an example, feel free to struture them as you wish):

**`requirement.md`** — What the system needs to do, in precise terms. Not a copy of the original request, but the clarified version you arrived at after working through the problem.

**`architecture.md`** — The approach you chose and why. Which patterns apply, which libraries to use, how the pieces fit together. Enough to explain the design without re-deriving it.

**`implementation.md`** — The data structures, schemas, APIs, or formats the implementation will work with, along with any low-level implementation details the agent will need in front of it to write correct code.

**`tasks.md`** — The implementation broken into discrete steps. Ordered, specific, and independent enough that each one can be worked on without the full context of all the others.

These files are **not documentation** for the final product. They are **working context for the implementation phase**. They are written to be consumed by an agent, not read by a human reviewer.

## A Concrete Example

Requirement: add a data export feature. Ambiguous enough to mean a dozen different things.

- **Research phase:** explore exporters in similar tools, evaluate formats, check API surface, consider data volume and edge cases
- **Rejected:** streaming response — memory pressure, timeout risk on large datasets
- **Rejected:** JSON — too verbose, poor usability at scale
- **Chosen:** background job producing a CSV export, stored in S3, delivered via signed URL
- **Deferred:** pagination — noted but not in scope for this iteration
- **Context state:** all four directions — chosen and discarded — are now equally present in the window

Your context now contains all of that — the useful parts and the discarded ones, in roughly equal measure.

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/2026-05-26-context-management-ai-agents/context-management-example.svg" class="img-fluid rounded z-depth-1 mx-auto d-block" alt="Diagram showing research phase with three explored approaches, four context files as handoff, and a clean implementation phase" zoomable=true %}
    </div>
</div>

You write four files. The requirement file captures the final, precise scope. The architecture file explains the S3-plus-signed-URL approach and why. The data file lists the fields to export and their types. The tasks file breaks the work into eight steps.

Then you clear the context, load the four files, and start building. The agent has everything it needs and nothing it does not.

## How Other Tools Handle This

The pattern of separating research from implementation is not new. Knowing the power of good context management, some tools are beginning to automate it via plan and act modes.

[Kiro](https://kiro.dev/docs/specs/), Amazon's agentic IDE, is a good example. When you describe a feature, Kiro does not immediately start writing code. It first generates a **spec** — three structured documents: `requirements.md`, `design.md`, and `tasks.md`. You review and approve them, then Kiro implements against the spec. The research-and-capture phase is automated; the implementation phase starts with a clean, curated context. It is the two-phase technique built into the tool.

That said, I have always found this mode too rigid in practice. The enforced plan-then-build sequence starts to feel like waterfall — it works well for clearly scoped features but constrains you when the problem shifts mid-session. Managing context yourself keeps that flexibility.

## Clean Over Compress

**Active context management inverts the compression problem.** You decide what matters by writing it down. The act of distilling the session into files is itself useful — it forces you to **separate signal from noise** before the implementation starts, and it surfaces gaps in your understanding while you can still address them.

**Compression is a safety net. Context files are the discipline that makes the safety net unnecessary.**

## Some Last Words

**Context is a resource, not a record.** A conversation transcript captures how you got somewhere. The context you load for implementation should contain only what you need to build. Those are different things — and confusing them is why so many long AI sessions end with degraded output and a model that has forgotten what it agreed to an hour ago.

Write the files. Clear when you need to. Reload only what matters.

Sources:
- [LLM Context Window Management and Long-Context Strategies 2026 \| Zylos Research](https://zylos.ai/research/2026-01-19-llm-context-management)
- [Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/pdf/2307.03172)
