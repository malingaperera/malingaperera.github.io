---
layout: post
title:  "SQL Server Snapshot Creation Error - \"All files must be specified for database snapshot creation\""
date: 2021-10-04
description: "SQL Server Snapshot Creation Error - \"All files must be specified for database snapshot creation\""
tags: microsoft sql-server
categories: database
thumbnail: assets/images/All-files-must-be-specified-for-database-snapshot-creation.-1.png
giscus_comments: false
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/All-files-must-be-specified-for-database-snapshot-creation.-1.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

There are several reasons where you will get this error, but I'm going to talk about the one I faced and can be fixed in seconds. I was working with an IMDB dataset. The reason for my error was a database rename. I created the database initially with the name "IMDB" and later renamed it to "IMDB\_001".

Command:

`CREATE DATABASE IMDB_001_snapshot ON   ( NAME = IMDB_001, FILENAME ='--path--\IMDB_001_snapshot.ss' )   AS SNAPSHOT OF IMDB_001;`

Error: All files must be specified for database snapshot creation. Missing the file "IMDB". (5127) (SQLExecDirectW)')

Fix (Using SSMS):

Right-click on the database > Properties > (left menu)Files > Rename the file logical names to current database name (in my case to IMDB\_001)

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/All-files-must-be-specified-for-database-snapshot-creation.jpg" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>
