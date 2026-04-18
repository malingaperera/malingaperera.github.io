---
layout: page
permalink: /publications/
title: Publications
description: Research publications by Romesh Malinga Perera on database systems, self-tuning databases, and applied machine learning.
nav: true
nav_order: 1
---
<!-- _pages/publications.md -->
<div class="publications-list">

{% assign publications_by_year = site.data.publications | group_by: "year" | sort: "name" | reverse %}
{% for year_group in publications_by_year %}
  <h2 class="publication-year">{{ year_group.name }}</h2>
  {% for publication in year_group.items %}
    {% include publication.html publication=publication %}
  {% endfor %}
{% endfor %}

</div>
