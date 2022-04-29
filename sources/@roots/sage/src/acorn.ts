import {Bud} from '@roots/bud-framework'

import eventAppClose from './hooks/event.app.close'
import eventCompilerDone from './hooks/event.compiler.done'

/**
 * Override output directory for svg assets
 * `@roots/bud-build` places them, by default, in `svg/`
 */
export const setSvgEmit = ({build}: Bud) =>
  build.rules.svg.setGenerator(({path, relPath}) => ({
    filename: relPath(path('@dist'), path('@dist/images/@name')),
  }))

/**
 * Tell Acorn that assets have no `publicPath` even if bud is using one internally.
 * Acorn does its own `pulicPath` processing.
 *
 * Not setting an empty string will likely result in duplicative path segments
 * and unresolved assets.
 */
export const setManifestPublicPath = ({extensions}: Bud) =>
  extensions.get('@roots/bud-entrypoints').setOption('publicPath', '')

/**
 * - If publicPath is `/` in production assets will not be locatable by Acorn.
 * - If publicPath is `''` in development bud's dev server will implode.
 * - If publicPath is the actual publicPath acorn will double up the path segments.
 */
export const setPublicPath = ({hooks, isDevelopment}: Bud) =>
  hooks.on('build.output.publicPath', isDevelopment ? `/` : ``)

/**
 * Write hmr.json when compilation is finalized (only in development)
 * Remove this file when process is exited.
 */
export const hmrJson = ({isDevelopment, tap}: Bud) =>
  isDevelopment &&
  [
    ({hooks}) => hooks.action('event.compiler.done', eventCompilerDone),
    ({hooks}) => hooks.action('event.app.close', eventAppClose),
  ].map(fn => tap(fn))