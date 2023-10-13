---
layout: post
title:  VS Code Won’t Open After Unplanned Restart (Failed to deserialize the V8 snapshot blob)
date: 2021-02-11 21:01:00
description: VS Code Won’t Open After Unplanned Restart (Failed to deserialize the V8 snapshot blob)
tags: coding programming tools
categories: programming
thumbnail: assets/img/vs_code_wont_open/vs_code_wont_open.png
giscus_comments: false
---

<div class="row mt-3">
    <div class="col-sm mt-3 mt-md-0">
        {% include figure.html path="assets/img/vs_code_wont_open/vs_code_wont_open.png" class="img-fluid rounded z-depth-1" %}
    </div>
</div>

The visual studio was running fine in my machine till an unplanned restart happened. Soon after restart VS didn’t open giving me the below error. I reinstalled the Visual Studio Code without uninstalling which fixed the issue. In addition, it started without any loss to previous plugins and open projects.
Error

```
Fatal error in , line 0
Failed to deserialize the V8 snapshot blob. This can mean that the snapshot blob file is corrupted or missing.
FailureMessage Object: 00000071D3DFF2C0
1: 00007FF60A57E91F node::Buffer::New+130911
2: 00007FF60A3F7CDA IsSandboxedProcess+1850986
3: 00007FF608E1D798 v8::Isolate::Initialize+744
4: 00007FF60A3FD1A0 uv_mutex_unlock+21184
5: 00007FF607A28793 std::__1::__vector_base >::__end_cap+102515
6: 00007FF607AE56C8 v8::internal::JSMemberBase::JSMemberBase+54872
7: 00007FF6079513A0 Ordinal0+5024
8: 00007FF60D6FDB02 uv_random+18066594
9: 00007FFB77EF4034 BaseThreadInitThunk+20
10: 00007FFB781F3691 RtlUserThreadStart+33
```