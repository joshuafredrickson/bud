// Copyright © Roots Software Foundation LLC
// Licensed under the MIT license.

/**
 * Preset config for WordPress plugins & themes.
 *
 * @see https://bud.js.org
 * @see https://github.com/roots/bud
 */

import BudPresetWordPress, {type PublicExtension} from '@roots/bud-preset-wordpress/extension'

declare module '@roots/bud-framework' {
  interface Bud {
    wp: PublicExtension
  }

  interface Modules {
    '@roots/bud-preset-wordpress': BudPresetWordPress
  }
  interface Loaders {
    '@roots/wordpress-hmr/loader': any
  }
  interface Items {
    '@roots/wordpress-hmr/loader': any
  }
}

export {BudPresetWordPress as default}
