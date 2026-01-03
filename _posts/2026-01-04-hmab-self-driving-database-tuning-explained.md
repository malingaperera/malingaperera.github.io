---
layout: post
title: "HMAB: Teaching Databases to Tune Themselves"
date: 2026-01-04
description: A simple explanation of how HMAB uses machine learning to automatically optimize database performance
tags: research databases machine-learning
categories: research
thumbnail: assets/images/DBA-Bandit-Self-driving-index-tuning-under-ad-hoc-analytical-workloads-with-safety-guarantees.png
giscus_comments: true
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/DBA-Bandit-Self-driving-index-tuning-under-ad-hoc-analytical-workloads-with-safety-guarantees.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

If you've ever worked with databases, you know they can be finicky. The same database can run a query in seconds or hours depending on how it's set up. Traditionally, this optimization has been the job of specialized database administrators (DBAs) who spend countless hours tweaking settings and creating "indexes" and "materialized views"—special structures that help databases find data faster.

But what if the database could learn to optimize itself?

## The Problem: Database Tuning is Hard

Imagine you're organizing a massive library. You could arrange books alphabetically by title, by author, or by subject. Each arrangement makes some searches faster and others slower. Now imagine the library has millions of books, and people are constantly asking for different combinations of books. How do you organize it?

This is essentially what happens in databases. **Indexes** are like card catalogs that help you find specific information quickly. **Materialized views** are like pre-organized reading lists for common requests. Creating the right combination of these structures is crucial for performance, but it's incredibly complex:

- There are often millions of possible configurations
- Traditional tools rely on the database's "cost estimator," which is frequently wrong
- Workloads change over time—what worked yesterday might not work today
- Creating these structures takes time and resources

## Enter HMAB: A Smarter Approach

HMAB (Hierarchical Multi-Armed Bandits) takes a fundamentally different approach. Instead of relying on estimates, it **learns from experience**.

### The Multi-Armed Bandit Analogy

The name comes from a classic problem in machine learning: imagine you're in a casino with multiple slot machines (one-armed bandits). Each machine has a different, unknown payout rate. How do you figure out which machines are best while maximizing your winnings?

You face a dilemma:
- **Explore**: Try different machines to learn which are best
- **Exploit**: Keep playing the machines that have worked well so far

HMAB applies this same principle to database tuning. It strategically explores different configurations (indexes and views) while exploiting what it has learned to keep performance high.

### How HMAB Works

HMAB uses a clever two-layer hierarchy:

**Layer 1: Specialists**
- Multiple specialized "bandits" each focus on a specific area
- One set handles materialized views for the entire database
- Another set handles indexes, with one specialist per table
- Each specialist recommends candidate structures

**Layer 2: The Coordinator**
- Takes all the candidates from Layer 1
- Decides which combination to actually use
- Learns which structures work well together

This hierarchy is powerful because:
1. **It's modular**: You can add or remove specialists without disrupting the system
2. **It's efficient**: Specialists can run in parallel on multi-core systems
3. **It learns from reality**: Instead of trusting the database's estimates, HMAB creates structures and observes actual performance

### A Smart Optimization: Hypothetical Checks

Creating database structures is expensive. HMAB reduces this cost with a clever trick: before actually creating a structure, it asks the database optimizer, "Would you even use this?" If the answer is no, HMAB skips creation entirely, saving up to 58% of creation time.

This hybrid approach gets the best of both worlds: learning from real execution while avoiding unnecessary work.

## The Results: Impressive Gains

We tested HMAB against state-of-the-art commercial database tuning tools using industry-standard benchmarks (TPC-H, TPC-DS, and real-world datasets like IMDb). The results were striking:

- **Up to 96% performance improvement** over commercial tools on complex workloads
- **91% gain** on modern analytical benchmarks (TPC-DS)
- **Strong performance on dynamic workloads** where queries constantly change—a scenario where traditional tools struggle

Even on uniform datasets where traditional tools excel, HMAB remains competitive while offering far better performance on the skewed, messy data that real-world systems actually encounter.

### Why Traditional Tools Struggle

Traditional tools have two main problems:

1. **They rely on estimates**: Database optimizers estimate query costs, but these estimates can be wildly wrong, especially with complex queries or skewed data
2. **They need representative workloads**: You have to tell them what queries to optimize for—but in dynamic systems, workloads constantly change

HMAB sidesteps both issues by continuously learning from actual execution.

## What This Means for the Future

HMAB represents a shift toward **self-driving databases**. Instead of requiring expert DBAs to constantly monitor and tune systems, databases can learn to optimize themselves.

This is particularly important as:
- **Cloud databases** serve unpredictable, multi-tenant workloads
- **Data becomes more skewed and complex**, breaking traditional optimizer assumptions
- **Real-time analytics** demand constant adaptation to changing query patterns

The system even comes with **provable performance guarantees**—something rare in machine learning approaches—ensuring it won't make things catastrophically worse while learning.

## The Technical Innovation

For those interested in the technical details, HMAB introduces several innovations:

- **Hierarchical Multi-Armed Bandits**: A novel bandit architecture that extends contextual and combinatorial bandits into a hierarchy, enabling efficient handling of massive action spaces while leveraging parallel processing
- **Context design**: Each specialist uses a compact representation of database features, allowing efficient learning
- **Reward structure**: The system learns from both execution time improvements and creation costs
- **Hierarchical architecture**: The first system to holistically tune multiple types of physical design structures (indexes AND views) using machine learning

## Try It Yourself

The code is available as an artifact for the research community. Whether you're a database administrator curious about automated tuning, a researcher working on database optimization, or a developer dealing with slow queries, HMAB demonstrates that databases can indeed learn to tune themselves.

---

**Read the full paper**: [HMAB: Self-Driving Hierarchy of Bandits for Integrated Physical Database Design Tuning](https://www.vldb.org/pvldb/vol16/p216-perera.pdf) published in PVLDB 2022.

**Authors**: R. Malinga Perera, Bastian Oetomo, Benjamin I. P. Rubinstein, and Renata Borovica-Gajic from the University of Melbourne.
