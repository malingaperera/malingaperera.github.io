---
layout: post
title:  Performance evaluation between different Druid roll-up levels
date: 2017-08-10
description: Performance evaluation between different Druid roll-up levels
tags: druid
categories: database
thumbnail: assets/images/Druid_MasterLogo_Full-ColorTransparent.png
giscus_comments: false
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/Druid_MasterLogo_Full-ColorTransparent.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

## Introduction

In most datasets with a large number of events, going through individual events is less important. Most of the data use cases are around the summarized data. Druid summarizes this raw data at ingestion time using a process refer to as "roll-up". Roll-up is the highest granularity of the data and will be able to query only up to the roll-up granularity. However, there are some scenarios where it's important to have more granular data. However keeping more granular data comes at a cost. We did a small experiment to identify how different roll-up levels affect performance.

> Rolling up data can dramatically reduce the size of data that needs to be stored (up to a factor of 100). Druid will roll up data as it is ingested to minimize the amount of raw data that needs to be stored. This storage reduction does come at a cost; as we roll up data, we lose the ability to query individual events. Phrased another way, the rollup granularity is the minimum granularity you will be able to explore data at and events are floored to this granularity. Hence, Druid ingestion specs define this granularity as the queryGranularity of the data. The lowest supported queryGranularity is millisecond. -http://druid.io

## Dataset and Setup

We choose a CSV data set with millions (150M+) of records which contain sales data spanning across 2 years. CSV file was around 6 GB in physical size. This is a narrow data set with 3 dimensions and 2 metrics. We had 2 servers where all the components are deployed.

m4 large - Coordinator, Brokers, Overload nodes r3 large - Middle managers and Historical nodes

## Comparison

\[table id=1 /\]

## Query Performance

\[table id=2 /\]

## Conclusion

We saw a performance hit in the storage amount used and the query execution time. The difference in the indexing time is insignificant. Query performance difference is acceptable and Druid handles the segment size difference without having much impact on the query perforamace. Major hit (As I see the only considerable hit) is in the storage. We saw storage use was more than doubled when we went for the minute level roll-up.
