import '@roots/bud-postcss'
import '@roots/bud-sass'
import '@roots/bud'

import {beforeEach, describe, expect, it, vi} from 'vitest'
import {factory} from '@repo/test-kit'
import BudPostCSS from '@roots/bud-postcss'

import BudSass from '../src/index.js'

describe(`@roots/bud-sass/extension`, () => {
  let bud
  let postcss: BudPostCSS
  let sass: BudSass

  beforeEach(async () => {
    vi.clearAllMocks()

    bud = await factory()
    postcss = new BudPostCSS(bud)
    sass = new BudSass(bud)
    bud.sass = sass
    bud.postcss = postcss
  })

  it(`should be instantiable`, () => {
    expect(sass).toBeInstanceOf(BudSass)
  })

  it(`should call import when sass.register is called`, async () => {
    const importSpy = vi.spyOn(sass, `import`)
    await sass.register(bud)
    expect(importSpy).toHaveBeenCalled()
  })

  it(`should call set when sass.registerGlobal is called`, () => {
    const setSpy = vi.spyOn(sass, `set`)

    sass.registerGlobal(`$primary-color: #ff0000;`)
    expect(sass.get(`additionalData`)).toBe(`$primary-color: #ff0000;`)
  })

  it(`should call setLoader`, async () => {
    const setLoaderSpy = vi.spyOn(bud.build, `setLoader`)
    await sass.register(bud)

    expect(setLoaderSpy).toHaveBeenCalledWith(
      `sass`,
      expect.stringContaining(`sass-loader`),
    )
  })

  it(`should call setItem`, async () => {
    const setItemSpy = vi.spyOn(bud.build, `setItem`)

    await sass.register(bud)

    expect(setItemSpy).toHaveBeenCalledWith(
      `sass`,
      expect.objectContaining({
        loader: `sass`,
        options: expect.any(Function),
      }),
    )
  })

  it(`should call setRule`, async () => {
    const setRuleSpy = vi.spyOn(bud.build, `setRule`)

    await sass.register(bud)
    await sass.boot(bud)

    expect(setRuleSpy).toHaveBeenCalledWith(
      `sass`,
      expect.objectContaining({
        include: expect.arrayContaining([expect.any(Function)]),
        test: expect.any(Function),
      }),
    )
  })

  it(`should set postcss syntax`, async () => {
    vi.clearAllMocks()
    postcss.setSyntax(``)
    await sass.register(bud)
    await sass.boot(bud)

    expect(sass.app.postcss.syntax).toEqual(`postcss-scss`)
  })

  it(`should register global when importGlobal is called`, () => {
    const registerGlobalSpy = vi.spyOn(sass, `registerGlobal`)
    sass.importGlobal(`@src/styles/global.scss`)

    expect(registerGlobalSpy).toHaveBeenCalledWith([
      `@import "@src/styles/global.scss";`,
    ])
  })

  it(`should add global to \`additionalData\``, () => {
    sass.set(`additionalData`, undefined)

    sass.registerGlobal(`$foo: rgba(0, 0, 0, 1);`)

    expect(sass.getOption(`additionalData`)).toBe(
      `$foo: rgba(0, 0, 0, 1);`,
    )
    expect(sass.options.additionalData).toBe(`$foo: rgba(0, 0, 0, 1);`)
  })

  it(`should import partials from an array`, () => {
    const code = [
      `$foo: rgba(0, 0, 0, 1);`,
      `$bar: rgba(255, 255, 255, 1);`,
    ]

    sass.set(`additionalData`, undefined)
    sass.registerGlobal(code)

    sass.additionalData

    expect(sass.options.additionalData?.split(`\n`)).toStrictEqual(code)
  })
})
