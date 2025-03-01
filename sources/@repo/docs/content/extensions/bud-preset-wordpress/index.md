---
title: '@roots/bud-preset-wordpress'
description: 'Recommended extensions and base configuration for WordPress projects'
sidebar_label: '@roots/bud-preset-wordpress'
---

import Tabs from '@theme/Tabs'
import TabItem from '@theme/TabItem'

The [@roots/bud-preset-wordpress](/extensions/bud-preset-wordpress) package is a great starting point for WordPress plugins & themes.

If you plan on using it in a WordPress theme you should consider using [@roots/sage](https://github.com/roots/sage).

## Installation

To get started with WordPress, install the [@roots/bud-preset-wordpress preset](/extensions/bud-preset-wordpress) along with a compatible compiler:

- [@roots/bud-babel](/extensions/bud-babel)
- [@roots/bud-esbuild](/extensions/bud-esbuild)
- [@roots/bud-swc](/extensions/bud-swc)
- [@roots/bud-typescript](/extensions/bud-typescript)

We recommend using [@roots/bud-swc](/extensions/bud-swc), which is included in [@roots/bud-preset-recommend](/extensions/bud-preset-recommend):

```bash npm2yarn
npm install @roots/bud-preset-wordpress @roots/bud-preset-recommend --save-dev
```

## Included extensions

The [@roots/bud-preset-wordpress preset](/extensions/bud-preset-wordpress) includes the following extensions:

- [@roots/bud-react](/extensions/bud-react)
- @roots/bud-wordpress-dependencies
- @roots/bud-wordpress-externals
- @roots/bud-wordpress-theme-json
- @roots/wordpress-hmr

## Managing WordPress enqueues

If you are using [roots/sage](https://roots.io/sage) these details are handled for you by Acorn (or if you are using Acorn in a site specific plugins, etc.)

If Acorn isn't available, you will want to do something like this:

```php
add_action('enqueue_block_editor_assets', function () {
  $url = fn ($endpoint) => join("/", [plugin_dir_url(__FILE__), 'dist', $endpoint]);
  $path = fn ($endpoint) => join("/", [plugin_dir_path(__FILE__), 'dist', $endpoint]);
  $read = fn ($endpoint) => file_get_contents($path($endpoint));

  $entrypoints = json_decode($read('entrypoints.json'));

  wp_enqueue_script(
    'my-plugin/js',
    $url($entrypoints->app->js[0]),
    [],
    null,
    true
  );
});
```

## Managing WordPress runtime dependencies

If WordPress provides a package any references you make to it will be replaced by a reference to the WP provided global.

For example, if you import jquery in your application like so:

```
import $ from 'jquery'
```

It will be bundled as something like this:

```js
const e = window.jQuery
```

If you check out `entrypoints.json` you'll see the WordPress dependencies listed per entrypoint under the `dependencies` key:

```json
{
  "editor": {
    "js": [
      "js/runtime.6390bb.js",
      "js/editor.b7e1d1.js"
    ],
    "css": [
      "css/editor.8cd6ea.css"
    ],
    "dependencies": [
      "jquery",
      "wp-blocks",
      "wp-dom-ready"
    ]
  }
}
```

The intent is for you to read this file in your WordPress theme or plugin and enqueue the dependencies dynamically.

Building off the previous example code, this is how one might handle enqueueing dependencies with the WordPress API:

```php
add_action('enqueue_block_editor_assets', function () {
  $url = fn ($endpoint) => join("/", [plugin_dir_url(__FILE__), 'dist', $endpoint]);
  $path = fn ($endpoint) => join("/", [plugin_dir_path(__FILE__), 'dist', $endpoint]);
  $read = fn ($endpoint) => file_get_contents($path($endpoint));

  $entrypoints = json_decode($read('entrypoints.json'));

  wp_enqueue_script(
    'my-plugin/js',
    $url($entrypoints->app->js[0]),
    $entrypoints->app->dependencies,
    null,
    true
  );
});
```

### Excluding dependencies

There may be situations where you want to exclude a package from this behavior. For example, you may wish to use a different version of jQuery than the one provided by WordPress.

To address this, you can use `bud.wp.setExclude`:

```ts title=bud.config.ts
import type {Bud} from '@roots/bud'

export default async (bud: Bud) => {
  bud.wp.setExclude(['jquery'])
}
```

You can also use `bud.wp.setExclude` with a callback:

```ts title=bud.config.ts
import type {Bud} from '@roots/bud'

export default async (bud: Bud) => {
  bud.wp.setExclude((exclude = []) => [...exclude, 'jquery'])
}
```
