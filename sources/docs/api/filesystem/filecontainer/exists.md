---
id: filesystem.filecontainer.exists
title: exists() method
sidebar_label: exists() method
hide_title: true
sidebar: "api"
slug: exists
---

<!-- Do not edit this file. It is automatically generated by API Documenter. -->

## FileContainer.exists() method

Return a boolean `true` if repository has a key and it's value resolves to an actual disk location.

Signature:

```typescript
exists(key: string): boolean;
```

## Parameters

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| key       | string |             |

Returns:

boolean

## Example

```js
fsInstance.exists("some/file.js");
```