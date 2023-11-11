---
layout: post
title:  Application Aware Sharding for a MySQL Database
date: 2016-09-25
description: Application Aware Sharding for a MySQL Database
tags: sharding scaling mysql
categories: database
thumbnail: assets/images/MySQL.svg_.png
giscus_comments: false
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/MySQL.svg_.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

# Introduction

When MySQL databases get too large, it become extremely hard to maintain as well as it reaches physical limits. Under maintainability issues we normally came across,

1. Taking too much time to ALTER a table
2. Became impossible to take dumps
3. Have to move tables to separate disks time to time
4. Etc.

If someone is looking for a database sharding as a solution, this maintainability issue must have exhausted him. In this article, I am going to share my personal experience in sharding a large MySQL database in real life. With the hands on experience on this large project, I am aware of lot of things related to sharding and organization level issue, concerns and limitations when you are going ahead with this project. This attempt is to go through the project from end to end so anyone who is about to do something similar can get benefit of my knowledge. **Before going to the article, I must share several things with you.**

1. After this project, do not expect any **performance gain** on your day-to-day queries. This might actually add an additional overhead on your queries as your data will be shattered among multiple places. However, this will greatly improve the maintainability and will make sure that your data architecture **survive** in the fullness of time.
2. What I am going to talk about is **application aware sharding** and there are few other ways to do sharding in the data layer, which will be seamless to the applications. However, at the time of writing I did not find and tool that supports MySQL sharding in the DB level. Existing options are either not reliable or adds a large overhead on queries.
3. Sharding itself might not be the full answer for the problem. Sharding might need be **accompanied with several sub projects** that will supplement shading to reach its potential. This is feather explained the next section (“Problem and Solution”). I will be concentrating on the sharding project and will not explain much on the other supplementary projects.
4. You must be in a **real need** to do this project and you must have identified this as the only way to solve this problem before proceed because what you are going to start is a **big project**.
5. I have skipped some **sensitive information** as it relates to the company I am working for.

# Problem and Solution

**Problem:** Data was growing in our MySQL database in rapid rates and we needed to make it constant as it lead to so many maintainability issues. With the amount of data grew bigger and number of queries per second was increased, there was even a possibility of downtimes. We needed to make the data volume in the MySQL a constant and keep it in a maintainable level. **Solution:** We thought of partitioning the data and in the same time purging the old data to make size of data in one database somewhat constant. Therefore, there were two supplement projects carried out with the sharding project. One is to purge old data (purging project), and master data management (MDM project, moved some selected set of data to a central location). Data that could not be sharded due to various reasons and which global to the company was moved out, in the MDM project.

[![sharding-architecture, Application Aware Sharding for a MySQL Database](images/Sharding-architecture.png)](https://www.malinga.me/wp-content/uploads/2016/09/Sharding-architecture.png)

# The old setup

Before we did the sharding, we had everything on one large database. It was serving us fine until it became too big. I will be skipping the actual setup information, as they are sensitive information to the company. As an example, I will use following data structure. Think we have a database with **student information** with all there marks, lectures, enrollments and all other details. New students were added to the database each day and information per student was growing. As this was not maintainable, we need to keep it in a maintainable level.

# Sharding Plan

When we started this project, we had a project plan,

1. Identify the shard dividing criteria or partition key
2. Based on the criteria divide the existing data into three sets (static, sharded and master data).
3. Come up with the sharding architecture
4. Discuss with all stakeholders (applications which are consuming the database) and change the architecture if need.
5. Do application changes and in the meantime do the infrastructure setup.
6. Testing
7. Production deployment

I will go through each of these points and explain the main responsibilities that comes under that step and the problems we faced while executing each step.

### Identify the shard dividing criteria (partition key)

Under this step, our goal was to identify the main entity based on which the data will be divided among the shards. As going with our example, that is the student. So based on the student ID, shard will be decided. This is a very critical decision, as whole project will be based on this. If it is hard to identify this entity, try to **understand how your data grows**. As in our example addition of new students and due to student data growth, space required for our database grew. Therefor student is our main entity.

### Dividing data into groups

With the main entity defined, we will be dividing our main data set in to 3 parts. **Data that can be sharded** (these are information that has a direct connection with the student entity, may be grades table, student information table, student enrollment table, etc. Most of the time this is simply tables having student ID in primary key.) **Master data**: Data that spans across all students. (As an example think there is a table to store notifications sent to the students as a batch. This belongs to all students. They should be moved to another central database) **Static data** required by queries made to the sharded data (As an example think there is a list of courses, which is required when taking enrollment details, for students. There are join queries between this table and sharded tables. Therefor even this needs to be marked as master data, yet we cannot move it to another database). Data sets that are small enough to be replicated and rarely changed was identified as static data. After we understand these three sets of data, we decided what to do with them. Initially we planned for sharded data (which will be sharded) and master data (which was moved to a central location). However later we came across this static data, which we replicated among all shards. It was applications responsibility to make it consistence among all shards. However, these are most of the time static data sets that did not change.

### Sharding architecture

Next big job was to come up with a sharding architecture. I have shown a sample architecture below showing all the major components.

[![sharding-architecture, Application Aware Sharding for a MySQL Database](images/Sharding-architecture.png)](https://www.malinga.me/wp-content/uploads/2016/09/Sharding-architecture.png) In application aware sharding, architecture and the flow is **very simple**. When an application wants to make a query, first it looks up the shard API and find the shard ID for a given student. I will talk about the shard API and its responsibilities in the next section. We keep a cache of the shard API data in the application level. Because this data is unlikely to change, and in our case, it does not change at all. However, in your scenario if it is possible to change the shard ID for a given student ID, time to time, either it is possible to run without a cache or keep a cache invalidation method. As we have decide to use student as the main entity and based on the student ID, data will be divided among shards. Think we have 20 students, and 1-10 resides in the shard 1 and 11-20 resides in the shard 2. Moreover, application wants to do an update to student number 15. For this scenario, flow will be as follows.

[![Application Aware Sharding for a MySQL Database](images/Flow.png)](https://www.malinga.me/wp-content/uploads/2016/09/Flow.png)

### Shard API

There are several duties of the shard API and giving the shard ID for each student is the main job. Other than that, finding the shard for the new student will be done by the shard API. This was debated whether we need to give this responsibility to the application where student creation happen or the shard API. As there can be multiple applications which can create new merchants, if we put that logic (ex: round robin) in the application, it will be duplicated. In addition, application have to be aware of the database design and loads in each shard to decide the correct shard for the new merchant. We did not want any of that and therefor application do not have to think about where new students are created. Application will simply call addStudent (student ID) or some similar endpoint and API will add the student ID to its DB and will return the shard ID. I used JSON responses in the shard API. I had mainly four endpoint in the shard API.

get\_student\_shard <Student ID> => ShardID
add\_student <Student ID> => ShardID
get\_all\_student => all students and their respective shards
get\_all\_shards => get all the shard information for each shard

### Discussion with all stakeholders

After deciding on the architecture, we went for a discussion with all the stakeholders, which seemed to be the hardest part in the project. This meeting should include all the application owners that are currently using the database and everyone who planning to use the database. If every application connects to the DB via a same API layer, changes will be minimum and we only have to change the API layer. In this discussion, we need to discuss on several things,

- Check whether our grouping of data is correct and there are no objections by any application. Normally there might be an application that joins master data with sharded data.
- Get time lines for each application and find the application with most changes and in the critical path.
- Explain the shard API and its duties (Will need good API documentation) Deploying in the production

When you are ready with all the changes to the applications and related infrastructure, we are ready for the production push. This will be one of the biggest releases you will encounter in your work life. Therefor make sure there are complete testing before this day. Always have a rollback process.

# Conclusion

This might not cover everything related to the project. Feel free to comment below with any of the questions you might having on the sharding project. We have successfully completed the sharding project and we are happy with the plan we followed. This didn't apply any overhead to the applications, as we cached the shard API responses in the application level.
