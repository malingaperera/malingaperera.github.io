---
layout: post
title:  "UVA 893 - Y3K Problem: Handling Python years above 9999"
date: 2020-11-11
description: "UVA 893 - Y3K Problem: Handling Python years above 9999"
tags: python uva
categories: competitive-programming
thumbnail: assets/images/UVA-893-Y3K-Problem-Handling-Python-years-above-9999.png
giscus_comments: false
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/UVA-893-Y3K-Problem-Handling-Python-years-above-9999.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

I was working on a problem in UVA online judge where I needed to do a simple data addition. However, the catch was year can go beyond 9999 (which is the limit in python). Below code is the python solution for this problem. I simply divided the date-delta with (1200 years, i.e. 438291 days) and added it separately after the computation. If you have unclear areas, let me know in the comments.

```
import datetime
from sys import stdin

div = 438291
for line in stdin:
    delta, d, m, y = map(int, line.split()[:4])
    if d != 0:
        a = int(delta / div)
        delta3 = delta % div
        d_2000 = datetime.date(day=1, month=1, year=2000)
        d_start = datetime.date(day=d, month=m, year=y)
        delta2 = (d_2000 - d_start).days
        delta3 -= delta2
        d_end = d_2000 + datetime.timedelta(days=delta3)
        print(d_end.day, d_end.month, d_end.year + a * 1200)
    else:
        exit(0)
```

\[1\] Date and Time by Mask Icon from the Noun Project
