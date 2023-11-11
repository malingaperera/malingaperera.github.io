---
layout: post
title:  "Building a Cassandra cluster with dataStax OpsCenter [CentOs]"
date: 2015-04-03
description: "Building a Cassandra cluster with dataStax OpsCenter [CentOs]"
tags: cassandra datastax
categories: database
thumbnail: assets/images/Building-a-cassendra-cluster-with-dataStax-OpsCenter.png
giscus_comments: false
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/Building-a-cassendra-cluster-with-dataStax-OpsCenter.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

If you have tried creating a cluster though OpsCenter and failed, do not worry, seems like no one gets it in the first try. When we went through the installation process, we observed that there are issues when installing the dataStax agents though OpsCenter. In addition, we faced lot of issues while installing them. After doing it for several times I came to an agreement with myself of the easiest and working way to install agents and OpsCenter. If you are facing similar issues this article might give you some other options to tryout.

##  Issues we faced

-  OpsCenter cannot create dataStax agents in the cluster nodes \[Cluster provisioning failed: Exception: Installation stage failed\]
- OpsCenter cannot connect to the agent installed in other nodes \[There was a problem verifying an ssh login\]
- OpsCenter cannot connect to the own node with loopback address
- OpsCenter cannot reconnect to nodes once restated the cluster
- OpsCenter cannot connect to nodes with public IPs
- DataStax agent not running on the node
- Keep getting message about an old node, which is removed, is running \[OpsCenter agent is still running on an old node that was decommissioned or is part of a cluster that OpsCenter is no longer monitoring\].

## Solutions

First, remember that this is not a exhaustive list of the issues we faced. In addition, before begin anything try sshing to the nodes that you try to connect from the OpsCenter machine. Make sure all needed ports are open and confirm it by telnet to that port. Moreover, I highly recommend you opening all ports within the VPC.

To start with, I am not going to explain why we used one method over another, because some of these issues did not appear with the Ubuntu installation. As an example, we had an issue with restarting the cluster when dataStax agents are installed with tarball. However, this was solved when agent installed as a service. In some configurations, this issue did not appear at all.

## Steps

1. Open all ports locally
2. Install OpsCenter with tarball installation
3. Install dataStax agents as service on each node \[In Ubuntu machine there was an issue with service file in init.d not being created\]
4. Now create the cluster giving the remote nodes private IP in OpsCenter
5. Now add the other nodes using private IP addresses.
6. \[Note: It is ok to give all private IPs while creating the cluster, but I did not try that\]
7. Your Cluster should be ready by now

## Conclusion

I want to emphasize some points while concluding

- Always use private IPs \[not public, not loopback\]
- Use tarball for OpsCenter and package installation for agents \[as service\]
- I opened all ports locally

If you come across any more issues, please do comment below. I will try to help as much as I can.
