import type {Context} from '@roots/bud-framework/context'

import {dirname, join} from 'node:path/posix'
import {fileURLToPath} from 'node:url'

import {bind} from '@roots/bud-support/decorators/bind'
import {filesystem as fs} from '@roots/bud-support/filesystem'
import {resolve} from '@roots/bud-support/import-meta-resolve'
import isString from '@roots/bud-support/lodash/isString'

import type {Cli} from './app.js'

/**
 * Command finder class
 */
export class Finder {
  /**
   * Command paths
   */
  public paths: Array<string>

  /**
   * Class constructor
   */
  public constructor(
    public context: Partial<Context>,
    public application: Cli,
  ) {}

  /**
   * Is cacheable
   */
  public get cacheable(): boolean {
    return (
      !this.context.use &&
      this.context.cache !== false &&
      this.context.force !== true
    )
  }

  /**
   * Clear cache
   */
  @bind
  public async cacheClear() {
    try {
      if (await fs.exists(this.cachePath)) await fs.remove(this.cachePath)
    } catch (error) {}
  }

  /**
   * Cache path
   */
  public get cachePath() {
    return join(this.context.paths.storage, `bud.commands.yml`)
  }

  /**
   * Read cache
   */
  @bind
  public async cacheRead() {
    return await fs.read(this.cachePath)
  }

  /**
   * Write cache
   */
  @bind
  public async cacheWrite() {
    if (this.paths && this.cacheable)
      await fs.write(this.cachePath, this.paths)
  }

  /**
   * Get registration module paths
   */
  @bind
  public async getModules(): Promise<Array<any>> {
    this.paths = await this.resolve(this.getSignifiers())
      .then(this.getPaths)
      .then(this.resolve)

    return this.paths
  }

  /**
   * Get paths
   */
  @bind
  public getPaths(paths: Array<string>) {
    return paths
      .map(dirname)
      .map(path => join(path, join(`bud`, `commands`, `index.js`)))
  }

  /**
   * Get array of project dependencies
   */
  @bind
  public getSignifiers(): Array<string> {
    return [
      ...Object.keys({
        ...(this.context.manifest?.dependencies ?? {}),
        ...(this.context.manifest?.devDependencies ?? {}),
      }),
      ...(this.context.use ?? []),
    ].filter(signifier => !signifier.startsWith(`@types`))
  }

  /**
   * Import commands
   */
  @bind
  public async importCommands(): Promise<any> {
    return await Promise.all(
      this.paths.map(async path => {
        try {
          return [
            path,
            await import(path).then(({default: register}) => register),
          ]
        } catch (error) {
          await this.cacheClear()
        }
      }),
    ).catch(this.cacheClear)
  }

  /**
   * Get commands
   *
   * @remarks
   * Returns cached commands if they exist, otherwise
   * resolves and caches commands from project dependencies.
   */
  @bind
  public async init() {
    const path = join(this.context.paths.storage, `bud.commands.yml`)
    try {
      if ((await fs.exists(path)) && this.cacheable) {
        this.paths = await fs.read(path)
        if (Array.isArray(this.paths)) return this
        else throw new Error()
      }
    } catch (error) {}

    await this.getModules()
    await this.cacheWrite()
    return this
  }

  /**
   * Resolve signifiers against import.meta.url
   */
  @bind
  public async resolve(paths: Array<string>) {
    return await Promise.all(
      paths.map(async path => {
        try {
          return await resolve(path, import.meta.url)
        } catch (error) {}
      }),
    )
      .then(paths => paths.filter(isString).map(fileURLToPath))
      .then(
        async paths =>
          await Promise.all(
            paths.map(async path => {
              try {
                const exists = await fs.exists(path)
                if (exists) return path
              } catch (error) {}
            }),
          ).then(paths => paths.filter(Boolean)),
      )
  }
}
