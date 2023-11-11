---
title: "Developing “Keep Me Logged In” / “Remember me” / \"Stay signed in\"option"
date: "2015-01-21"
categories: 
  - "computer-science"
  - "technology"
tags: 
  - "how-to"
  - "php"

layout: post
title:  "Developing “Keep Me Logged In” / “Remember me” / \"Stay signed in\"option"
date: 2015-01-21
description: "Developing “Keep Me Logged In” / “Remember me” / \"Stay signed in\"option"
tags: authentication
categories: front-end
thumbnail: assets/images/stay-signed-in.png
giscus_comments: false
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/stay-signed-in.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

I recently had to develop above feature couple of times in past few weeks. I came across several issues while implementing this feature. Most of these issues did not have any thing do with the programming language I used (i.e. they are not implementation related issues) but had to do with the concept of development (i.e. design issues). As these are concept level issues, I can make this article more abstract and do not have to couple with a programming language I used (PHP). However will show some code segments in PHP + pseudo, which will be very basic and can be easily translated to any other language.

First, I must emphasize that this method is based on one basic idea. “DO NOT PUT USER DATA IN COOKIE”, even in encrypted format. If you are OK with putting some user data in the cookie, because you believe that encryption cannot be broken or the information is useless to an attacker, jump to the “Not Recommended but Easy Solution” section at the end of the article

## Recommended Solution

### Why we should not put user data in the cookie

Let us say that we used md5 hashing. Even though it is hard to break, modern day computers are good at it. Especially with the recent development in GPUs, this is much easier. In future, it is going to be even more powerful and you will need to change your code when it gets to that stage. One-way to make it bit more secure is by adding more randomness in to the user information using a salt. However best way is not to save any user information on the browser.

### Setting the Cookie

We need to get two things done when user returns. However, we should not store any user detail in order to do that

- We need to validate the token
- Identify the user, who is related to the token

First, I will generate a good random value with high entropy (if you are not comfortable with how to do that, just search on it and you will come across so many better ways of doing that). I used below,

$token = uniqid(mt\_rand(), true);

Then we will store the token in the DB, which will return an Id to identify the saved information. This Id will be used to get the $token and $userId (some king of an identification that will help us to identify the user)

I will save 3 values in the cookie with “||” separating each value. The cookie value will look like below. Mind here I have used a CRYPT\_KEY, which only I know. Make sure this value is truly random and very strong.

$someId = storeInDB ($tocken, $userId);
$cookieValue = $someId . '||' . $token . '||' . hash\_hmac('ripemd160', $token, CRYPT\_KEY);
setcookie('rememberme', $cookieValue);

### Reading the Cookie

This is what happens when the user comes back, as you can remember we have to get two things done

- We need to validate the token
- Identify the user related to token

First, we need to get the string divided by “||”

list ($someId, $token, $encryptedToken) = explode('||', $\_COOKIE\['rememberme'\])

Use the $someId and do a db call to get the userId and token ($userID, $tockenFromDB)

To validate token below expression should be true. If it is TRUE, identify the user and log him in

if ($encryptedToken == hash\_hmac('ripemd160', $token, CRYPT\_KEY)) {
  If ($token == $tockenFromDB) {
    $user = getUserById($userId);
    login($user);
  }
}

## Not Recommended But Easy Solution

If you are OK with putting some user data in the cookie, either because you believe that encryption cannot be broken or the user information is useless to a attacker, You can use below method. Just get the cookie value as below, here $userEmail can be any user identification.

$cookieValue = $userEmail . '||' . hash\_hmac('ripemd160', $userEmail, CRYPT\_KEY);

When user returns,

list ($userEmail, $encryptedUserEmail) = explode('||', $\_COOKIE\['rememberme'\])

Verify if hash\_hmac('ripemd160', $userEmail, CRYPT\_KEY) == $encryptedUserEmail.

Then login the user with $userEmail

This method removes all database calls and token generation steps so this will be lot faster than the above method. If you have any problems ask them in comments.
