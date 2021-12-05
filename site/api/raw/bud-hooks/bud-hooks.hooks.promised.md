<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@roots/bud-hooks](./bud-hooks.md) &gt; [Hooks](./bud-hooks.hooks.md) &gt; [promised](./bud-hooks.hooks.promised.md)

## Hooks.promised() method

Asyncronous hook filter

<b>Signature:</b>

```typescript
promised<T = any>(id: `${Contract.Name & string}`, value?: T): Promise<T>;
```
<b>Decorators:</b>

`@bind`

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  id | \`${Contract.Name &amp; string}\` |  |
|  value | T |  |

<b>Returns:</b>

Promise&lt;T&gt;

## Remarks

This method is used to filter a hook event.

## Example


```js
bud.hooks.filter(
  'namespace.name.event',
  ['array', 'of', 'items'],
)
```
