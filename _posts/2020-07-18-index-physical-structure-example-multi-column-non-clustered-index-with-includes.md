---
layout: post
title:  Index Physical Structure Example - Multi-column Non-Clustered Index with Includes
date: 2020-07-18 21:01:00
description: Index Physical Structure Example; Multi-column Non-Clustered Index with Includes
tags: index multi-column non-clustered database physical-design-structure
categories: database
thumbnail: assets/img/physical_design_example_non_clustered_index_with_includes_1.png
giscus_comments: true
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/img/physical_design_example_non_clustered_index_with_includes_1.png" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

This article demonstrates the physical design of a multi-column non-clustered index with include-columns. Many examples on the internet only demonstrate the most simple version of an index with a single column. This article gives a proper view of an index with multiple columns through a simple example. Furthermore, you can see how the include-columns are stored, only at the leaf level of the tree.

Here we use a simple table 'People' with 6 columns (ID, First Name, Last Name, Age, Sex, Address). We assume we already have a clustered index created on the ID column (it will be almost no difference if there is no clustered index as well, explained at the end). Now we are going to create the non-clustered index as defined below.

<code>
CREATE NONCLUSTERED INDEX IX_NAME ON People <br />
(FirstName, LastName)<br />
INCLUDE (Age, Sex)<br />
GO<br />
</code>

Below diagram shows the structure of this non-clustered index.

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/img/physical_design_example_non_clustered_index_with_includes.png" class="img-fluid rounded z-depth-1" zoomable=true %}
    </div>
</div>
<div class="caption">
    Index Physical Structure Example; Multi-column Non-Clustered Index with Includes.
</div>

In the example above we are searching for the name <b>"Malinga Perera"</b>. In the root level (level 2; note that, the level number starts from leaves) <b>'Malinga'</b> should come after <b>'Kain'</b> and before <b>'Ophelia'</b>. So we go to page 583. In level 1 we see that (Malinga) 'Perera' should come between (Malinga) <b>'Amad'</b> and (Malinga) <b>'Sonu'</b>. So we move to page 1024, which is a leaf node. In this leaf node, we find <b>'Malinga Perera'</b>. I had to add a lot of 'Malinga's to get the last name into the example :D.

In the leaf level, we see the additional columns we added as include-columns. Include-columns have a lesser overhead compared to the index-columns. However, if we need anything else, like address, we have to go to the actual table (clustered index). We got clustered index key 17 from this leaf node. This should lead us to the full data row directly (through the clustered index, to be specific). If we had this non-clustered index on a heap (i.e. no clustered index) then the pointer will give us the RID (row ID). RID directly give the physical address of the data (file:page:row).

