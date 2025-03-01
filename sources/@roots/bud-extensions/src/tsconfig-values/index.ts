import type {Bud} from '@roots/bud-framework'

import {isAbsolute, join} from 'node:path'

import {
  Extension,
  type StrictPublicExtensionApi as PublicExtensionApi,
} from '@roots/bud-framework/extension'
import {
  bind,
  disabled,
  expose,
  label,
  options,
} from '@roots/bud-framework/extension/decorators'
import isString from '@roots/bud-support/lodash/isString'

type CompilerOptions = {
  baseUrl: string | undefined
  outDir: string | undefined
  paths: Record<string, Array<string>> | undefined
  rootDir: string | undefined
}

type BudOptions = {
  useCompilerOptions?: boolean
}

type Options = {
  bud: BudOptions | undefined
  compilerOptions: CompilerOptions | undefined
  exclude: Array<string> | undefined
  include: Array<string> | undefined
}

type Api = PublicExtensionApi<BudTsConfigValues, Options> & {
  getBud: () => Api['bud']
  getCompilerOptions: () => Api['compilerOptions']
  getExclude: () => Api['exclude']
  getInclude: () => Api['include']

  setBud: (bud: BudOptions) => Api
  setCompilerOptions: (options: CompilerOptions) => Api
  setExclude: (exclude: Array<string>) => Api
  setInclude: (include: Array<string>) => Api
}

/**
 * The BudTsConfigValues class configures the bud.js application using settings
 * defined in a tsconfig.json file. This includes several options such as compilerOptions,
 * include, exclude, and a special bud key. The compilerOptions property provides configuration for the
 * TypeScript compiler, while include and exclude specify which files are to be included
 * in or excluded from the process. The bud property allows for enabling the use of compilerOptions.
 */
@label(`@roots/bud-extensions/tsconfig-values`)
@expose(`tsconfig`)
@options<Options>({
  bud: undefined,
  compilerOptions: undefined,
  exclude: undefined,
  include: undefined,
})
@disabled
export default class BudTsConfigValues
  extends Extension<Options>
  implements Api
{
  /**
   * tsconfig.json bud value
   */
  public declare bud: Api['bud']

  /**
   * compilerOptions value
   * @see https://www.typescriptlang.org/tsconfig#compilerOptions
   */
  public declare compilerOptions: Api['compilerOptions']

  /**
   * tsconfig.exclude value
   * @see https://www.typescriptlang.org/tsconfig#exclude
   */
  public declare exclude: Api['exclude']

  /**
   * Get bud tsconfig.json value
   * @returns tsconfig.bud value
   */
  public declare getBud: Api['getBud']
  /**
   * Get compilerOptions
   * @returns CompilerOptions
   * @see https://www.typescriptlang.org/tsconfig#compilerOptions
   */
  public declare getCompilerOptions: Api['getCompilerOptions']

  /**
   * Get exclude
   * @returns exclude
   * @see https://www.typescriptlang.org/tsconfig#exclude
   */
  public declare getExclude: Api['getExclude']

  /**
   * Get include
   * @returns include
   * @see https://www.typescriptlang.org/tsconfig#include
   */
  public declare getInclude: Api['getInclude']

  /**
   * include value
   * @see https://www.typescriptlang.org/tsconfig#include
   */
  public declare include: Api['include']
  /**
   * Set bud tsconfig.json value
   * @param options bud
   * @returns this
   */
  public declare setBud: Api['setBud']

  /**
   * Set compilerOptions
   * @param options CompilerOptions
   * @returns this
   * @see https://www.typescriptlang.org/tsconfig#compilerOptions
   */
  public declare setCompilerOptions: Api['setCompilerOptions']

  /**
   * Set exclude
   * @param options exclude
   * @returns this
   * @see https://www.typescriptlang.org/tsconfig#exclude
   */
  public declare setExclude: Api['setExclude']
  /**
   * Set include
   * @param options include
   * @returns this
   * @see https://www.typescriptlang.org/tsconfig#include
   */
  public declare setInclude: Api['setInclude']

  /**
   * The `configAfter` method adjusts the bud.js application
   * configuration by setting up paths and determining file inclusion and exclusion
   * based on the tsconfig.json settings.
   *
   * {@link Extension.configAfter}
   */
  public override async configAfter(bud: Bud) {
    if (!this.isEnabled()) return

    // If a base directory has been defined in the tsconfig.json (either as rootDir or baseUrl),
    // it is set as the @src path in the bud.js application.
    if (this.derivedBaseDir) {
      this.logger.log(
        `setting @src dir as specified in jsconfig/tsconfig: ${this.derivedBaseDir}`,
      )
      bud.setPath({'@src': this.derivedBaseDir})
    }

    // If an output directory has been defined in the tsconfig.json, it is set as the @dist path in the bud.js application.
    if (this.compilerOptions?.outDir) {
      this.logger.log(
        `setting @dist dir as specified in jsconfig/tsconfig: ${this.compilerOptions.outDir}`,
      )
      bud.setPath({'@dist': this.compilerOptions.outDir})
    }

    // If paths have been defined in the tsconfig.json, these paths are normalized (i.e., made absolute)
    // and then set as paths w/ aliases in the bud.js application.
    if (this.compilerOptions?.paths) {
      const normalPaths = this.normalizePaths(this.compilerOptions.paths)
      if (normalPaths)
        bud
          .setPath(normalPaths)
          // @ts-ignore
          .alias(
            Object.entries(normalPaths).reduce(
              (a, [k, v]) => ({
                ...a,
                [k]: this.makeAbsolute(v),
              }),
              {},
            ),
          )
    }

    // If specific directories have been defined to be included in the tsconfig.json,
    // those directories are added to the Bud.js application's compilation paths.
    if (this.include) {
      const directories = (
        await Promise.all(
          this.include.map(async (path: string) => {
            const type = await bud.fs.exists(path)

            // If the path exists, is a directory (not a file),
            // and it doesn't match the config path pattern, then it's added to the directories array.
            // The config directory is often ignored in this context because it typically contains
            // configuration files for various tools and libraries used in your project. These
            // files are not part of the actual source code that needs to be compiled or transformed,
            // but are instead used to control the behavior of these processes.
            return type === `dir` && !path.match(/^\.?\/?config/)
              ? path
              : undefined
          }),
        )
      ).filter(isString)

      directories &&
        // Include these directories in Bud.js' compilePaths
        // @ts-ignore
        bud.compilePaths(directories.map(dir => bud.path(dir)))
    }
  }

  public get derivedBaseDir(): string | undefined {
    return (
      this.getCompilerOptions()?.rootDir ??
      this.getCompilerOptions()?.baseUrl
    )
  }

  /**
   * Make absolute path
   *
   * @param path string
   * @returns string
   */
  @bind
  public makeAbsolute(path: string): string {
    return isAbsolute(path) ? path : this.app.path(path)
  }

  /**
   * Resolve {@link CompilerOptions.paths} against {@link BudTsConfigValues.derivedBaseDir}
   *
   * @remarks
   * Operates on the first item in the array of paths
   *
   * @param paths
   * @returns
   */
  @bind
  public normalizePaths(
    paths: Record<string, Array<string>>,
  ): Record<string, string> | undefined {
    if (!paths) return

    const normalPaths = Object.entries(paths)
      .filter(([k, v]) => Array.isArray(v))
      .map(([k, v]) => [k, v[0]])
      .filter(Boolean)
      .map(tuple => tuple.map((str: string) => str.replace(`/*`, ``)))
      .reduce(
        (acc, [key, value]) => ({
          ...acc,
          [key]: this.derivedBaseDir
            ? join(this.derivedBaseDir, value)
            : value,
        }),
        {},
      )

    this.logger.log(`normalized paths`, normalPaths)
    return normalPaths
  }

  /**
   * {@link Extension.register}
   */
  public override async register(bud: Bud) {
    const fetchConfigModule =
      bud.context.files[`tsconfig`]?.module ??
      bud.context.files[`jsconfig`]?.module

    if (!fetchConfigModule) return

    const tsConfig = await fetchConfigModule()
    if (!tsConfig) return

    if (tsConfig.compilerOptions)
      this.setCompilerOptions(tsConfig.compilerOptions)

    tsConfig.include && this.setInclude(tsConfig.include)
    tsConfig.exclude && this.setExclude(tsConfig.exclude)
    tsConfig.bud && this.setBud(tsConfig.bud)
    tsConfig.bud?.useCompilerOptions && this.enable()
  }
}
