---
layout: post
title:  Jaro–Winkler Similarity – How to correctly count the number of transpositions
date: 2020-01-15 21:01:00
description: Jaro–Winkler Similarity – How to correctly count the number of transpositions
tags: algorithms
categories: algorithms
thumbnail: assets\img\jaro_winkler_distance\jaro_winkler_distance.png
giscus_comments: false
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets\img\jaro_winkler_distance\jaro_winkler_distance.png" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

Jaro–Winkler Similarity is a widely used similarity measure for checking the similarity between two strings. Being a similarity measure (not a distance measure), a higher value means more similar strings. You can read on basics and how it works on Wikipedia. It’s available in many places and I’m not going into that. However, none of these sites talks about how to correctly count the number of transpositions in complex situations.

Transposition is defined as “matches which are not in the same position”. For a simple example like **‘cart’** vs **‘cratec’** it is obvious with 4 matches and 2 transpositions (‘r’ and ‘a’ are in not in the same position). But for **'xabcdxxxxxx'** vs **'yaybycydyyyyyy'** in the first look, all letters seem to be out of position but there are **no transpositions** (4 matches). For very similar **'xabcdxxxxxx'** vs **'ydyaybycyyyyyy'**, there are **4 transpositions** (4 matches). With these examples, it might not be trivial to count the number of transpositions.

The main reason behind this complexity is we are looking at the whole word whereas we should be looking only at the matched part.

Ex: **'xabcdxxxxxx', 'yaybycydyyyyyy'** (get the matching letters and write it down)

    'xabcdxxxxxx': abcd'
    yaybycydyyyyyy': abcd

Now it’s clear that there are no transpositions

    'xabcdxxxxxx': abcd
    ' ydyaybycyyyyyy': dabc

After extracting the matching letters, you can see each letter can be given an index. In the first word a-0, b-1, c-2, d-4. In the second word d-0, a-1, b-2, c-3. What you must check is how many of the matches are not having the same index. In this case, none of the matching letters has the same index. So, there are 4 transpositions. Once you understand this, it’s very trivial.

You can find code for Jaro-Winkler here: https://rosettacode.org/wiki/Jaro_distance. You can use it to check if your calculations are correct.