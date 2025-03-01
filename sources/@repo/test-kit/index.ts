import type {Bud} from '@roots/bud-framework'
import type {Context} from '@roots/bud-framework/context'

import {path} from '@repo/constants'
import {factory} from '@roots/bud/factory'

export type Options = Omit<Partial<Context>, `extensions`> & {
  extensions?: Array<string>
}

const makeTestBud = async (options: Options = {}): Promise<Bud> => {
  const bud = await factory({
    basedir: options.basedir ?? path(`tests`, `util`, `project`),
    cache: false,
    dry: true,
    force: true,
    mode: `production`,
    notify: false,
    silent: true,
    ...options,
  })

  return bud
}

export type {Bud}
export {makeTestBud as factory, makeTestBud}
