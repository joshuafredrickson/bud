import {CommandClass, Option} from 'clipanion'
import {copy} from 'fs-extra'
import {bind} from 'helpful-decorators'

import {
  INTEGRATION_MOCKS_PATH,
  INTEGRATION_TESTS,
  REGISTRY_PROXY,
} from '../constants'
import {Command} from './base.command'

/**
 * Default jest flags
 *
 * @internal
 */
const DEFAULT_JEST_FLAGS = `--config ./config/jest.config.js`

/**
 * Run tests
 *
 * @internal
 */
export class Test extends Command {
  /**
   * Command name
   *
   * @internal
   */
  public name = `test`

  /**
   * Command paths
   *
   * @internal
   */
  public static paths: CommandClass['paths'] = [[`@bud`, `test`]]

  /**
   * Command usage
   *
   * @internal
   */
  public static usage: CommandClass['usage'] = {
    category: `@bud`,
    description: `run unit and integration tests`,
    details: `
    The first positional argument is required and should be one of: 'all', 'unit', or 'integration', depending on what you want to run.
    You may add any jest flags to the command following that positional.
  `,
    examples: [
      [`@bud test all`, `run all tests`],
      [`@bud test unit`, `run unit tests`],
      [`@bud test integration`, `run integration tests`],
      [
        `@bud test integration/sage`,
        `run integration test on mock sage project`,
      ],
      [
        `@bud test integration --verbose`,
        `run integration tests with jest verbose flag`,
      ],
      [
        `@bud test integration --coverage --verbose`,
        `run integration tests with jest coverage and verbose flags`,
      ],
    ],
  }

  /**
   * Match
   *
   * @internal
   */
  public match = Option.String({
    name: `test matcher`,
  })

  /**
   * Variadic arguments
   *
   * @internal
   */
  public passthrough = Option.Proxy({name: `jest params`})

  /**
   * True if setup script should be run
   *
   * @internal
   */
  public get shouldSetup(): boolean {
    return this.match === 'all' || this.match.includes('integration')
  }

  /**
   * Returns base jest command with match argument and
   * default flags applied
   *
   * @internal
   */
  public get jestBase(): string {
    return this.match === 'all'
      ? `yarn jest ${DEFAULT_JEST_FLAGS}`
      : `yarn jest ${this.match} ${DEFAULT_JEST_FLAGS}`
  }

  /**
   * Execute command
   *
   * @internal
   */
  public async execute() {
    if (this.shouldSetup) {
      await copy(`./examples`, `${INTEGRATION_MOCKS_PATH}/npm`)
      await copy(`./examples`, `${INTEGRATION_MOCKS_PATH}/yarn`)

      await INTEGRATION_TESTS.reduce(this.install, Promise.resolve())
      await Promise.all(INTEGRATION_TESTS.map(this.build))
    }

    return await this.$(this.withPassthrough(this.jestBase))
  }

  /**
   * Install an integration test
   *
   * @param example
   *
   * @internal
   */
  @bind
  public async install(
    promised: Promise<any>,
    example: typeof INTEGRATION_TESTS & string,
  ) {
    await promised

    await this.$(
      `cd ${INTEGRATION_MOCKS_PATH}/yarn/${example} && yarn install --registry ${REGISTRY_PROXY}`,
    )
    await this.$(
      `cd ${INTEGRATION_MOCKS_PATH}/npm/${example} && npm install --registry ${REGISTRY_PROXY}`,
    )
  }

  /**
   * Build an integration test
   *
   * @param example
   *
   * @internal
   */
  @bind
  public async build(example: typeof INTEGRATION_TESTS & string) {
    await this.$(
      `cd ${INTEGRATION_MOCKS_PATH}/yarn/${example} && yarn bud build --no-dashboard --log`,
    )
    await this.$(
      `cd ${INTEGRATION_MOCKS_PATH}/npm/${example} && npx bud build --no-dashboard --log`,
    )
  }
}