---
layout: post
title:  "DBA bandits: Self-driving index tuning under ad-hoc, analytical workloads with safety guarantees"
date: 2020-10-26
description: "DBA bandits: Self-driving index tuning under ad-hoc, analytical workloads with safety guarantees"
tags: bandits database index-tuning machine-learning
categories: database
thumbnail: assets/images/DBA-Bandit-Self-driving-index-tuning-under-ad-hoc-analytical-workloads-with-safety-guarantees.png
giscus_comments: false
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/DBA-Bandit-Self-driving-index-tuning-under-ad-hoc-analytical-workloads-with-safety-guarantees.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

#### **Abstract:**

"Automating physical database design has remained a long-term interest in database research due to substantial performance gains afforded by optimised structures. Despite significant progress, a majority of today's commercial solutions are highly manual, requiring offline invocation by database administrators (DBAs) who are expected to identify and supply representative training workloads. Unfortunately, the latest advancements like query stores provide only limited support for dynamic environments. This status quo is untenable: identifying representative static workloads is no longer realistic; and physical design tools remain susceptible to the query optimiser's cost misestimates (stemming from unrealistic assumptions such as attribute value independence and uniformity of data distribution). We propose a self-driving approach to online index selection that eschews the DBA and query optimiser, and instead learns the benefits of viable structures through strategic exploration and direct performance observation. We view the problem as one of sequential decision making under uncertainty, specifically within the bandit learning setting. Multi-armed bandits balance exploration and exploitation to provably guarantee average performance that converges to a fixed policy that is optimal with perfect hindsight. Our comprehensive empirical results demonstrate up to 75% speed-up on shifting and ad-hoc workloads and 28% speed-up on static workloads compared against a state-of-the-art commercial tuning tool." \[1\]

\[1\] Full Paper: [https://arxiv.org/abs/2010.09208](https://arxiv.org/abs/2010.09208)
