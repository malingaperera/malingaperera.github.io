---
layout: post
title:  Microsoft SQL Server 2016 Database with IMDB 2013 Dataset
date: 2020-03-31
description: Microsoft SQL Server 2016 Database with IMDB 2013 Dataset
tags: microsoft sql-server imdb
categories: database
thumbnail: assets/images/Microsoft-SQL-Server-2016-Database-with-IMDB-2013-Dataset.png
giscus_comments: false
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/Microsoft-SQL-Server-2016-Database-with-IMDB-2013-Dataset.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

Recently I wanted to run the [JOB benchmark](https://github.com/gregrahn/join-order-benchmark) for an experiment. This benchmark uses an [IMDB dataset](http://homepages.cwi.nl/~boncz/job/imdb.tgz), published in 2013. Initially, I had some trouble running the benchmark as it was designed for a PostgreSQL database. And the dataset was created in a UNIX system which can create issues when used in a Windows system. So I decided to share the exact steps you need to take to take in order to create a Microsoft SQL Server database with IMDB dataset. All the scripts used in the project can be found in this [Git repo](https://github.com/malingaperera/imdb_2013_sql_server_2016).

## **Step 1**: Create a database in SQL server.

I simply used SSMS for this but you are free to use any method that you are familiar with. If you want to specifically set the data and log locations for the data set you can use the below script. Replace the db\_location with the right location for your system.

```
USE master ;  
GO  
CREATE DATABASE IMDB  
ON   
( NAME = imdb_dat,  
    FILENAME = 'db_location\imdbdat.mdf',  
    SIZE = 1024MB,  
    MAXSIZE = UNLIMITED,  
    FILEGROWTH = 128MB )  
LOG ON  
( NAME = imdb_log,  
    FILENAME = 'db_location\imdblog.ldf',  
    SIZE = 1024MB,  
    MAXSIZE = 2048GB,  
    FILEGROWTH = 50MB ) ;  
GO 
```

## **Step 2**: Create Tables

Don't use the script you find in the JOB benchmark or with the dataset. This script is created for PostgreSQL and will not work as it is for SQL Server. You can use the edited version below. Note that I have used limits for all the VARCHAR columns under 8000 length. This limit was based on the maximum length of each column. For columns with maximum length over 8000, I have used the VARCHAR(MAX) type.

```
CREATE TABLE aka_name (
    id integer NOT NULL PRIMARY KEY,
    person_id integer NOT NULL,
    name varchar(255),
    imdb_index varchar(3),
    name_pcode_cf varchar(11),
    name_pcode_nf varchar(11),
    surname_pcode varchar(11),
    md5sum varchar(65)
);

CREATE TABLE aka_title (
    id integer NOT NULL PRIMARY KEY,
    movie_id integer NOT NULL,
    title varchar(600),
    imdb_index varchar(4),
    kind_id integer NOT NULL,
    production_year integer,
    phonetic_code varchar(5),
    episode_of_id integer,
    season_nr integer,
    episode_nr integer,
    note varchar(72),
    md5sum varchar(33)
);

CREATE TABLE cast_info (
    id integer NOT NULL PRIMARY KEY,
    person_id integer NOT NULL,
    movie_id integer NOT NULL,
    person_role_id integer,
    note varchar(1000),
    nr_order integer,
    role_id integer NOT NULL
);

CREATE TABLE char_name (
    id integer NOT NULL PRIMARY KEY,
    name varchar(500) NOT NULL,
    imdb_index varchar(2),
    imdb_id integer,
    name_pcode_nf varchar(5),
    surname_pcode varchar(5),
    md5sum varchar(33)
);

CREATE TABLE comp_cast_type (
    id integer NOT NULL PRIMARY KEY,
    kind varchar(32) NOT NULL
);

CREATE TABLE company_name (
    id integer NOT NULL PRIMARY KEY,
    name varchar(255) NOT NULL,
    country_code varchar(6),
    imdb_id integer,
    name_pcode_nf varchar(5),
    name_pcode_sf varchar(5),
    md5sum varchar(33)
);

CREATE TABLE company_type (
    id integer NOT NULL PRIMARY KEY,
    kind varchar(32)
);

CREATE TABLE complete_cast (
    id integer NOT NULL PRIMARY KEY,
    movie_id integer,
    subject_id integer NOT NULL,
    status_id integer NOT NULL
);

CREATE TABLE info_type (
    id integer NOT NULL PRIMARY KEY,
    info varchar(32) NOT NULL
);

CREATE TABLE keyword (
    id integer NOT NULL PRIMARY KEY,
    keyword varchar(100) NOT NULL,
    phonetic_code varchar(6)
);

CREATE TABLE kind_type (
    id integer NOT NULL PRIMARY KEY,
    kind varchar(15)
);

CREATE TABLE link_type (
    id integer NOT NULL PRIMARY KEY,
    link varchar(32) NOT NULL
);

CREATE TABLE movie_companies (
    id integer NOT NULL PRIMARY KEY,
    movie_id integer NOT NULL,
    company_id integer NOT NULL,
    company_type_id integer NOT NULL,
    note varchar(255)
);

CREATE TABLE movie_info_idx (
    id integer NOT NULL PRIMARY KEY,
    movie_id integer NOT NULL,
    info_type_id integer NOT NULL,
    info varchar(10) NOT NULL,
    note varchar(1)
);

CREATE TABLE movie_keyword (
    id integer NOT NULL PRIMARY KEY,
    movie_id integer NOT NULL,
    keyword_id integer NOT NULL
);

CREATE TABLE movie_link (
    id integer NOT NULL PRIMARY KEY,
    movie_id integer NOT NULL,
    linked_movie_id integer NOT NULL,
    link_type_id integer NOT NULL
);

CREATE TABLE name (
    id integer NOT NULL PRIMARY KEY,
    name varchar(125) NOT NULL,
    imdb_index varchar(9),
    imdb_id integer,
    gender varchar(1),
    name_pcode_cf varchar(5),
    name_pcode_nf varchar(5),
    surname_pcode varchar(5),
    md5sum varchar(33)
);

CREATE TABLE role_type (
    id integer NOT NULL PRIMARY KEY,
    role varchar(32) NOT NULL
);

CREATE TABLE title (
    id integer NOT NULL PRIMARY KEY,
    title varchar(350) NOT NULL,
    imdb_index varchar(5),
    kind_id integer NOT NULL,
    production_year integer,
    imdb_id integer,
    phonetic_code varchar(5),
    episode_of_id integer,
    season_nr integer,
    episode_nr integer,
    series_years varchar(49),
    md5sum varchar(33)
);

CREATE TABLE movie_info (
    id integer NOT NULL PRIMARY KEY,
    movie_id integer NOT NULL,
    info_type_id integer NOT NULL,
    info varchar(MAX) NOT NULL,
    note varchar(500)
);

CREATE TABLE person_info (
    id integer NOT NULL PRIMARY KEY,
    person_id integer NOT NULL,
    info_type_id integer NOT NULL,
    info varchar(MAX) NOT NULL,
    note varchar(500)
);
```

## Step 3: Convert data files to a SQL server/Windows-friendly version

Extract the downloaded zip file (I used 7-zip and had to extract it twice to access the files). Seems like these files were created in UNIX system and there are differences in the escaping and the line ending. I run the following python code to edit the files. It creates the edited files in a separate folder called 'edited' inside the original folder. Replace the data\_location with the right location for your system. Make sure you have only data files (csv) in the data location, nothing else.

```
import os
from os.path import isfile, join, exists

imdb_data_location = 'data_location'
os.chdir(imdb_data_location)
only_files = [ f for f in os.listdir('.') if isfile(join('.', f)) ]
if not exists('edited'):
    os.makedirs('edited')
for file in only_files:
    with open(file, "r", encoding='utf-8') as ori:
        with open(f"edited\{file}", "w", encoding='utf-8') as dest:
            for line in ori:
                dest.write(line.replace('\\\\', '#$#$').replace('\\"', '""').replace('#$#$', '\\'))
```


## Step 4: Load data using Bulk load

Now I'm going to use the SQL Server bulk insert to insert the data into the tables. Replace the <data location> with the right location for your system. You don't have to set the `ROWTERMINATOR`, `FIELDTERMINATOR` or the`FIELDQUOTE`, as we have defined the format as CSV.

```
BULK INSERT aka_name FROM 'data_location\edited\aka_name.csv' WITH (FORMAT='CSV', CODEPAGE = '65001')
BULK INSERT aka_title FROM 'data_location\edited\aka_title.csv' WITH (FORMAT='CSV', CODEPAGE = '65001')
BULK INSERT cast_info FROM 'data_location\edited\cast_info.csv' WITH (FORMAT='CSV', CODEPAGE = '65001')
BULK INSERT char_name FROM 'data_location\edited\char_name.csv' WITH (FORMAT='CSV', CODEPAGE = '65001')
BULK INSERT comp_cast_type FROM 'data_location\edited\comp_cast_type.csv' WITH (FORMAT='CSV', CODEPAGE = '65001')
BULK INSERT company_name FROM 'data_location\edited\company_name.csv' WITH (FORMAT='CSV', CODEPAGE = '65001')
BULK INSERT company_type FROM 'data_location\edited\company_type.csv' WITH (FORMAT='CSV', CODEPAGE = '65001')
BULK INSERT complete_cast FROM 'data_location\edited\complete_cast.csv' WITH (FORMAT='CSV', CODEPAGE = '65001')
BULK INSERT info_type FROM 'data_location\edited\info_type.csv' WITH (FORMAT='CSV', CODEPAGE = '65001')
BULK INSERT keyword FROM 'data_location\edited\keyword.csv' WITH (FORMAT='CSV', CODEPAGE = '65001')
BULK INSERT kind_type FROM 'data_location\edited\kind_type.csv' WITH (FORMAT='CSV', CODEPAGE = '65001')
BULK INSERT link_type FROM 'data_location\edited\link_type.csv' WITH (FORMAT='CSV', CODEPAGE = '65001')
BULK INSERT movie_companies FROM 'data_location\edited\movie_companies.csv' WITH (FORMAT='CSV', CODEPAGE = '65001')
BULK INSERT movie_info FROM 'data_location\edited\movie_info.csv' WITH (FORMAT='CSV', CODEPAGE = '65001')
BULK INSERT movie_info_idx FROM 'data_location\edited\movie_info_idx.csv' WITH (FORMAT='CSV', CODEPAGE = '65001')
BULK INSERT movie_keyword FROM 'data_location\edited\movie_keyword.csv' WITH (FORMAT='CSV', CODEPAGE = '65001')
BULK INSERT movie_link FROM 'data_location\edited\movie_link.csv' WITH (FORMAT='CSV', CODEPAGE = '65001')
BULK INSERT name FROM 'data_location\edited\name.csv' WITH (FORMAT='CSV', CODEPAGE = '65001')
BULK INSERT person_info FROM 'data_location\edited\person_info.csv' WITH (FORMAT='CSV', CODEPAGE = '65001')
BULK INSERT role_type FROM 'data_location\edited\role_type.csv' WITH (FORMAT='CSV', CODEPAGE = '65001')
BULK INSERT title FROM 'data_location\edited\title.csv' WITH (FORMAT='CSV', CODEPAGE = '65001')
```

## Step 5 (Optional): Create Foreign Keys

Foreign keys specified in the JOB are not that clear for me. Some of them contradict with the dataset. I re-wrote them to SQL Server based on my understanding. JOB mention that these foreign keys are optional.

```
ALTER TABLE movie_companies ADD CONSTRAINT fk_company_id_movie_companies FOREIGN KEY(company_id) REFERENCES company_name(id);
ALTER TABLE movie_companies ADD CONSTRAINT fk_company_type_id_movie_companies FOREIGN KEY(company_type_id) REFERENCES company_type(id);
ALTER TABLE movie_info_idx ADD CONSTRAINT fk_info_type_id_movie_info_idx FOREIGN KEY(info_type_id) REFERENCES info_type(id);
ALTER TABLE movie_info ADD CONSTRAINT fk_info_type_id_movie_info FOREIGN KEY(info_type_id) REFERENCES info_type(id);
ALTER TABLE person_info ADD CONSTRAINT fk_info_type_id_person_info FOREIGN KEY(info_type_id) REFERENCES info_type(id);
ALTER TABLE movie_keyword ADD CONSTRAINT fk_keyword_id_movie_keyword FOREIGN KEY(keyword_id) REFERENCES keyword(id);
ALTER TABLE aka_title ADD CONSTRAINT fk_kind_id_aka_title FOREIGN KEY(kind_id) REFERENCES kind_type(id);
ALTER TABLE title ADD CONSTRAINT fk_kind_id_title FOREIGN KEY(kind_id) REFERENCES kind_type(id);
ALTER TABLE movie_link ADD CONSTRAINT fk_linked_movie_id_movie_link FOREIGN KEY(linked_movie_id) REFERENCES movie_info(id);
ALTER TABLE movie_link ADD CONSTRAINT fk_link_type_id_movie_link FOREIGN KEY(link_type_id) REFERENCES link_type(id);
-- ALTER TABLE aka_title ADD CONSTRAINT fk_movie_id_aka_title FOREIGN KEY(movie_id) REFERENCES movie_info(id);
ALTER TABLE cast_info ADD CONSTRAINT fk_movie_id_cast_info FOREIGN KEY(movie_id) REFERENCES movie_info(id);
ALTER TABLE complete_cast ADD CONSTRAINT fk_movie_id_complete_cast FOREIGN KEY(movie_id) REFERENCES movie_info(id);
ALTER TABLE movie_companies ADD CONSTRAINT fk_movie_id_movie_companies FOREIGN KEY(movie_id) REFERENCES movie_info(id);
ALTER TABLE movie_info_idx ADD CONSTRAINT fk_movie_id_movie_info_idx FOREIGN KEY(movie_id) REFERENCES movie_info(id);
ALTER TABLE movie_keyword ADD CONSTRAINT fk_movie_id_movie_keyword FOREIGN KEY(movie_id) REFERENCES movie_info(id);
ALTER TABLE movie_link ADD CONSTRAINT fk_movie_id_movie_link FOREIGN KEY(movie_id) REFERENCES movie_info(id);
-- ALTER TABLE aka_name ADD CONSTRAINT fk_person_id_aka_name FOREIGN KEY(person_id) REFERENCES person_info(id);
-- ALTER TABLE cast_info ADD CONSTRAINT fk_person_id_cast_info FOREIGN KEY(person_id) REFERENCES person_info(id);
ALTER TABLE cast_info ADD CONSTRAINT fk_role_id_cast_info FOREIGN KEY(role_id) REFERENCES role_type(id);
```

## Step 6 (Optional): Truncate long columns

Some of you might not like to keep VARCHAR(MAX) columns as you cannot create non-clustered indexes on them. You can use the below scripts to truncate the columns and ALTER the table.

```
UPDATE person_info
SET  info = LEFT(info, 7999)
WHERE LEN(info) > 7999

ALTER TABLE person_info ALTER COLUMN info varchar(7999);

UPDATE movie_info
SET  info = LEFT(info, 7999)
WHERE LEN(info) > 7999

ALTER TABLE movie_info ALTER COLUMN info varchar(7999);
```

Next steps with running the JOB will be added soon...
