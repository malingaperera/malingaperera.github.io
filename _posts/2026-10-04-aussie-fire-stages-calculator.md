---
layout: post
title: "Aussie FIRE Stages: When Can You Coast, Lean, Full or Fat FIRE in Australia? (+ Calculator)"
date: 2026-10-04
description: An Australian FIRE calculator for Coast, Lean, Full and Fat FIRE that models super preservation at 60, a bridge fund outside super, employer super contributions, contribution caps and the Age Pension from 67.
tags: finance investing fire superannuation retirement
categories:
  - personal finance
thumbnail: assets/images/2026-10-04-aussie-fire-stages-calculator/2026-10-04-aussie-fire-stages-calculator.png
og_image: assets/images/2026-10-04-aussie-fire-stages-calculator/2026-10-04-aussie-fire-stages-calculator.png
giscus_comments: false
published: true
---

<link rel="stylesheet" href="{{ '/assets/css/fire-calculator.css' | relative_url | bust_file_cache }}">

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/2026-10-04-aussie-fire-stages-calculator/2026-10-04-aussie-fire-stages-calculator.png" class="img-fluid rounded z-depth-1 mx-auto d-block" alt="Aussie FIRE Stages: Coast, Lean, Full and Fat FIRE on a timeline" zoomable=true %}
    </div>
</div>

Most FIRE calculators assume one pot of money that you can draw from whenever you like. In Australia it doesn't work that way. A big chunk of your wealth sits in **super**, which is locked until 60, so the money you live on before then has to come from **outside super**. And from 67 the **Age Pension** can quietly pick up part of the bill.

> **Just want to crunch your own numbers?** [Skip straight to the interactive calculator ↓](#fire-calc)

This post explains the four FIRE stages with an Australian lens, then gives you a calculator that works out when you reach each one: super preservation at 60, a bridge fund to get you there, the 12% Superannuation Guarantee (the super your employer pays on top of your salary), the concessional cap, 2026-27 income tax, and the Age Pension from 67 using the September 2026 rates. Every figure is in today's dollars.

<p style="font-size:0.8rem;color:var(--global-text-color-light);line-height:1.5;"><em>Not financial advice.</em> This is general information only. It ignores your personal circumstances, and tax, super and Age Pension rules change over time. Talk to a licensed adviser before acting.</p>

## The FIRE stages, Australian edition

<div class="fc-tbl">
<table class="fc-pc">
<thead><tr><th>Stage</th><th>What it means</th><th>What you do</th></tr></thead>
<tbody>
<tr><td>Coast FIRE</td><td>You've saved enough that it will grow into your retirement fund on its own.</td><td>Stop saving. Switch to part-time or low-stress work that just pays your living costs, then retire fully later.</td></tr>
<tr><td>Lean FIRE</td><td>You can stop work for good on a bare-bones budget.</td><td>Retire early, living on essentials only.</td></tr>
<tr><td>Full FIRE</td><td>You can stop work for good and keep your normal lifestyle.</td><td>Retire if you choose. Work becomes optional.</td></tr>
<tr><td>Fat FIRE</td><td>You can stop work for good with a generous budget.</td><td>Retire with room for travel, family and surprises.</td></tr>
</tbody>
</table>
</div>

<p class="fc-pc-note">Retiring before 60? Super stays locked until then, so the calculator also checks that your money outside super is enough to fund your lifestyle until super kicks in.</p>

## Why Australia needs its own FIRE maths

- **Super is locked until 60.** Retire at 45 and you need 15 years of spending sitting *outside* super. That bridge fund, not your total net worth, is usually what decides how early you can stop.
- **Super keeps growing while you coast.** Your employer pays 12% of your wage into super on top of your pay (the Superannuation Guarantee), so even a part-time or low-stress job keeps topping up super.
- **Contributions are taxed and capped.** Concessional contributions are taxed at 15% going in and capped at $32,500 a year per person.
- **The Age Pension shrinks what you need.** From 67 a means-tested pension covers part of your spending, so your FIRE number can be well below the classic "spend ÷ 4%" figure.

## Try it yourself: the Aussie FIRE calculator

Plug in your own numbers. It runs a year-by-year simulation in real dollars and, for each stage, finds the earliest age that works if you keep saving at today's rate.

<div class="fire-calc" id="fire-calc">
<h4>Aussie FIRE Stages calculator</h4>
<p class="fc-intro">The starting values are example figures for an average Australian couple in their mid-30s (<a href="#fc-defaults">where they come from</a>). Replace them with your own. Your numbers are saved in this browser for next time.</p>
<p class="fc-intro"><button type="button" id="fcReset" class="fc-reset">Reset to averages</button></p>

<fieldset><legend>Household</legend>
  <div class="fc-row">
    <div class="fc-seg" role="group" aria-label="Household">
      <button id="hhSingle" type="button" aria-pressed="false">Single</button>
      <button id="hhCouple" type="button" aria-pressed="true">Couple</button>
    </div>
    <label class="fc-check"><input type="checkbox" id="home" checked> Homeowner (home is exempt from the pension assets test)</label>
  </div>
</fieldset>

<fieldset><legend>Ages</legend>
  <div class="fc-grid">
    <div class="fc-field"><label for="age">Current age</label><input type="number" id="age" value="35" min="18" max="75"></div>
    <div class="fc-field"><label for="coastAge">Full retirement age</label><input type="number" id="coastAge" value="60" min="40" max="75"><small class="fc-hint">When you stop work completely if you coast</small></div>
    <div class="fc-field"><label for="planAge">Plan to age</label><input type="number" id="planAge" value="92" min="70" max="105"><small class="fc-hint">Money must last until</small></div>
  </div>
</fieldset>

<fieldset><legend>Balances now</legend>
  <div class="fc-grid">
    <div class="fc-field"><label for="O">Outside super ($)</label><input type="number" id="O" value="45000" step="5000"><small class="fc-hint">ETFs, shares, cash, offset</small></div>
    <div class="fc-field"><label for="S">Super ($)</label><input type="number" id="S" value="172000" step="5000"><small class="fc-hint">Combined if couple</small></div>
  </div>
</fieldset>

<fieldset><legend>Enter investing and spending</legend>
  <div class="fc-seg" role="group" aria-label="Amount period">
    <button id="unitM" type="button" aria-pressed="true">Per month</button>
    <button id="unitY" type="button" aria-pressed="false">Per year</button>
  </div>
</fieldset>

<fieldset><legend>Saving while working full-time</legend>
  <div class="fc-grid">
    <div class="fc-field"><label for="salary">Gross salary ($ per year)</label><input type="number" id="salary" value="216700" step="5000"><small class="fc-hint">Household; your employer adds 12% super on top</small></div>
    <div class="fc-field"><label for="salSac">Salary sacrifice ($)</label><input type="number" id="salSac" class="flow" value="0" step="100"><small class="fc-hint">Extra concessional, <span class="per">per month</span></small></div>
    <div class="fc-field"><label for="saveOutside">Invest outside super ($)</label><input type="number" id="saveOutside" class="flow" value="900" step="100"><small class="fc-hint">After tax, <span class="per">per month</span></small></div>
  </div>
</fieldset>

<fieldset><legend>Spending <span class="per">per month</span></legend>
  <div class="fc-grid">
    <div class="fc-field"><label for="spendLean">Lean ($)</label><input type="number" id="spendLean" class="flow" value="4391" step="100"><small class="fc-hint">Bare essentials</small></div>
    <div class="fc-field"><label for="spendFull">Target ($)</label><input type="number" id="spendFull" class="flow" value="6583" step="100"><small class="fc-hint">Your normal lifestyle</small></div>
    <div class="fc-field"><label for="spendFat">Fat ($)</label><input type="number" id="spendFat" class="flow" value="9875" step="100"><small class="fc-hint">Travel, upgrades, buffer</small></div>
  </div>
</fieldset>

<fieldset><legend>Assumptions (real, after fees)</legend>
  <div class="fc-grid">
    <div class="fc-field"><label for="rOut">Return outside super (% p.a.)</label><input type="number" id="rOut" value="4.0" step="0.1"><small class="fc-hint">After tax drag</small></div>
    <div class="fc-field"><label for="rSuper">Return in super (% p.a.)</label><input type="number" id="rSuper" value="4.5" step="0.1"></div>
    <div class="fc-field"><label for="swr">Safe withdrawal rate (%)</label><input type="number" id="swr" value="3.5" step="0.1"><small class="fc-hint">For the classic number only</small></div>
  </div>
  <label class="fc-check" style="margin-top:0.8rem"><input type="checkbox" id="pensionOn" checked> Include Age Pension from 67</label>
</fieldset>

<p class="fc-note">Couples are modelled as the same age. Returns are above inflation, so every figure stays in today's dollars.</p>

<div class="fc-results">
  <section>
    <h5>When you reach each stage</h5>
    <p class="fc-sub" id="standSub"></p>
    <div class="chart" id="timeline" style="margin-bottom:0.8rem"></div>
    <div class="fc-cards" id="cards"></div>
  </section>

  <section>
    <h5>Projected path to Full FIRE</h5>
    <p class="fc-sub" id="chartSub"></p>
    <div class="chart" id="chart"></div>
    <div class="fc-legend"><span><i style="background:var(--fc-out)"></i>Outside super (bridge)</span><span><i style="background:var(--fc-super)"></i>Super</span><span><i style="background:var(--global-text-color-light)"></i>Preservation age 60 · Age Pension 67</span></div>
  </section>

  <section>
    <h5>Australian numbers the stages miss</h5>
    <p class="fc-sub">These decide whether an early retirement in Australia actually works.</p>
    <div class="fc-kpis" id="kpis"></div>
  </section>

  <p class="fc-note"><b>Assumptions &amp; simplifications:</b> A year-by-year simulation in real dollars. Before 60 spending comes only from outside super. From 60 it draws outside money first, then super. From 67 the Age Pension is estimated with the lower of the assets and income tests, using deeming on your balances. "Needed today" is the smallest outside amount that funds the bridge plus the smallest super balance that funds the rest. Coast assumes the part-time or low-stress job pays your target spending after tax and stops at your full retirement age. Rules used: Superannuation Guarantee (employer super) 12%; concessional cap $32,500, non-concessional $130,000, transfer balance cap $2.1M (from 1 July 2026); Age Pension max $1,237.70 single / $1,866.00 couple per fortnight; full-pension asset thresholds $333k/$499k homeowner, $600k/$766k non-homeowner; deeming 1.75% / 3.75%; taper $3 per fortnight per $1,000 (from 20 September 2026); 2026-27 resident income tax with LITO and Medicare levy, approximate. Returns are smooth, so leave a margin for bad sequences. This is an illustration, not a forecast.</p>
</div>
</div>

<script src="{{ '/assets/js/fire-calculator.js' | relative_url | bust_file_cache }}"></script>

<p class="fc-pc-note" id="fc-defaults"><b>Where the default numbers come from:</b> an average Australian couple aged 35 who own their home. Salary is two average full-time wages (ABS, May 2026), super is the average balance at 35–39 (ASFA), savings outside super are a rough median, monthly investing is the 6.5% household saving rate (ABS), and Lean and Target spending are the ASFA modest and comfortable retirement budgets (Fat is 1.5 times comfortable). Averages are pulled up by high earners, so a typical household has less.</p>

## Sources

- [SuperGuide: Age Pension rates](https://www.superguide.com.au/in-retirement/age-pension-rates)
- [Yield Financial Planning: Age Pension changes from 20 September 2026](https://yieldfinancialplanning.com.au/age-pension-changes-from-20-september-2026/)
- [CFS: Super changes from 1 July 2026](https://www.cfs.com.au/insights/super-changes-1-july-2026)
- [Services Australia: Assets test for Age Pension](https://www.servicesaustralia.gov.au/assets-test-for-age-pension?context=22526)
- [ASFA Retirement Standard](https://www.superannuation.asn.au/wp-content/uploads/2026/06/260223-ASFA-Retirement_Standard-Summary.pdf) and [June 2026 budget tables](https://www.superannuation.asn.au/wp-content/uploads/2026/09/June2026-RS-Tables_V3.pdf)
- [ABS: Average weekly earnings growth lowest since 2022 (May 2026)](https://www.abs.gov.au/media-centre/media-releases/average-weekly-earnings-growth-lowest-2022)
- [Savings.com.au: Households now saving 6.5% of their income (June quarter 2026)](https://www.savings.com.au/news/households-now-saving-6-5-of-their-income-as-wages-rise)
- [The Motley Fool: Average super balance for 35-year-olds in FY26 (ASFA figures)](https://www.fool.com.au/2026/09/11/the-average-superannuation-balance-for-35-year-olds-in-australia-in-fy26-how-does-yours-compare/)
- [SavingsMate: Average savings by age, Australia 2026](https://savingsmate.com.au/blog/average-savings-by-age-australia-2026)

## Bottom line

- In Australia, early retirement needs **two buckets**: a bridge outside super to get you to 60, and super for the rest.
- Watch the **bridge fund** as closely as your total. A large super balance can't retire you at 45 on its own.
- The **Age Pension** from 67 can take a real chunk off your FIRE number, especially on leaner plans.
- Run your own numbers in the calculator above, and remember the model is an illustration, not a promise. Markets don't return a smooth 4% every year.

General information only, not financial advice.
