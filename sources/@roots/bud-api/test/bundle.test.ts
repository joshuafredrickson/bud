import {factory} from '@repo/test-kit'
import '@roots/bud-api'
import {bundle} from '@roots/bud-api/methods/bundle'
import {beforeEach, describe, expect, it} from 'vitest'

describe(`bud.bundle`, () => {
  let bud
  let instance: typeof bundle

  beforeEach(async () => {
    bud = await factory()
    instance = bundle.bind(bud)
  })

  it(`should set the bundle using a string`, async () => {
    await instance(`react`).promise()

    expect(
      bud.hooks.filter(`build.optimization.splitChunks`),
    ).toMatchSnapshot()
  })

  it(`should set the bundle using a string name and a string test`, async () => {
    await instance(`react`, `react`).promise()

    expect(
      bud.hooks.filter(`build.optimization.splitChunks`),
    ).toMatchSnapshot()
  })

  it(`should set the bundle using a string name and regular expression test`, async () => {
    await instance(`react`, /react/).promise()

    expect(
      bud.hooks.filter(`build.optimization.splitChunks`),
    ).toMatchSnapshot()
  })

  it(`should set the bundle using a string name and array of strings test`, async () => {
    await instance(`react`, [`react`, `react-dom`]).promise()

    expect(
      bud.hooks.filter(`build.optimization.splitChunks`),
    ).toMatchSnapshot()
  })
})
