---
layout: post
title:  PostgreSQL – BULK INSERTING from a delimited file, Most common errors in Windows
date: 2021-01-20
description: PostgreSQL – BULK INSERTING from a delimited file, Most common errors in Windows
tags: microsoft postgresql
categories: database
thumbnail: assets/images/postgresql-bulk-inserting-from-a-delimited-file-most-common-errors-in-windows.png
giscus_comments: false
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/postgresql-bulk-inserting-from-a-delimited-file-most-common-errors-in-windows.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

PostgreSQL alternative for MS SQL Server BULK INSERT is the equally simple [COPY](https://www.postgresql.org/docs/current/sql-copy.html) command. In this article, we are going to take a step by step look at how to use this and possible errors. So I tried below command, which is completely correct. I faced a couple of issues when fixed it worked fine.

```
COPY part FROM '...Desktop\TPCH_001\pg_part.tbl' WITH (DELIMITER  '|')
```

## **Errors**

```
ERROR: could not open file "file.tbl" for reading: Permission denied.
HINT:  COPY FROM instructs the PostgreSQL server process to read a file.  You may want a client-side facility such as psql's \copy. 
SQL state: 42501
```

To resolve this error, you need to update the permission of the file so that PostgreSQL can read them. Get to the folder/file, right-click and get to properties. Go to the Security tab. You need to add "Everyone" to the list. [More info](https://ourtechroom.com/tech/importing-csv-file-in-postgresql-table/)

```
ERROR:  extra data after last expected column data ending with dilimiter
```

This mean you have more columns the CSV than expected. As example you might have 4 column in CSV file and only 3 columns in the table. If it was other way around (table having more columns than file) we can define the needed columns in the query like below.

```
COPY part (p_partkey, p_name, p_mfgr, p_brand, p_type, p_size, p_container, p_retailprice, p_comment) FROM '...Desktop\TPCH_001\pg_part.tbl' WITH (DELIMITER  '|')
```

In my case, I used a simple python file to edit the files and write a new file. Yes! the only option is to edit the file. In my case I had a extra delimiter at the end of each line.

```
import os
from os import listdir
from os.path import isfile, join


data_location = "path_to_folder"
files = [f for f in listdir(data_location) if isfile(join(data_location, f))]
output_folder = "edited"

if not os.path.exists(os.path.join(data_location, output_folder)):
    os.makedirs(os.path.join(data_location, output_folder))

for file in files:
    with open(os.path.join(data_location, file), 'r+') as input_file, open(os.path.join(data_location, output_folder, file), 'w+') as output_file:
        line = input_file.readline()
        while line:
            output_file.write(line[:-2]+'\n')
            line = input_file.readline()
```

After these 2 fixes, my command ran without any issue.
