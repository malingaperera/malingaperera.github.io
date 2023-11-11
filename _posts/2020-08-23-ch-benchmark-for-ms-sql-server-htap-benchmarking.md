---
title: "CH-BenCHmark for MS SQL Server - HTAP benchmarking"
date: "2020-08-23"
categories: 
  - "computer-science"
  - "technology"
tags: 
  - "benchmark"
  - "ch-benchmark"
  - "database"
  - "htap"
  - "sql-server"
coverImage: "HTAP-benchmarking.png"

layout: post
title:  CH-BenCHmark for MS SQL Server - HTAP benchmarking
date: 2020-08-23
description: CH-BenCHmark for MS SQL Server - HTAP benchmarking
tags: benchmark sql-server
categories: database
thumbnail: assets/images/HTAP-benchmarking.png
giscus_comments: false
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/HTAP-benchmarking.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

There aren't many benchmarks which allow you to test your systems against a hybrid OLTP and OLAP workloads. [CH-BenCHmark](https://db.in.tum.de/research/projects/CHbenCHmark/index.shtml?lang=en) fills that gap by combining TPC-C and TPC-H. You can download the source from the linked site or you can use something like [OLTPBench](https://github.com/oltpbenchmark/oltpbench) (a collection of benchmarks). However, the TPC-H modified queries are not written for SQL server. In this article, I will add the modified CH-BenCHmark OLAP queries for SQL Server.

#### Query 1

```
SELECT OL_NUMBER,
       SUM(OL_QUANTITY) AS SUM_QTY,
       SUM(OL_AMOUNT) AS SUM_AMOUNT,
       AVG(OL_QUANTITY) AS AVG_QTY,
       AVG(OL_AMOUNT) AS AVG_AMOUNT,
       COUNT(*) AS COUNT_ORDER
FROM ORDER_LINE
WHERE OL_DELIVERY_D > '2007-01-02 00:00:00.000'
GROUP BY OL_NUMBER
ORDER BY OL_NUMBER;
```

#### Query 2

```
SELECT SU_SUPPKEY,
       SU_NAME,
       N_NAME,
       I_ID,
       I_NAME,
       SU_ADDRESS,
       SU_PHONE,
       SU_COMMENT
FROM ITEM, SUPPLIER, STOCK, NATION, REGION,
  (SELECT S_I_ID AS M_I_ID, MIN (S_QUANTITY) AS M_S_QUANTITY
   FROM STOCK,
        SUPPLIER,
        NATION,
        REGION
   WHERE (S_W_ID*S_I_ID) % 10000=SU_SUPPKEY
     AND SU_NATIONKEY=N_NATIONKEY
     AND N_REGIONKEY=R_REGIONKEY
     AND R_NAME LIKE 'EUROP%'
   GROUP BY S_I_ID) M
WHERE I_ID = S_I_ID
  AND (S_W_ID * S_I_ID) % 10000 = SU_SUPPKEY
  AND SU_NATIONKEY = N_NATIONKEY
  AND N_REGIONKEY = R_REGIONKEY
  AND I_DATA LIKE '%B'
  AND R_NAME LIKE 'EUROP%'
  AND I_ID=M_I_ID
  AND S_QUANTITY = M_S_QUANTITY
ORDER BY N_NAME,
         SU_NAME,
         I_ID;
```

#### Query 3

```
SELECT OL_O_ID,
       OL_W_ID,
       OL_D_ID,
       SUM(OL_AMOUNT) AS REVENUE,
       O_ENTRY_D
FROM CUSTOMER,
     NEW_ORDER,
     OORDER,
     ORDER_LINE
WHERE C_STATE LIKE 'A%'
  AND C_ID = O_C_ID
  AND C_W_ID = O_W_ID
  AND C_D_ID = O_D_ID
  AND NO_W_ID = O_W_ID
  AND NO_D_ID = O_D_ID
  AND NO_O_ID = O_ID
  AND OL_W_ID = O_W_ID
  AND OL_D_ID = O_D_ID
  AND OL_O_ID = O_ID
  AND O_ENTRY_D > '2007-01-02 00:00:00.000'
GROUP BY OL_O_ID,
         OL_W_ID,
         OL_D_ID,
         O_ENTRY_D
ORDER BY REVENUE DESC , O_ENTRY_D
```

#### Query 4

```
SELECT O_OL_CNT,
       COUNT(*) AS ORDER_COUNT
FROM OORDER
WHERE EXISTS
    (SELECT *
     FROM ORDER_LINE
     WHERE O_ID = OL_O_ID
       AND O_W_ID = OL_W_ID
       AND O_D_ID = OL_D_ID
       AND OL_DELIVERY_D >= O_ENTRY_D)
GROUP BY O_OL_CNT
ORDER BY O_OL_CNT
```

#### Query 5

```
SELECT N_NAME,
       SUM(OL_AMOUNT) AS REVENUE
FROM CUSTOMER,
     OORDER,
     ORDER_LINE,
     STOCK,
     SUPPLIER,
     NATION,
     REGION
WHERE C_ID = O_C_ID
  AND C_W_ID = O_W_ID
  AND C_D_ID = O_D_ID
  AND OL_O_ID = O_ID
  AND OL_W_ID = O_W_ID
  AND OL_D_ID=O_D_ID
  AND OL_W_ID = S_W_ID
  AND OL_I_ID = S_I_ID
  AND (S_W_ID * S_I_ID) % 10000 = SU_SUPPKEY
  AND ASCII(SUBSTRING(C_STATE, 1, 1)) = SU_NATIONKEY
  AND SU_NATIONKEY = N_NATIONKEY
  AND N_REGIONKEY = R_REGIONKEY
  AND R_NAME = 'EUROPE'
  AND O_ENTRY_D >= '2007-01-02 00:00:00.000'
GROUP BY N_NAME
ORDER BY REVENUE DESC;
```

#### Query 6

```
SELECT SUM(OL_AMOUNT) AS REVENUE
FROM ORDER_LINE
WHERE OL_DELIVERY_D >= '1999-01-01 00:00:00.000'
  AND OL_DELIVERY_D < '2020-08-19 00:00:00.000'
  AND OL_QUANTITY BETWEEN 1 AND 100000
```

#### Query 7

```
SELECT SU_NATIONKEY AS SUPP_NATION,
       SUBSTRING(C_STATE, 1, 1) AS CUST_NATION,
       YEAR(O_ENTRY_D) AS L_YEAR,
       SUM(OL_AMOUNT) AS REVENUE
FROM SUPPLIER,
     STOCK,
     ORDER_LINE,
     OORDER,
     CUSTOMER,
     NATION N1,
     NATION N2
WHERE OL_SUPPLY_W_ID = S_W_ID
  AND OL_I_ID = S_I_ID
  AND (S_W_ID * S_I_ID) % 10000 = SU_SUPPKEY
  AND OL_W_ID = O_W_ID
  AND OL_D_ID = O_D_ID
  AND OL_O_ID = O_ID
  AND C_ID = O_C_ID
  AND C_W_ID = O_W_ID
  AND C_D_ID = O_D_ID
  AND SU_NATIONKEY = N1.N_NATIONKEY
  AND ASCII(SUBSTRING(C_STATE, 1, 1)) = N2.N_NATIONKEY
  AND ((N1.N_NAME = 'GERMANY'
        AND N2.N_NAME = 'CAMBODIA')
       OR (N1.N_NAME = 'CAMBODIA'
           AND N2.N_NAME = 'GERMANY'))
GROUP BY SU_NATIONKEY,
         SUBSTRING(C_STATE, 1, 1),
         YEAR(O_ENTRY_D)
ORDER BY SU_NATIONKEY,
         CUST_NATION,
         L_YEAR
```

#### Query 8

```
SELECT YEAR(O_ENTRY_D) AS L_YEAR,
       SUM(CASE WHEN N2.N_NAME = 'GERMANY' THEN OL_AMOUNT ELSE 0 END) / SUM(OL_AMOUNT) AS MKT_SHARE
FROM ITEM,
     SUPPLIER,
     STOCK,
     ORDER_LINE,
     OORDER,
     CUSTOMER,
     NATION N1,
     NATION N2,
     REGION
WHERE I_ID = S_I_ID
  AND OL_I_ID = S_I_ID
  AND OL_SUPPLY_W_ID = S_W_ID
  AND (S_W_ID * S_I_ID) % 10000 = SU_SUPPKEY
  AND OL_W_ID = O_W_ID
  AND OL_D_ID = O_D_ID
  AND OL_O_ID = O_ID
  AND C_ID = O_C_ID
  AND C_W_ID = O_W_ID
  AND C_D_ID = O_D_ID
  AND N1.N_NATIONKEY = ASCII(SUBSTRING(C_STATE, 1, 1))
  AND N1.N_REGIONKEY = R_REGIONKEY
  AND OL_I_ID < 1000
  AND R_NAME = 'EUROPE'
  AND SU_NATIONKEY = N2.N_NATIONKEY
  AND I_DATA LIKE '%B'
  AND I_ID = OL_I_ID
GROUP BY YEAR(O_ENTRY_D)
ORDER BY L_YEAR;
```

#### Query 9

```
SELECT N_NAME,
       YEAR(O_ENTRY_D) AS L_YEAR,
       SUM(OL_AMOUNT) AS SUM_PROFIT
FROM ITEM,
     STOCK,
     SUPPLIER,
     ORDER_LINE,
     OORDER,
     NATION
WHERE OL_I_ID = S_I_ID
  AND OL_SUPPLY_W_ID = S_W_ID
  AND (S_W_ID * S_I_ID) % 10000 = SU_SUPPKEY
  AND OL_W_ID = O_W_ID
  AND OL_D_ID = O_D_ID
  AND OL_O_ID = O_ID
  AND OL_I_ID = I_ID
  AND SU_NATIONKEY = N_NATIONKEY
  AND I_DATA LIKE '%BB'
GROUP BY N_NAME,
         YEAR(O_ENTRY_D)
ORDER BY N_NAME,
         L_YEAR DESC;
```

#### Query 10

```
SELECT C_ID,
       C_LAST,
       SUM(OL_AMOUNT) AS REVENUE,
       C_CITY,
       C_PHONE,
       N_NAME
FROM CUSTOMER,
     OORDER,
     ORDER_LINE,
     NATION
WHERE C_ID = O_C_ID
  AND C_W_ID = O_W_ID
  AND C_D_ID = O_D_ID
  AND OL_W_ID = O_W_ID
  AND OL_D_ID = O_D_ID
  AND OL_O_ID = O_ID
  AND O_ENTRY_D >= '2007-01-02 00:00:00.000'
  AND O_ENTRY_D <= OL_DELIVERY_D
  AND N_NATIONKEY = ASCII(SUBSTRING(C_STATE, 1, 1))
GROUP BY C_ID,
         C_LAST,
         C_CITY,
         C_PHONE,
         N_NAME
ORDER BY REVENUE DESC;
```

#### Query 11

```
SELECT s_i_id,
       sum(s_order_cnt) AS ordercount
FROM stock,
     supplier,
     nation
WHERE (s_w_id * s_i_id) % 10000 = su_suppkey
  AND su_nationkey = n_nationkey
  AND n_name = 'Germany'
GROUP BY s_i_id HAVING sum(s_order_cnt) >
  (SELECT sum(s_order_cnt) * .005
   FROM stock,
        supplier,
        nation
   WHERE (s_w_id * s_i_id) % 10000 = su_suppkey
     AND su_nationkey = n_nationkey
     AND n_name = 'Germany')
ORDER BY ordercount DESC;
```

#### Query 12

```
SELECT o_ol_cnt,
       sum(CASE WHEN o_carrier_id = 1
           OR o_carrier_id = 2 THEN 1 ELSE 0 END) AS high_line_count,
       sum(CASE WHEN o_carrier_id <> 1
           AND o_carrier_id <> 2 THEN 1 ELSE 0 END) AS low_line_count
FROM oorder,
     order_line
WHERE ol_w_id = o_w_id
  AND ol_d_id = o_d_id
  AND ol_o_id = o_id
  AND o_entry_d <= ol_delivery_d
  AND ol_delivery_d < '2020-09-01 00:00:00.000'
GROUP BY o_ol_cnt
ORDER BY o_ol_cnt;
```

#### Query 13

```
SELECT c_count,
       count(*) AS custdist
FROM
  (SELECT c_id,
          count(o_id) AS c_count
   FROM customer
   LEFT OUTER JOIN oorder ON (c_w_id = o_w_id
                              AND c_d_id = o_d_id
                              AND c_id = o_c_id
                              AND o_carrier_id > 8)
   GROUP BY c_id) AS c_orders
GROUP BY c_count
ORDER BY custdist DESC, c_count DESC;
```

#### Query 14

```
SELECT (100.00 * sum(CASE WHEN i_data LIKE 'PR%' THEN ol_amount ELSE 0 END) / (1 + sum(ol_amount))) AS promo_revenue
FROM order_line,
     item
WHERE ol_i_id = i_id
  AND ol_delivery_d >= '2007-01-02 00:00:00.000'
  AND ol_delivery_d < '2020-09-02 00:00:00.000';
```

#### Query 15

```
SELECT su_suppkey,
       su_name,
       su_address,
       su_phone,
       total_revenue
FROM supplier, revenue0
WHERE su_suppkey = supplier_no
    AND total_revenue = (select max(total_revenue) from revenue0)
ORDER BY su_suppkey;
```

#### Query 16

```
SELECT i_name,
       substring(i_data, 1, 3) AS brand,
       i_price,
       count(DISTINCT ((s_w_id * s_i_id) % 10000)) AS supplier_cnt
FROM stock,
     item
WHERE i_id = s_i_id
  AND i_data NOT LIKE 'zz%'
  AND ((s_w_id * s_i_id) % 10000 NOT IN
    (SELECT su_suppkey
     FROM supplier
     WHERE su_comment LIKE '%bad%'))
GROUP BY i_name,
         substring(i_data, 1, 3),
         i_price
ORDER BY supplier_cnt DESC;
```

#### Query 17

```
SELECT SUM (ol_amount) / 2.0 AS avg_yearly
FROM order_line,
  (SELECT i_id, AVG (ol_quantity) AS a
   FROM item,
        order_line
   WHERE i_data LIKE '%b'
     AND ol_i_id = i_id
   GROUP BY i_id) t
WHERE ol_i_id = t.i_id
  AND ol_quantity < t.a;
```

#### Query 18

```
SELECT c_last,
       c_id,
       o_id,
       o_entry_d,
       o_ol_cnt,
       sum(ol_amount) AS amount_sum
FROM customer,
     oorder,
     order_line
WHERE c_id = o_c_id
  AND c_w_id = o_w_id
  AND c_d_id = o_d_id
  AND ol_w_id = o_w_id
  AND ol_d_id = o_d_id
  AND ol_o_id = o_id
GROUP BY o_id,
         o_w_id,
         o_d_id,
         c_id,
         c_last,
         o_entry_d,
         o_ol_cnt HAVING sum(ol_amount) > 200
ORDER BY amount_sum DESC, o_entry_d;
```

#### Query 19

```
SELECT sum(ol_amount) AS revenue
FROM order_line,
     item
WHERE (ol_i_id = i_id
       AND i_data LIKE '%a'
       AND ol_quantity >= 1
       AND ol_quantity <= 10
       AND i_price BETWEEN 1 AND 400000
       AND ol_w_id IN (1,
                       2,
                       3))
  OR (ol_i_id = i_id
      AND i_data LIKE '%b'
      AND ol_quantity >= 1
      AND ol_quantity <= 10
      AND i_price BETWEEN 1 AND 400000
      AND ol_w_id IN (1,
                      2,
                      4))
  OR (ol_i_id = i_id
      AND i_data LIKE '%c'
      AND ol_quantity >= 1
      AND ol_quantity <= 10
      AND i_price BETWEEN 1 AND 400000
      AND ol_w_id IN (1,
                      5,
                      3));
```

#### Query 20

```
SELECT su_name,
       su_address
FROM supplier,
     nation
WHERE su_suppkey IN
    (SELECT s_i_id * s_w_id % 10000
     FROM stock
     INNER JOIN item ON i_id = s_i_id
     INNER JOIN order_line ON ol_i_id = s_i_id
     WHERE ol_delivery_d > '2010-05-23 12:00:00'
       AND i_data LIKE 'co%'
     GROUP BY s_i_id,
              s_w_id,
              s_quantity HAVING 2*s_quantity > sum(ol_quantity))
  AND su_nationkey = n_nationkey
  AND n_name = 'Germany'
ORDER BY su_name;
```

#### Query 21

```
SELECT su_name,
       count(*) AS numwait
FROM supplier,
     order_line l1,
     oorder,
     stock,
     nation
WHERE ol_o_id = o_id
  AND ol_w_id = o_w_id
  AND ol_d_id = o_d_id
  AND ol_w_id = s_w_id
  AND ol_i_id = s_i_id
  AND (s_w_id * s_i_id) % 10000 = su_suppkey
  AND l1.ol_delivery_d > o_entry_d
  AND NOT EXISTS
    (SELECT *
     FROM order_line l2
     WHERE l2.ol_o_id = l1.ol_o_id
       AND l2.ol_w_id = l1.ol_w_id
       AND l2.ol_d_id = l1.ol_d_id
       AND l2.ol_delivery_d > l1.ol_delivery_d)
  AND su_nationkey = n_nationkey
  AND n_name = 'Germany'
GROUP BY su_name
ORDER BY numwait DESC, su_name;
```

#### Query 22

```
SELECT substring(c_state, 1, 1) AS country,
count(*) AS numcust,
sum(c_balance) AS totacctbal
FROM customer
WHERE substring(c_phone, 1, 1) IN ('1',
                              '2',
                              '3',
                              '4',
                              '5',
                              '6',
                              '7')
  AND c_balance >
    (SELECT avg(c_balance)
     FROM customer
     WHERE c_balance > 0.00
       AND substring(c_phone, 1, 1) IN ('1',
                                   '2',
                                   '3',
                                   '4',
                                   '5',
                                   '6',
                                   '7'))
  AND NOT EXISTS
    (SELECT *
     FROM oorder
     WHERE o_c_id = c_id
       AND o_w_id = c_w_id
       AND o_d_id = c_d_id)
GROUP BY substring(c_state, 1, 1)
ORDER BY substring(c_state,1,1);
```
