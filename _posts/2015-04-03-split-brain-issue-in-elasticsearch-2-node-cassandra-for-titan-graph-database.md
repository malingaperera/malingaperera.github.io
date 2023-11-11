---
layout: post
title:  Split brain issue in elasticsearch- 2 node Cassandra For Titan graph database
date: 2015-04-03
description: Split brain issue in elasticsearch- 2 node Cassandra For Titan graph database
tags: cassandra elasticsearch
categories: database
thumbnail: assets/images/Split-brain-issue-in-elastic-search.jpg
giscus_comments: false
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/Split-brain-issue-in-elastic-search.jpg" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>


I recently configured a 2-node Cassandra cluster with elastic search installed in both nodes creating another 2-node cluster (Cassandra cluster was built using DataStax OpsCenter). Soon after I configured my cluster, I got to know that there are x + 1 issues when we try to get it done with only 2 nodes.

## Split brain problem in elastic search

When there are, 2 or more nodes acting like master nodes we call it a split brain. This can happen when one node does not know that it is connected to a cluster with a master. When there is more than 1 master, indexing requests will be completed by both nodes and after some time two copies of the shard are diverged. We might have to do full re-indexing to overcome this issue. If you need more information about the split-brain problem [here](http://blog.trifork.com/2013/10/24/how-to-avoid-the-split-brain-problem-in-elasticsearch/).

## How to avoid the issue

According to elastic search, we need to set the _“discovery.zen.minimum\_master\_nodes”_ value to N/2 + 1. So node need to be connected to at least half of the nodes in the cluster to be a master. This will make sure that there is only one master. Therefore, for a 2-node cluster _“discovery.zen.minimum\_master\_nodes”_ value will be 2. This makes clustering useless. When one node fails, other cannot become the master, as it is not connected to the minimum number of nodes that is configured in the configuration file. So having 2 nodes is only good as having a single node when you look in the availability viewpoint. You might need to increase _"discovery.zen.ping.timeout"_ in a slower network.

## Minimum number of 3 nodes, what if you only have only 2 nodes

It seems like you need at least 3 nodes to create an elasticsearch cluster. However, what if you only have only 2 nodes, you can choose the availability or consistency. I will go with the consistency over availability because issues raised due to inconsistence data are so hard to debug. However, if you are mainly focusing on querying the graph and indexing request are rare you can choose availability as there is very low chance of leading towards an inconsistence dataset.

## Using something below Titan-0.4.4? You are still in trouble even with 3 nodes

With the issue reported [here](https://github.com/elasticsearch/elasticsearch/issues/2488%20). there is a possibility of having split-brain issue even with 3 nodes. This issue is fixed in the newer version of the titan. However, do not worry much as this is a rare scenario as if the node loose the connection with the master, there is a higher chance that it losing the connection with the other node too.
