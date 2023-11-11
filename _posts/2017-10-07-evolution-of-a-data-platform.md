---
layout: post
title:  Evolution of a Data Platform
date: 2017-10-07
description: Evolution of a Data Platform
tags: data-platform
categories: database
thumbnail: assets/images/AAEAAQAAAAAAAAM3AAAAJDhiNDJhZGMyLWVlNjMtNDAwNi1iZTY4LWQ4NmZmYmJlNmUxZg.jpg
giscus_comments: false
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/AAEAAQAAAAAAAAM3AAAAJDhiNDJhZGMyLWVlNjMtNDAwNi1iZTY4LWQ4NmZmYmJlNmUxZg.jpg" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

Being a startup is "great" as a feeling. Startup culture is filled with so much positive energy to get the things done. In this process of getting things done, one thing we miss is the proper design in a data platform. It is understandable that people start with a simple data platform and evolve it over the time. Starting with the perfect data platform is less practical when we consider the cost involved and the lack of domain knowledge in initial stages. We should all admit that proper data platform costs a lot, which sometimes not efficient for a startup. My personal opinion is to start small and to evolve with time. Here we will talk about common problems that we faced in a start-up data platform.

## Lacking Scalability

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/scalability.jpg" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

Scalability issues impact in several ends. Startup systems are not meant to scale until the end of time. Sometimes they become impossible to scale, sometimes scaling requires so much additional effort that they need a separate team working on scaling the data platform. Sometimes scaling is involved with a large cost that is rapidly increasing. Sometimes scaling increases the overall system complexity and reduce maintainability. If I summarize main impact area of scalability costs, it will be as follows,

- Being impossible to scale
- High Cost of scaling
- Increasing manual tasks of Scaling
- Increase in system complexity while scaling
- Reduction of system maintainability

Proper data platform design should answer above concerns. Proper design should be scalable beyond the foreseeable future. While scaling it should minimize the cost additions, remove any complexity additions and should involve minimal or no manual effort.

## Security and Access Control

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/internet-security-tools.jpg" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

In a start-up, all the developers might have DB access and most of them even have SSH access to DB server and root access to your database. In addition, you might not have wrapped the entire database system with APIs. There will be some applications, which directly call the databases. These are only few security and access control issues that you will have to face when you are trying to move to a better data platform. As the first step, you might need to revisit the list of users who have server access and the DB access and make sure that only required people have access to the server and the database. This you need to do before someone truncate your database, just by accident. Second most important thing is to make sure there is no application that accesses databases directly.  This will require a lot of application changes and testing.

## Setting the expectations

While being a start-up we might have promised so many things to the end users with the small amount of data that we have. One common example is Reports. It is easy to provide a full-time report to the last minute, straight from your transactional database when your data set is small. However, with time you realize that reports need to be taken from report optimized data solution (It can be a data warehouse, Data Lake, column store or any other solution). However while giving reports from these new data solutions; sometimes it is hard to get the same old behavior. In addition, providing the same old report with the new data source might be less efficient in the complexity and cost aspects. Therefore, you might have to rethink the use cases of your data and do a redesign of reports and other data consumers, so that they efficiently use the new data sources. When you do a good analysis based on the real use cases, you will find out that even though you are not providing the same old behavior, you are not missing out in any of the real use cases. Only concern is we will have to set the end user expectations again to for the new design. This will obviously will be taken as a critical concern from the product owner’s end.

## Application Changes

We should expect many application changes while moving to the new data platform. However, if a company need to grow, it is necessary to move to a proper data platform removing all scalability issues. Here there will be a lot of resistance from the other parties within the organization as this requires so much effort and will not be recognized or visible as a new feature. The only question you should ask from the other teams is “Will our existing data platform survive when our end user count doubles?”

## Warning signs

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/warning-signs-you-should-not-accept-that-job-810x540.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

If you are still in a start-up mindset and if you are still using your transactional database for reporting be careful about the warning signs. This warning signs will tell you the right time to move to a better data platform. Even some organizations who are midway towards a solid data platform with separate report optimized data sources, following warning signs that remind you to rethink the existing data platform. Think your organization grows to be two times larger than the current size (most of the time in terms of data flow to the data platform and the number of end users who are directly consuming the data). What will happen to your data platform?

1. Will the complexity increase? Will it add more and more moving parts that will increase the overall system complexity?
2. Will it involve a lot of manual tasks? Will you have to provision new servers every month and manually setup them to scale your system?
3. Will the cost increase more than 50% of your existing cost?
4. Will the system become less maintainable requiring a lot of maintenance overhead all the time?

If the answer is ‘Yes’ for any of the questions above take it as a warning sign. The basic test will be on the complexity, maintainability and manual tasks. If any of them seems like uncontrollable, you are in trouble.

## Conclusion

Changing the data platform is one of the hardest projects that you will come across as an organization. However, what we need to make sure is that we are ready for scaling in terms of data. In addition, we need to the make sure this new design will serve the organization beyond the foreseeable future.
