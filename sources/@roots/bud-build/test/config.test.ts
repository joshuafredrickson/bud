import {type Bud, factory} from '@repo/test-kit'
import Build from '@roots/bud-build'
import {beforeEach, describe, expect, it} from 'vitest'

describe(`bud.build.config`, function () {
  let bud: Bud
  let build: Build

  beforeEach(async () => {
    bud = await factory({cache: `filesystem`})
    build = new Build(() => bud)
    await build.register?.(bud)
    await build.make()
  })

  it(`should not include deprecated properties`, async () => {
    expect(build.config.hasOwnProperty(`devServer`)).toBe(false)
    expect(build.config.hasOwnProperty(`unsafeCache`)).toBe(false)
  })

  it(`should have expected bail default`, async () => {
    expect(build.config.bail).toEqual(true)
  })

  it(`should have expected cache default`, async () => {
    const {cache}: any = build.config

    expect(cache.type).toStrictEqual(`filesystem`)

    expect(cache.version).toStrictEqual(undefined)
  })

  it(`should have expected context default`, async () => {
    expect(build.config.context).toEqual(bud.path(`@src`))
  })

  it(`should have expected devtool default`, async () => {
    expect(build.config.devtool).toBe(false)
  })

  it(`should have expected entry default`, async () => {
    expect(build.config.entry).toEqual({main: {import: [`index`]}})
  })

  it(`should have expected mode default`, async () => {
    expect(build.config.mode).toEqual(`production`)
  })

  it(`should have expected name default`, async () => {
    expect(build.config.name).toEqual(`@tests/project`)
  })

  it(`should have expected node default`, async () => {
    expect(build.config.node).toEqual(false)
  })

  it(`should have expected optimization.minimize default`, async () => {
    expect(build.config.optimization?.minimize).toEqual(true)
  })

  it(`should have expected optimization.emitOnErrors default`, async () => {
    expect((build.config.optimization as any).emitOnErrors).toEqual(false)
  })

  it(`should have expected optimization.runtimeChunk default`, async () => {
    expect(build.config.optimization?.runtimeChunk).toBe(`single`)
  })

  it(`should have expected profile default`, async () => {
    expect(build.config.profile).toBeUndefined()
  })

  it(`should have expected resolve.alias default`, async () => {
    expect(build.config.resolve?.alias).toEqual({
      '@src': bud.path(`@src`),
    })
  })

  it(`should have expected resolve.extensions default`, async () => {
    expect(build.config.resolve?.extensions?.sort()).toEqual(
      expect.arrayContaining([
        `.css`,
        `.js`,
        `.jsx`,
        `.mjs`,
        `.mts`,
        `.ts`,
        `.tsx`,
      ]),
    )
  })

  it(`should have expected target default`, async () => {
    expect(build.config.target).toMatch(/browserslist.*/)
  })

  it(`should have expected watch default`, async () => {
    expect(build.config.watch).toBeUndefined()
  })

  it(`should have expected watchOptions default`, async () => {
    expect(build.config.watchOptions).toBeUndefined()
  })

  it(`should have expected plugins`, async () => {
    const plugins = build.config.plugins
      ?.map(plugin => plugin?.constructor.name)
      .sort()

    expect(plugins).toContain(`CleanWebpackPlugin`)
    expect(plugins).toContain(`FixStyleOnlyEntrypoints`)
  })

  it(`should have expected default requireEnsure rule`, async () => {
    if (!build.config.module?.rules?.length) throw new Error()
    expect(build.config.module.rules[0]).toEqual(
      expect.objectContaining({
        parser: {
          requireEnsure: false,
        },
      }),
    )
  })
})
