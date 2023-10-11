---
layout: post
title:  PostgreSQL – How to get the total index size used by each table in a database
date: 2020-01-15 21:01:00
description: PostgreSQL – How to get the total index size used by each table in a database
tags: indices postgresql
categories: database
thumbnail: assets/img/postgresql-how-to-get-the-total-index-size-used-by-each-table-in-a-database/postgresql-how-to-get-the-total-index-size-used-by-each-table-in-a-database.png
giscus_comments: false
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets\img\postgresql-how-to-get-the-total-index-size-used-by-each-table-in-a-database\postgresql-how-to-get-the-total-index-size-used-by-each-table-in-a-database.png" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

As per the documentation, To get the total size of all indexes attached to a table, you use the function. The pg_indexes_size() function accepts the OID or table name as the argument and returns the total disk space used by all indexes attached to that table.

We will use this funcion to get the index sizes of each table in the database.

<code>
select relname as table_name, <br />
       pg_size_pretty(pg_indexes_size(relid)) as index_size <br />
from pg_catalog.pg_statio_user_tables; <br />
</code>