---
id: bud-api.facade.watch
title: watch property
sidebar_label: watch property
hide_title: true
sidebar: "api"
slug: watch
---

## Facade.watch property

Configure the list of files that, when modified, will force the browser to reload (even in hot mode).

Signature:

```typescript
watch: watch;
```

## Example

```js
app.watch(["templates/*.html"]);
```