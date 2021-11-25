## API Report File for "@roots/bud"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import type { Configuration } from '@roots/bud-framework';
import { Constructor } from '@roots/bud-framework';
import { Extension } from '@roots/bud-framework';
import { Framework as Framework_2 } from '@roots/bud-framework';
import { Item } from '@roots/bud-framework';
import { Loader } from '@roots/bud-framework';
import { Options } from '@roots/bud-framework';
import { Rule } from '@roots/bud-framework';
import { SetOptional } from 'type-fest';

// Warning: (ae-forgotten-export) The symbol "Contract" needs to be exported by the entry point index.d.ts
//
// @public
class Bud extends Framework_2 implements Contract {
    constructor(options: Options);
    implementation: Constructor;
}
export { Bud }
export { Bud as Framework }

// @public (undocumented)
export const config: Configuration;

export { Extension }

// Warning: (ae-forgotten-export) The symbol "Options" needs to be exported by the entry point index.d.ts
//
// @public
export function factory(overrides?: Options_2): Bud;

export { Item }

export { Loader }

export { Rule }

```