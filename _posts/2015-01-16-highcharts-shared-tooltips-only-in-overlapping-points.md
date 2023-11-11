---
layout: post
title:  Highcharts - Shared tooltips only in overlapping points
date: 2015-01-16
description: Highcharts - Shared tooltips only in overlapping points
tags: highcharts js tooltip
categories: front-end
thumbnail: assets/images/Shared-tooltips-only-in-overlapping-points.png
giscus_comments: false
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/Shared-tooltips-only-in-overlapping-points.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

Hope you understand the basics of the Highcharts tooltips. Highcharts has a shared tooltip option but it will be shared on all points. What if you want to have a shared tooltip only when points are overlapping? There is no such an option in Highcharts to get a shared tooltip only when the points are overlapping.

Below I have shown a work-around to get a shared tooltip only when the points overlap (graphs intersect).

[http://jsfiddle.net/Malinga/2jbdqe6x/7/](http://jsfiddle.net/Malinga/2jbdqe6x/7/)

If you need to get the shared tooltip not only they overlap but also when there are too close you can just change the comparison within the if close as shown in the below example

[http://jsfiddle.net/Malinga/xkks3tno/](http://jsfiddle.net/Malinga/xkks3tno/)
