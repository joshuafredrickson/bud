import type {Context} from '@roots/bud-framework/context'

import {join} from 'node:path'
import {stderr, stdin, stdout} from 'node:process'

import * as filesystem from '@roots/bud-support/filesystem'
import logger from '@roots/bud-support/logger'
import args from '@roots/bud-support/utilities/args'
import * as projectEnv from '@roots/bud-support/utilities/env'
import * as projectFiles from '@roots/bud-support/utilities/files'
import * as projectPaths from '@roots/bud-support/utilities/paths'

import * as budManifest from './bud.js'
import getExtensions from './extensions.js'
import services from './services.js'

export type Options = Omit<Partial<Context>, `extensions`> & {
  extensions?: Array<string>
}

export default async (options: Options = {}): Promise<Context> => {
  const basedir = options?.basedir ?? process.cwd()
  const paths = projectPaths.get(basedir)

  const fs = filesystem.get(paths.basedir)
  const env = projectEnv.get(paths.basedir)
  const bud = await budManifest.get(fs)

  let manifest: Context[`manifest`]
  try {
    manifest = await fs.read(join(paths.basedir, `package.json`))
  } catch (e) {
    logger.scope(`bootstrap`).warn(`📦`, `no package.json found`)
  }

  const files: Context[`files`] = await projectFiles.get(paths.basedir)
  const extensions: Context[`extensions`] = getExtensions(
    manifest,
    args.use ?? [],
    options?.extensions,
  )

  const context: Context = {
    ...(args ?? {}),
    ...options,
    basedir: paths.basedir,
    bin: (env.BUD_JS_BIN as Context[`bin`]) ?? `node`,
    bud: {...bud, ...(options?.bud ?? {})},
    env: {...(env ?? {}), ...(options?.env ?? {})},
    extensions,
    files: {...(files ?? {}), ...(options?.files ?? {})},
    label: options?.label ?? manifest?.name ?? bud?.label ?? `default`,
    manifest: {...(manifest ?? {}), ...(options?.manifest ?? {})},
    mode: options?.mode ?? `production`,
    paths: {...paths, ...(options?.paths ?? {})},
    services: [...(services ?? []), ...(options?.services ?? [])],
    stderr: options?.stderr ?? stderr,
    stdin: options?.stdin ?? stdin,
    stdout: options?.stdout ?? stdout,
  }

  global.process.env.mode = context.mode

  logger
    .unscope()
    .scope(`bootstrap`)
    .log(`🏗️`, `building`, context.label)
    .log(`📂`, `basedir`, context.basedir)
    .log(`😎`, `version`, context.bud.version)
    .scope(context.label)

  return context
}

export type {Context}
