---
layout: post
title: "TPC-H HTAP: INSERT, UPDATE, DELETE Queries for Skewed Datasets"
date: 2026-01-04
description: Generating transactional queries for TPC-H Skew to enable realistic HTAP workload testing
tags: databases benchmarking HTAP research
categories: research
giscus_comments: true
---

While HTAP (Hybrid Transactional/Analytical Processing) workloads exist for database benchmarking, **none of them support highly skewed data distributions** like those found in real-world systems. This is a significant gap because production databases rarely have uniformly distributed data.

## The Missing Piece

[TPC-H Skew](https://www.microsoft.com/en-us/download/details.aspx?id=52430) provides realistic, skewed data distributions that mirror production environments where some customers place thousands of orders while others place just one, and some products are bestsellers while others barely sell. However, TPC-H Skew only provides analytical (SELECT) queries.

Modern databases need to handle both:
- **Analytical queries**: Complex reports and aggregations (OLAP)
- **Transactional queries**: INSERT, UPDATE, DELETE operations (OLTP)

To test databases under realistic mixed workloads, we need both—with skewed data.

## The Solution

The [TPC-H HTAP project](https://github.com/malingaperera/TPC_H_HTAP) generates INSERT, UPDATE, and DELETE queries for TPC-H Skew (and standard TPC-H). This enables realistic HTAP benchmarking where:

- Analytical queries run on skewed data
- Transactional queries continuously modify the database
- The workload reflects what actually happens in production

## How to Use It

1. Set up [TPC-H Skew](https://www.microsoft.com/en-us/download/details.aspx?id=52430) and generate your base dataset
2. Generate seeds: `./Debug/dbgen -v -O s -s 10`
3. Generate refresh data: `./Debug/dbgen -v -U 2 -s 10`
4. Copy generated files to the `tpc_h_data` folder
5. Customize SQL syntax in `tpc_h_htap_qgen.py` for your database
6. Run the script to generate INSERT, UPDATE, and DELETE queries

The tool is database-agnostic (SQL Server syntax provided) and allows you to configure which records to update based on your testing needs.

## Why This Matters

This benchmark was crucial for evaluating [HMAB](https://malingaperera.github.io/blog/2026/hmab-self-driving-database-tuning-explained/), our self-driving database tuning system. HTAP workloads with skewed data are particularly challenging because:

- The database structure changes as inserts and deletes occur
- Indexes that speed up transactions might slow down analytics
- Data skew makes optimizer estimates unreliable

Testing on realistic workloads revealed that HMAB achieves up to 96% performance improvement precisely because it learns from actual execution rather than relying on estimates.

Without realistic HTAP benchmarks with skewed data, we optimize for idealized scenarios that don't reflect production reality



---

**Code**: [TPC-H HTAP Workload on GitHub](https://github.com/malingaperera/TPC_H_HTAP)  
**TPC-H Skew**: [Download from Microsoft](https://www.microsoft.com/en-us/download/details.aspx?id=52430)
