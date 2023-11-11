---
layout: post
title:  Setting up basic authentication for DBfit with Nginx
date: 2015-07-13
description: Setting up basic authentication for DBfit with Nginx
tags: authentication dbfit nginx
categories: front-end
thumbnail: assets/images/Setting-up-basic-authentication-for-DB-fit-with-Nginx.png
giscus_comments: false
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/images/Setting-up-basic-authentication-for-DB-fit-with-Nginx.png" class="img-fluid rounded z-depth-1 mx-auto d-block" %}
    </div>
</div>

First you need to install Nginx in the server. I performed this in a Ubuntu server and following commands need to be altered according to the OS if you are not a Ubuntu user. This setup has two main parts. First we will install Nginx and then we will move towards the basic authentication setup for DBfit with Nginx.

## Setting up Nginx (extremely straightforward)

sudo apt-get install nginx

sudo service nginx start

This should install Nginx in the Ubuntu machine. But unlucky I got the following error \[If you got it installed and started correctly without any errors, you can skip this section\]

Starting nginx: nginx: \[emerg\] bind() to 0.0.0.0:80 failed (98: Address already in use)
nginx: \[emerg\] bind() to 0.0.0.0:80 failed (98: Address already in use)
nginx: \[emerg\] bind() to 0.0.0.0:80 failed (98: Address already in use)
nginx: \[emerg\] bind() to 0.0.0.0:80 failed (98: Address already in use)
nginx: \[emerg\] bind() to 0.0.0.0:80 failed (98: Address already in use)
nginx: \[emerg\] still could not bind()

This happened due to the default file in the sites-available folder. You can simply remove the default file symbolic link in the sites-enabled folder and give another start to the nginx. This time it started without any issue.

## Setting up basic authentication with Nginx

First you need to create the htpasswd file (this is where your password for the DBfit will reside). You need to run the below 2 commands and it will prompt you for the password after that.

sudo apt-get install apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd <username>

Create a new conf file in the sites-available folder (this can be found in the etc/nginx folder) I'll call it dbfit.conf. Here we will add the following rules.

vi sites-available/dbfit.conf

\[content\]
server {
 listen 8085;
 server\_name 127.0.0.1;
 location / {
  proxy\_pass http://127.0.0.1:\[port where DBFit is running\];
  auth\_basic "Restricted";
  auth\_basic\_user\_file /etc/nginx/.htpasswd;
 }
}

Create a symbolic link in the sites-enabled folder to the config file in the sites-available folder.

sudo ln -s /etc/nginx/sites-available/test.conf /etc/nginx/sites-enabled/

Now change the default Dbfit port

vi plugins.properties

\[Content\]
Theme=bootstrap
Port=8086
VersionsController.days=0

- Restart Dbfit
- Restart nginx
