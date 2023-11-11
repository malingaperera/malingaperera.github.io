---
layout: post
title:  "[Scrum] Adding new priorities to the current sprint"
date: 2021-01-20
description: "[Scrum] Adding new priorities to the current sprint"
tags: scrum
categories: software-engineering
thumbnail: assets/images/Scrum-Adding-new-priorities-to-the-current-sprint1.jpg
giscus_comments: false
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/Scrum-Adding-new-priorities-to-the-current-sprint1.jpg" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

We see changes in priorities from time to time. With the nature of the team, we need to expect newer priorities even in the middle of a sprint. New priorities can come as a production issue or a new feature development with higher ROI. I work in a service team where we get high priority items all the time. I like to talk about how we handle those issues in this article.

## What is the ideal way to handle Additional Requirements \[real scrum way\]

> Once a sprint begins, you cannot add requirements or stories to the backlog

It is simple as above; We cannot add additional requirements to the sprint after it begins. In an ideal world, if we do not obey at least one Scrum rule, we cannot claim that we are following Scrum. Therefore, if we need to align to pure Scrum, we need to close the current sprint, prioritize the backlog, and start a new sprint with a new priority list.

## Ideal way doesn't seems to be efficient for us

As we already know, there are so many hybrid versions of scrum due to scrum being inefficient in some situations. In our case, all members get some ad-hoc tasks while some team members get many ad-hoc tasks (related database administration). Therefore, we decided to fork out the original scrum and make an efficient version of it.

We tried so many things, and I like to share some of the things we tried and how they worked out for us. Please remember that not all of us were fully cross-functional because we were new to pure scrum.

#### Solution 1: Identify a member that can attend most of those ad-hoc tasks and keep him out of the sprint

IInitially, this seemed to work well, and there was less effect on the current sprint from the ad-hoc tasks. However, with time, we identify that even though there is a separate person for ad-hoc tasks, he needed help from the others. At the same time, we saw that he was idle on some occasions where there was enough work in the sprint backlog. Moreover, as he was out of the sprint, it was hard to keep track of him. With all those drawbacks, we decided to get him back into the sprint and search for other options.

#### Solution 2: Estimating the ad-hoc work in the panning and have a story for it

Our next move was to calculate the time the person mentioned above spent on the ad-hoc tasks and estimate it in the planning meeting. Here we created an ad-hoc story for several members and tried to estimate them with our knowledge from the past sprints. We hoped that we would better estimate future sprints with experience. Unfortunately, we identified that this ad-hoc task estimate was wrong and changed drastically from sprint to sprint.

#### Solution 3: Limiting the sprint length to one week

Limiting the sprint length to one week was one of the best decisions we ever made. We could hold most of the ad-hoc tasks to the next sprint with this change. Most people agreed to wait for 3-4 days to get the task done. Still, some tickets required immediate attention (e.g. high critical production issues). With this change, we observed that deviation in the estimates in the ad-hoc task ticket was reduced. After this, following the Scrum practices were very much simplified.

#### Solution 4: Removing the ad-hoc story from the sprint

We saw that the ad-hoc task had some advert effect on the burn-down and velocity charts. Some sprints did not have a lot of ad-hoc tasks, but the total estimate was counted in the velocity. In addition, these stories did not have clear and well-defined DoDs (Definition of Done ). Therefore, we decided to keep the ad-hoc story out of the sprint and let the velocity fall to some extent. Here some members worked on the ad-hoc tasks and tracked the ad-hoc story. However, this story was not be counted in the team velocity as it was out of the sprint.

## Conclusion

With many changes and experiments, we decided to keep some changes and decided to revert some. Finally, we went with 1-week sprints and had an ad-hoc story to track the ad-hoc tasks outside the sprint. Other than that, we took several actions to ensure we had minimum ad-hoc tasks.

1. Building good communication channels with other teams and getting to know about the upcoming changes before the planning meeting
2. Notifying all other teams that we are following Scrum and not accepting any tickets after the planning meeting. (Not entirely true)

We cannot call this SCRUM anymore. However, this version of SCRUM seems to work for us, and it helped us follow other scrum-related ceremonies and traditions perfectly. We came close to Scrum by going a little away from pure Scrum.
