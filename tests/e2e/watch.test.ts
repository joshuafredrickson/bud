/* eslint-disable no-console */
import { ExecaReturnValue } from 'execa'
import fs from 'fs-jetpack'
import {Browser, chromium, Page} from 'playwright'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import {destinationPath} from './util/copy'
import {e2eBeforeAll, runDev} from './util/install'

declare global {
  interface Window {
    bud: any
    reloadCalled: boolean
  }
}

describe(`bud.watch functionality`, () => {
  let browser: Browser
  let page: Page
  let port: number

  beforeEach(async () => {
    port = await e2eBeforeAll(`watch`)
    runDev(`watch`, port)

    browser = await chromium.launch({
      headless: !!process.env.CI,
    })
    if (!browser) throw new Error(`Browser could not be launched`)

    page = await browser.newPage()
    if (!page) throw new Error(`Page could not be created`)

    await page.waitForTimeout(5000)
  })

  it(`reloads on change`, async () => {
    await page.goto(`http://0.0.0.0:${port}/`)

    await page.evaluate(() => {
      window.reloadCalled = false
      window.bud.reload = () => {
        window.reloadCalled = true
      }
    })

    await fs.writeAsync(
      destinationPath(`watch`, `watched`, `foo.html`),
      `foo`,
    )

    await page.waitForTimeout(12000)

    expect(
      await page.evaluate(() => window.reloadCalled),
    ).toBe(true)

    await page.close()
    await browser.close()
  })
})
