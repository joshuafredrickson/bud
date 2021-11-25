## API Report File for "@roots/bud-wordpress-externals"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import type { Extension } from '@roots/bud-framework';
import { WordPressExternals } from '@roots/wordpress-externals-webpack-plugin';

// @public (undocumented)
export const make: () => WordPressExternals;

// @public (undocumented)
const name_2: "@roots/wordpress-externals-webpack-plugin";
export { name_2 as name }

// @public
export interface PluginAdapter extends Extension.CompilerPlugin<WordPressExternals> {
    // (undocumented)
    make: () => WordPressExternals;
    // (undocumented)
    name: '@roots/wordpress-externals-webpack-plugin';
}

// Warning: (ae-unresolved-inheritdoc-reference) The @inheritDoc reference could not be resolved: The reference is ambiguous because "PluginAdapter" has more than one declaration; you need to add a TSDoc member reference selector
//
// @public (undocumented)
export const PluginAdapter: PluginAdapter;

```