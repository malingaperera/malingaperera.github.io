---
layout: post
title:  Redis Sorted Object Set (Sorted Hashes)
date: 2016-04-04 21:01:00
description: Redis Sorted Object Set (Sorted Hashes)
tags: redis cache key-value
categories: database
thumbnail: assets/img/redis-sorted-object-set-sorted-hashes/redis-sorted-object-set-sorted-hashes1.png
giscus_comments: false
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/img/redis-sorted-object-set-sorted-hashes/redis-sorted-object-set-sorted-hashes1.png" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

We all know that the best way to store objects in Redis is through, Redis hashes. Redis sorted sets are used to keep a sorted set with a given score for each value. What if we need a sorted set of objects? What we need is a **"Sorted set of Objects"**, which Redis does not support by default. We came up with a hybrid, simple data structure that allows sorted objects using **Redis Hashes** and **Redis Sorted sets**.

<br />

### Use of Redis Hashes

Here we will keep an object as a Redis hash. Think of a simple object with several values as shown below.

```
TICKET1 {     
    MERCHANT_ID: 0123456789,     
    TIME_STAMP: 00000000000,     
    SALE: 12.32 
}
```

This will be saved in the Redis

```
HMSET TICKET1 MERCHANT_ID "0123456789" TIME_STAMP "00000000000" SALE "12.32"
```

When we need to edit an existing value and add a new value it can be done below

```
// Adding a new value
HSET TICKET1 DISCOUNT "0.60"
 
// Set Multiple Values
HMSET TICKET1 DISCOUNT "0.50" SALE "12.60"
 
// Set single Value
HSET TICKET1 SALE "12.50"
 
// RESULT
TICKET1 {
    MERCHANT_ID: 0123456789,
    TIME_STAMP: 00000000000,
    SALE: 12.50,
    DISCOUNT: 0.50
}
```

Getting full map and some selected value

```
// Get the full object
HGETALL TICKET1

1) "MERCHANT_ID" 
2) "0123456789" 
3) "TIME_STAMP" 
4) "00000000000" 
...   

// Get set of selected subset of values 
HMGET TICKET1 MERCHANT_ID SALE   
1) "0123456789" 
2) "12.50"   

// get a single value 
HGET DISCOUNT   
1) "0.50"
```

Whole map or items can be deleted

```
// Delete one field
HDEL TICKET1 SALE
 
// Delete whole object
DEL TICKET1
```

There is some more commands in the Redis hash that can help us in this process

|Command|Action|
|-------|------|
|HEXISTS| 	Check for item|
|HINCRBY| 	Add to integer value|
|HINCRBYFLOAT| 	Add to float value|
|HKEYS| 	Return all keys|
|HLEN| 	Get number of items|
|HSCAN| 	Iterate items|
|HSETNX| 	Set item if doesn’t exist|
|HVALS| 	Return all values|

<br />

### Use of Redis Sorted Sets

As we said above we need to search with time values and in-order searches. This cannot be done alone by Redis hashes. Here we keep a list of all keys in the Redis hashes as a sorted set. This allow us to get all the maps that came after some time stamp. or between two time stamps. Other than that this allows us to search under topics (EX: get all TICKETS after 00000001 time stamp)

```
ZADD TICKETS 1459746182 "TICKET1"
ZADD TICKETLINES 1459746192 "TICKETLINE1"
ZADD TICKETLINES 1459746222 "TICKETLINE2"
ZADD TICKETS 1459746282 "TICKET2"
ZADD TICKETS 1459746382 "TICKET3"
```

Get items under one topic within a given time range

```
ZRANGE TICKETS 1459746282 -1
1) "TICKET2"
2) "TICKET3"
```

There is some more commands in the Redis hash that can help us in this process

|Command|Action|
|-------|------|
|ZCARD| 	Get number of items|
|ZCOUNT| 	Number of items within score range|
|ZINCRBY| 	Add to score|
|ZLEXCOUNT| 	Lexicographical range count|
|ZRANGE| 	Get items within rank range|
|ZLEXRANGE| 	Get items within lexicographical range|
|ZRANGEBYSCORE| 	Get items within score range|
|ZRANK| 	Get item rank|
|ZREM| 	Remove item(s)|
|ZREMRANGEBYLEX| 	Remove items within lexicographical range|
|ZREMRANGEBYRANK| 	Remove items within rank range|
|ZREMRANGEBYSCORE| 	Remove items within score range|
|ZREVRANGE| 	ZRANGE in reverse order|
|ZREVRANGEBYSCORE| 	ZRANGEBYSCORE in reverse order|
|ZREVRANK| 	ZRANK in reverse order|
|ZSCAN| 	Iterate items|
|ZSCORE| 	Get item score|
|ZUNIONSTORE| 	Store union|