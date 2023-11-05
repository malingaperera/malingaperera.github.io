---
layout: post
description: Reading and Understanding the Storm UI [Storm UI explained]
tags: life other
categories: other
thumbnail: assets/images/Understanding-storm-UI.jpg
giscus_comments: false
title: "Reading and Understanding the Storm UI [Storm UI explained]"
date: "2015-04-08"
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/Understanding-storm-UI.jpg" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

I tried to find a document that explains every parameter in the storm UI, but I did not find any. So I thought of starting one of my own. I will start this with whatever information I have by now and will try to make it completes as possible. Thanks to all the forums and sites that help to find these information. Note that this is a live document and you can suggest edits though comments, as this is neither perfect nor complete.

I will cover 4 major views that you can find in the storm UI and go through all the parameters in that view. This might lead to some repetitions, but I ignored that to keep this simple as possible. Before we start you need to know few basic terms. You might need to click and zoom the images as they are unreadable in the default zoom level.

## Basic terms

- Tasks - A "task" is a single thread of execution for a bolt or spout in a topology. A topology executes as many worker processes across the cluster, and every spout and bolt executes as many threads. Each worker process contains within it some number of threads for some number of spouts and/or bolts. For instance, you may have 300 threads specified across all your components and 50 worker processes specified in your configuration. Each worker process will execute 6 threads, each of which of could belong to a different component. You tune the performance of Storm topologies by tweaking the parallelism for each component and the number of worker processes those threads should run.

- Latency - The latency there is intentional since the bolt is buffering tuples and batching writes to a database. The stat measures the time between a tuple being received and being marked as completed (acked), and that bolt acks the tuple only after it has been written to the db.

- Emitted - Emitted is the number of times one of the "emit" methods is called on the OutputCollector.

- Transferred - Transferred is the number of actual tuples sent to other tasks.

> EX: If “bolt-B” has 5 tasks and subscribes to “bolt-A” using an "all" grouping, "transferred" will be 5x "emitted" for that stream of bolt A. Similarly, if bolt A emits a stream that no one subscribes to; "transferred" will be 0.

In addition, I highly recommend that you go through following article that explains about the storm parallelism. Article can be found [here](http://www.michael-noll.com/blog/2012/10/16/understanding-the-parallelism-of-a-storm-topology/) \[[http://www.michael-noll.com/blog/2012/10/16/understanding-the-parallelism-of-a-storm-topology/](http://www.michael-noll.com/blog/2012/10/16/understanding-the-parallelism-of-a-storm-topology/)\]. This helped me a lot while learning storm concepts.

## Cluster Home - First Page \[Landing page\]

This is the landing page for storm. If you make a http GET though browser to the storm http port you will get this page. This gives you a summarized view of your cluster.

###  Table 1 - Cluster Summary

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/Reading-and-Understanding-the-Storm-UI-cluster-summary.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>


- Version – The version of storm installed on the UI node. \[It is assumed that all nodes have the same storm version\]
- Nimbus up-time - The duration the current Nimbus instance has been running. (Note that the storm cluster may have been deployed and available for a much longer period than the current Nimbus process has been running.). As nimbus act as the highest level coordinator in the storm cluster. Nimbus uptime simply shows the cluster uptime in most of the times. However thats not always true.
- Supervisors - The number of nodes in the cluster currently
- Total slots – Number of workers in the cluster \[You have to define the number of slots per machine and its most of the time same as number of cores in the machine\]
- Used slots – Number of workers that are occupied
- Free slots – Number of workers, which are free
- Tasks - A Task is an instance of a Bolt or Spout. If you sum the parallelism numbers of each spout and blot, you can find the number of tasks.
- Executors – Number of threads. These reside in the worker processes. You can define how many tasks are assigned to an executor. You need a good understanding about the storm parallelism to understand this number.

### Table 2 - Topology Summary

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/Reading-and-Understanding-the-Storm-UI-Topology-summary.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

- Name - The name given to the topology by when it was submitted. You can click this name to view the Topology's information. We will talk about the topology's information below.
- Id - The unique ID given to a Topology each time it is launched.
- Status - The status can be one of ACTIVE, INACTIVE, KILLED, or REBALANCING.
- Uptime - The time since the Topology was submitted.
- Num workers – Number of workers used in the current topology. This is similar to what you have defined in topology configuration.
- Num executors - Number of executors used in the current topology \[see above 'Executors' for more information\]
- Num tasks - Number of tasks used in the current topology \[see above 'tasks' for more information\]

### Table 3 -Supervisor Summary

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/Reading-and-Understanding-the-Storm-UI-Supervisor-Summary.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

- Id - A unique identifier given to a Supervisor when it joins the cluster.
- Host - The hostname reported by the remote host. (Note that this hostname is not the result of a reverse look-up at the Nimbus node.)
- Up-time - The length of time a Supervisor has been registered to the cluster.
- Slots - Number of workers in the subject host. Normally storm evenly distributes the workers among all the hosts (nodes)
- Used slots - Number of workers that are occupied in the subject host

### Table 4 - Nimbus configuration

- Here you can see the nimbus configuration for the cluster.

## Topology Home - Second page

This is the most important page for me, as I spend most of my time analyzing the numbers for performance tuning and understanding issues. Moreover, the most useful set of parameters comes under the bolts and spout sections of this page.

### Table 1 - Topology Summary \[same as above\]

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/Reading-and-Understanding-the-Storm-UI-Topology-summary-page-2.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

- Name - The name given to the topology by when it was submitted. We will talk about the topology's information below.
- Id - The unique ID given to a Topology each time it is launched.
- Status - The status can be one of ACTIVE, INACTIVE, KILLED, or REBALANCING.
- Uptime - The time since the Topology was submitted.
- Num workers – Number of workers used in the current topology
- Num executors - Number of executors used in the current topology \[see above 'Executors' for more information\]
- Num tasks - Number of tasks used in the current topology \[see above 'tasks' for more information\]

### Table 2 - Topology actions

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/Reading-and-Understanding-the-Storm-UI-Topology-actions.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

- Activate - Returns a topology to active status after it has been deactivated.
- Deactivate - Sets the status of a topology to inactive. Topology up-time is not affected by deactivation.
- Re-balance - Dynamically increase or decrease the number of worker processes and/or executors. The administrator does not need to restart the cluster or the topology.
- Kill - Stops the topology and removes it from Apache Storm. The topology no longer appears in the Storm UI, and the administrator must deploy the application again to activate it.

### Table 3 - Topology stats

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/Reading-and-Understanding-the-Storm-UI-Topology-stats.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

- Window - The past period of time for which the statistics apply. You can click on a value to set the window for this page.
- Emitted - The number of Tuples emitted.
- Transferred - The number of Tuples emitted that sent to one or more bolts.

\[If you have turned off the acking below 3 parameters will be 0 and will not be helpful\]

- Complete latency - The average time a Tuple "tree" takes to be completely processed by the Topology. A value of 0 is expected if no acking is done.
- Acked - The number of Tuple "trees" successfully processed. A value of 0 is expected if no acking is done.
- Failed - The number of Tuple "trees" that were explicitly failed or timed out before acking was completed. A value of 0 is expected if no acking is done.

### Table 4 - Spouts (All time)

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/Reading-and-Understanding-the-Storm-UI-Spouts.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

- Id - The ID assigned to a Component by the Topology. Click on the name to view the Component's page.
- Executors – Number of executors assigned for spout.
- Tasks - Number of tasks assigned for spout. \[Meaning of 'Task' can be found in the top\]
- Emitted - The number of Tuples emitted. \[Meaning of 'Emitted' can be found in the top\]
- Transferred - The number of Tuples Transferred \[Meaning of 'Transferred' can be found in the top\]

\[If you have turned off the acking below 3 parameters will be 0 and will not be helpful\]

- Complete latency - The average time a Tuple "tree" takes to be completely processed by the Topology. A value of 0 is expected if no acking is done.
- Acked - The number of Tuple "trees" successfully processed. A value of 0 is expected if no acking is done.
- Failed - The number of Tuple "trees" that were explicitly failed or timed out before acking was completed. A value of 0 is expected if no acking is done.

### Table 5 - Bolts (All time)

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/Reading-and-Understanding-the-Storm-UI-Bolts.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

- Id - The ID assigned to a the Component by the Topology. Click on the name to view the Component's page.
- Executors - Number of executors assigned for the bolt.
- Tasks - Number of tasks assigned for the bolt. \[Meaning of 'Task' can be found in the top\]
- Emitted - The number of Tuples emitted from this bolt. \[Meaning of 'Emitted' can be found in the top\]
- Transferred - The number of Tuples Transferred from this bolt. \[Meaning of 'Transferred' can be found in the top\]
- Capacity (last 10m) - If this is around 1.0, the corresponding Bolt is running as fast as it can, so you may want to increase the Bolt's parallelism. This is (number executed \* average execute latency) / measurement time.
- Execute latency - The average time a Tuple spends in the execute method. The execute method may complete without sending an Ack for the tuple.
- Executed - The number of incoming Tuples processed.
- Process latency - The average time it takes to Ack a Tuple after it is first received. Bolts that join, aggregate or batch may not Ack a tuple until a number of other Tuples have been received.
- Acked - The number of Tuples acknowledged by this Bolt.
- Failed - The number of tuples Failed by this Bolt.

### Table 6 - Topology configuration

- Shows the topology configuration as a key value map

## Component Home – Spout - Third Page

There are some differences in the component information page for spout and bolt. However, most of the page is identical. Some of these parameters can only be found in the blot information page and ignore them if you are referring to a spout information page.

### Table 1 - Component Summary

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/Reading-and-Understanding-the-Storm-UI-Component-summary.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

-  Id - The ID assigned to a the Component by the Topology.
- Topology - The name given to the topology by when it was submitted. Click the name to view the Topology's information.
- Executors - Executors are threads in a Worker process.
- Tasks - A Task is an instance of a Bolt or Spout. The number of Tasks is almost always equal to the number of Executors.

### Table 2 - Spout stats

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/Reading-and-Understanding-the-Storm-UI-Spout-Stats.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

- Window - The past period of time for which the statistics apply. Click on a value to set the window for this page.
- Emitted - The number of Tuples emitted.
- Transferred - The number of Tuples emitted that sent to one or more bolts.

\[If you have turned off the acking below 3 parameters will be 0 and will not be helpful\]

- Complete latency (ms) - The average time a Tuple "tree" takes to be completely processed by the Topology. A value of 0 is expected if no acking is done.
- Acked - The number of Tuple "trees" successfully processed. A value of 0 is expected if no acking is done.
- Failed - The number of Tuple "trees" that were explicitly failed or timed out before acking was completed. A value of 0 is expected if no acking is done.

### Table 3 - Output stats (All time)

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/Reading-and-Understanding-the-Storm-UI-output-stats-bolt.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

- Stream - The name of the Tuple stream given in the Topolgy, or "default" if none was given.
- Emitted - The number of Tuples emitted.
- Transferred - The number of Tuples emitted that sent to one or more bolts.

### Table 4 - Executors

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/Reading-and-Understanding-the-Storm-UI-Executors.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

- Id - The unique executor ID.
- Uptime - The length of time an Executor (thread) has been alive.
- Host - The hostname reported by the remote host. (Note that this hostname is not the result of a reverse lookup at the Nimbus node.)
- Port - The port number used by the Worker to which an Executor is assigned. Click on the port number to open the logviewer page for this Worker.
- Emitted - The number of Tuples emitted.
- Transferred - The number of Tuples emitted that sent to one or more bolts.

\[If you have turned off the acking below 3 parameters will be 0 and will not be helpful\]

- Complete latency (ms) - The average time a Tuple "tree" takes to be completely processed by the Topology. A value of 0 is expected if no acking is done.
- Acked - The number of Tuple "trees" successfully processed. A value of 0 is expected if no acking is done.
- Failed - The number of Tuple "trees" that were explicitly failed or timed out before acking was completed. A value of 0 is expected if no acking is done.

## Component Home page – Bolt

This is almost same as the above section. Therefor I will talk only about the additional columns.

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/Reading-and-Understanding-the-Storm-UI-input-stats.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

- Component - The ID assigned to a the Component by the Topology.
- Stream - The name of the Tuple stream given in the Topolgy, or "default" if none was given.
- Execute latency (ms) - The average time a Tuple spends in the execute method. The execute method may complete without sending an Ack for the tuple.
- Executed - The number of incoming Tuples processed.
- Process latency (ms) - The average time it takes to Ack a Tuple after it is first received. Bolts that join, aggregate or batch may not Ack a tuple until a number of other Tuples have been received.
- Acked - The number of Tuples acknowledged by this Bolt.
- Failed - The number of tuples Failed by this Bolt.

### Table 2 - Output stats (All time)

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/Reading-and-Understanding-the-Storm-UI-output-stats-spout.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

- Stream - The name of the Tuple stream given in the Topolgy, or "default" if none was given.
- Emitted - The number of Tuples emitted.
- Transferred - The number of Tuples emitted that sent to one or more bolts.

\[If you have turned off the acking below 3 parameters will be 0 and will not be helpful\]

- Complete latency (ms) - The average time a Tuple "tree" takes to be completely processed by the Topology. A value of 0 is expected if no acking is done.
- Acked - The number of Tuple "trees" successfully processed. A value of 0 is expected if no acking is done.
- Failed - The number of Tuple "trees" that were explicitly failed or timed out before acking was completed. A value of 0 is expected if no acking is done.

### Table 3 - Bolt status

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/Reading-and-Understanding-the-Storm-UI-Bolt-stats.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

- Window - The past period of time for which the statistics apply. Click on a value to set the window for this page.
- Emitted - The number of Tuples emitted.
- Transferred - The number of Tuples emitted that sent to one or more bolts.
- Execute latency (ms) - The average time a Tuple spends in the execute method. The execute method may complete without sending an Ack for the tuple.
- Executed - The number of incoming Tuples processed
- Process latency (ms) - The average time it takes to Ack a Tuple after it is first received. Bolts that join, aggregate or batch may not Ack a tuple until a number of other Tuples have been received.
- Acked - The number of Tuples acknowledged by this Bolt.
- Failed - The number of tuples Failed by this Bolt.

### Table 4 - Executors

- Id - The unique executor ID.
- Uptime - The length of time an Executor (thread) has been alive.
- Host - The hostname reported by the remote host. (Note that this hostname is not the result of a reverse lookup at the Nimbus node.)
- Port - The port number used by the Worker to which an Executor is assigned. Click on the port number to open the logviewer page for this Worker.
- Emitted - The number of Tuples emitted.
- Transferred - The number of Tuples emitted that sent to one or more bolts.
- Capacity (last 10m) - If this is around 1.0, the corresponding Bolt is running as fast as it can, so you may want to increase the Bolt's parallelism. This is (number executed \* average execute latency) / measurement time.
- Execute latency (ms) - The average time a Tuple spends in the execute method. The execute method may complete without sending an Ack for the tuple.
- Executed - The number of incoming Tuples processed.
- Process latency (ms) - The average time it takes to Ack a Tuple after it is first received. Bolts that join, aggregate or batch may not Ack a tuple until a number of other Tuples have been received.
- Acked - The number of Tuples acknowledged by this Bolt.
- Failed - The number of tuples Failed by this Bolt.

## Conclusion

Remember this only give a simple description on all the parameters. Most of the description are taken though the storm UI itself. This does not talk about how to analyze the parameters and how to use them to identify the issues. This aspect of the storm UI will be covered in the next article on the storm UI. There I will talk about the common issues that can be identify using the storm UI.
