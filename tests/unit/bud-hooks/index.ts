import {Hooks} from '@roots/bud-hooks'

import {Bud, Framework, setupBud, teardownBud} from '../../util'

describe('@roots/bud-hooks', function () {
  let bud: Framework
  let hooks: Hooks

  beforeAll(() => {
    bud = setupBud('development')
  })

  afterAll(() => {
    bud = teardownBud(bud)
  })

  it('is constructable', () => {
    hooks = new Hooks(bud)

    expect(hooks.app).toBeInstanceOf(Bud)
  })

  it('has an on method', () => {
    expect(hooks.on).toBeInstanceOf(Function)
  })

  it('has a filter method', () => {
    expect(hooks.filter).toBeInstanceOf(Function)
  })

  it('registers a hook', () => {
    const cb = () => 'bar'
    hooks.on('build', cb)
    expect(hooks.repository.build).toStrictEqual([cb])
  })

  it('returns expected value when filtering hook', () => {
    expect(hooks.filter('build')).toBe('bar')
  })
})