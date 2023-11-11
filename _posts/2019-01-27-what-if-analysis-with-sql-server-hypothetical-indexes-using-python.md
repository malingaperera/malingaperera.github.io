---
layout: post
title:  "What-if Analysis with SQL server (Hypothetical Indexes) – Using python"
date: 2019-01-27
description: "What-if Analysis with SQL server (Hypothetical Indexes) – Using python"
tags: sql-server hypothetical-indexes python
categories: database
thumbnail: assets/images/microsoft-sql-server-1.png
giscus_comments: false
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/microsoft-sql-server-1.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

If you are a Database administrator or a developer working with a transaction database, you might have come across this problem

“Is it worthy to build that index?”

Exact answer for that question is only known once you build it. However, luckily SQL server provides you with functionality to check the workload performance under hypothetical indexes (without actually creating them)

You can find more information about hypothetical indexes [here](https://www.red-gate.com/simple-talk/sql/database-administration/hypothetical-indexes-on-sql-server/).

I will just provide you with a simple python code that will help you with the hypothetical index creation. Example code will compose of 3 parts

1. Index creation
2. Enabling the index (unlike the normal indexes you need to enable them before using)
3. Executing the query under the hypothetical index

### Index creation

def hyp\_create\_index\_v2(connection, schema\_name, tbl\_name, col\_names, idx\_name, include\_cols=()):
    """
    Create an hypothetical index on the given table

    :param connection: sql\_connection
    :param schema\_name: name of the database schema
    :param tbl\_name: name of the database table
    :param col\_names: string list of column names
    :param idx\_name: name of the index
    :param include\_cols: columns that needed to be added as includes
    """
    query = f"CREATE NONCLUSTERED INDEX {idx\_name} ON {schema\_name}.{tbl\_name} ({', '.join(col\_names)}) " \\
            f"INCLUDE ({', '.join(include\_cols)}) WITH STATISTICS\_ONLY = -1"
    cursor = connection.cursor()
    cursor.execute(query)
    connection.commit()
    logging.info(f"Added HYP: {idx\_name}")

### Enabling the indexes

def hyp\_enable\_index(connection):
    """
    This enables the hypothetical indexes for the given connection. This will be enabled for a given connection and all
    hypothetical queries must be executed via the same connection
    :param connection: connection for which hypothetical indexes will be enabled
    """
    query = f'''SELECT dbid = Db\_id(),
                    objectid = object\_id,
                    indid = index\_id
                FROM   sys.indexes
                WHERE  is\_hypothetical = 1;'''
    cursor = connection.cursor()
    cursor.execute(query)
    result\_rows = cursor.fetchall()
    for result\_row in result\_rows:
        query\_2 = f"DBCC AUTOPILOT(0, {result\_row\[0\]}, {result\_row\[1\]}, {result\_row\[2\]})"
        cursor.execute(query\_2)

### Executing the query

def hyp\_execute\_query(connection, query):
    """
    This hypothetically executes the given query and return the estimated sub tree cost. If required we can add the
    operation cost as well. However, most of the cases operation cost at the top level is 0.

    :param connection: sql\_connection
    :param query: query that need to be executed
    :return: estimated sub tree cost
    """
    hyp\_enable\_index(connection)
    cursor = connection.cursor()
    cursor.execute("SET AUTOPILOT ON")
    cursor.execute(query)
    stat\_xml = cursor.fetchone()\[0\]
    cursor.execute("SET AUTOPILOT OFF")
    query\_plan = QueryPlan(stat\_xml)
    return query\_plan.estimated\_sub\_tree\_cost, query\_plan.index\_seeks
