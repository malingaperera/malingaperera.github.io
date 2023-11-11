---
layout: post
title:  "Continuous data loading from MySQL to Hive [Using Tungsten]"
date: 2015-05-31
description: "Continuous data loading from MySQL to Hive [Using Tungsten]"
tags: mysql tungsten hive
categories: database
thumbnail: assets/images/mysql-to-hive1.jpg
giscus_comments: false
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/mysql-to-hive1.jpg" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

## Introduction \[Skip If needed\]

### What is Hive

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/hive_logo.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

"The Apache Hive™ data warehouse software facilitates querying and managing large datasets residing in distributed storage. Hive provides a mechanism to project structure onto this data and query the data using a SQL-like language called HiveQL. At the same time this language also allows traditional map/reduce programmers to plug in their custom mappers and reducers when it is inconvenient or inefficient to express this logic in HiveQL."_

~ [Hive official site](https://hive.apache.org/)

### Why Hive

Hive is been used in lot of Major companies including Facebook and Google. Hive excels at real time processing of large amount of data. Any use case that talks about querying large amounts of data in near real time can be benefited by hive. Hive is superior in availability, scalability and manageability. Hive now have capability to store complicated schemas and advance operations like table alteration. If you are a user stuck with a MySQL warehouse and want to get your data into hive for some real time complex querying, it will not be a hard job to replicate the same RDBMS schema in the hive. Following are some real world use cases of hive

- Bizo: We use Hive for reporting and ad hoc queries.
- Chitika: for data mining and analysis
- CNET: for data mining, log analysis and ad hoc queries
- Digg: data mining, log analysis, R&D, reporting/analytics
- Grooveshark: user analytics, dataset cleaning, machine learning R&D.
- Hi5: analytics, machine learning, social graph analysis.
- HubSpot: to serve near real-time web analytics.
- Last.fm: for various ad hoc queries.
- Trending Topics: for log data normalization and building sample data sets for trend detection R&D.
- VideoEgg: analyze all the usage data

Hope you have enough motivation now let us move into the business.

## Process

## Continuous data loading from MySQL to Hive

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/mysql_hdfs_integration.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

1. Use Tungsten to get the MySQL bin logs CSV files
2. Use DDLScan tool to create the Hive Staging and base table structures
3. Use Map-Reduce job to load base tables from the staging tables.
4. \[Optional\] Use bc tool to compare MySQL table and hive table
5. Setup continuous loading

## Scope

Here I will no talk about setting up tungsten replication and assume that you have setup the tungsten replication and you have csv files in a hadoop file location. We will talk about rest of the process in detail. I will use the code found in the scripts found in the https://github.com/continuent/continuent-tools-hadoop GIT location in above process. I will not go into the Map-Reduce jobs and how it works.

## Prerequisites

- Install and configure tungsten server and client
- Get a git clone https://github.com/continuent/continuent-tools-hadoop.git
- Create a user account in MySQL, Hadoop and OS (i created a user hive with password password) to be used in the process
- Setup hive and create a DB to load data
- \[Optional\] Setup hue

## Detailed Description

### Step 1 - Creating Staging and Base tables in the Hive

We will use the DDLScan tool in the continuent/tungsten/tungsten-replicator/bin/ to create the Staging and Base table structures in the hive. Go to the folder, which you can find the ddlscan scripts. Below 2 commands will create the Staging and Base table structures. We can use the load-reduce-check found in the cloned git repo for everything but you can use the below scripts as this is most of the time a onetime process.

#### Creating the staging tables

ddlscan -user hive -url jdbc:mysql:thin://localhost:3306/DB\_NAME -pass password -template ddl-mysql-hive-0.10-staging.vm -db DB\_NAME -opt hdfsStagingDir /path/to/hadoop/csv | hive

#### Creating the base tables

ddlscan -user hive -url jdbc:mysql:thin://localhost:3306/DB\_NAME -pass password -template ddl-mysql-hive-0.10.vm -db DB\_NAME | hive

After you have ran the above scripts. You will see that there are two sets of tables. For each MySQL table (call it TABLE), there will be 2 hive tables. One with the same name (TABLE) and one with 'Staging\_XXX\_' prefix (Staging\_XXX\_TABLE). In addition, if you browse data you will see that staging tables already have data whereas base tables are empty. As we are yet to load data to hive tables how can staging tables are already loaded. This is a simple representation of the CSV files itself. Staging tables shows the CSV files data in the table structure. Here we cannot do querying as we do in the base table.

You can use the load-reduce-check script to do the same work as above. Below command can perform the same job performed by above two commands.

load-reduce-check -U jdbc:mysql:thin://localhost:3306/DB\_NAME -D /path/to/hadoop/csv -r /path/to/continuent/dir -s DB\_NAME -u tungsten -p password -v --no-compare --no-map-reduce --no-materialize --no-meta --no-sqoop

\[NOTE\] load-reduce-check is a complete script from table creation to data loading. We can skip steps in the script and in the above command; I have skipped almost everything other than table creation. In both occasions hive DB should be there to create tables.

### Step 2 - Loading data to base tables

Here we will run the load-reduce-check with skipping unwanted steps to get the data loaded to the base tables. This will run the Map-Reduce against each staging table and will populate the base tables.

load-reduce-check -U jdbc:mysql:thin://localhost:3306/DISCO -D /user/tungsten/staging/alpha -r /ebs/continuent -s DISCO -u tungsten -p password -v --no-base-ddl --no-compaer --no-staging-ddl --no-base-ddl

### Step 3 - Setting up continuous loading

When you complete the step 2 you will be able to browse data in the base tables. Now we have to setup continuous loading. We can run the step 2 again and again but it will run the map reduce on the full dataset again. So we need to run the map-reduce job on the delta and append it to the hive table. Below i have listed process I have used to load data continuously to hive

1. Stop tungsten replication
2. Run Map-reduce
3. Move the CSV files
4. Start tungsten replication

## Conclusion

To summarize, I have discussed the continuous data loading to hive from mysql. We used the scripts found in https://github.com/continuent/continuent-tools-hadoop.git git location to create tables and load data. If you have, any more issues when following the process please comment below. I ran into lot of permission issues while following this process and most of them can be solved by creating a user with one username in all the places (hive, hadoop, OS).

#### \[HELP\] load-reduce-check

-    -D, --staging-dir String         Directory within Hadoop for staging data (default=/user/tungsten/staging)
-    -l, --log String                 Log file for detailed output
-    -m, --metadata String           Table metadata JSON file (/tmp/meta.json)
-    -P, --schema-prefix String       Prefix for schema names (defaults to replication service
-    -p, --password String           MySQL password
-    -q, --sqoop-dir String           Directory within Hadoop for Sqooped table data (default=/user/tungsten/sqoop)
-    -r, --replicator String         Replicator home (/opt/continuent)
-    -S, --service String             Replicator service that generated data
-    -s, --schema String             DBMS schema
-    -t, --table String               Table within schema (default=all)
-    -U, --url String                 MySQL DBMS JDBC url
-    -u, --user String               MySQL user
-    -v, --verbose                   Print verbose output
-        --hive-ext-libs String       Location of Hive JDBC jar files
-        --\[no-\]base-ddl             Load base table ddl
-        --\[no-\]compare               Compare to source data
-        --\[no-\]map-reduce           Materialize view for tables (deprecated)
-        --\[no-\]materialize           Materialize view for tables
-        --\[no-\]meta                 Generate metadata for tables
-        --\[no-\]sqoop                 Generate Sqoop commands to provision data
-        --\[no-\]staging-ddl           Load staging table ddl
-    -h, --help                       Displays help
