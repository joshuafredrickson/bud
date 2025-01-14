import BudCommand from '@roots/bud/cli/commands'
import axios from '@roots/bud-support/axios'
import {Command, Option} from '@roots/bud-support/clipanion'
import {bind} from '@roots/bud-support/decorators/bind'
import {BudError} from '@roots/bud-support/errors'
import isString from '@roots/bud-support/lodash/isString'
import logger from '@roots/bud-support/logger'
import semver from '@roots/bud-support/semver'
import {isLiteral, isOneOf} from '@roots/bud-support/typanion'
import whichPm from '@roots/bud-support/which-pm'

type Type = `dependencies` | `devDependencies`

/**
 * `bud upgrade` command
 */
export default class BudUpgradeCommand extends BudCommand {
  /**
   * {@link Command.paths}
   */
  public static override paths = [[`upgrade`], [`version`, `set`]]

  /**
   * {@link Command.usage}
   */
  public static override usage = Command.Usage({
    category: `task`,
    description: `Set bud.js version`,
    details: `
      This command will upgrade your bud.js installation to the latest stable version.

      It will upgrade any package that is prefixed with \`@roots/\` or \`bud-\`.

      If a version is specified, the command will upgrade to that version.

      If a private registry is specified, the command will upgrade through that registry.
    `,
    examples: [
      [`Upgrade all bud dependencies to latest`, `$0 upgrade`],
      [
        `Upgrade all bud dependencies to version 6.15.2`,
        `$0 upgrade 6.15.2`,
      ],
      [
        `Upgrade all bud dependencies to version 6.15.2 using yarn v1`,
        `$0 upgrade 6.15.2 --pm yarn-classic`,
      ],
      [
        `Upgrade all bud dependencies to version 6.15.2 using npm and a custom registry`,
        `$0 upgrade 6.15.2 --pm npm --registry http://localhost:4873`,
      ],
    ],
  })

  /**
   * {@link BudCommand.clean}
   */
  public override clean = true

  /**
   * {@link BudCommand.force}
   */
  public override force = true

  /**
   * Package manager option
   */
  public pm = Option.String(`--pm`, undefined, {
    description: `Package manager to use. One of: \`npm\`, \`yarn-classic\`, \`pnpm\` (experimental), or \`yarn\` (experimental)`,
    validator: isOneOf([
      isLiteral(`npm`),
      isLiteral(`pnpm`),
      isLiteral(`yarn`),
      isLiteral(`yarn-classic`),
    ]),
  })

  /**
   * Registry option
   */
  public registry = Option.String(
    `--registry`,
    `https://registry.npmjs.org`,
    {
      description: `custom registry`,
    },
  )

  /**
   * Version option
   */
  public version = Option.String({required: false})

  /**
   * Package manager bin
   */
  public get bin(): `yarn` | `npm` | `pnpm` {
    if (this.pm === `yarn-classic`) {
      return `yarn`
    }

    return this.pm
  }

  /**
   * Package manager subcommand
   */
  public get subcommand(): `add` | `install` {
    return this.pm === `npm` ? `install` : `add`
  }

  /**
   * Index of upgradeable package signifiers
   */
  public upgradeable: {
    dependencies: Array<string>
    devDependencies: Array<string>
  } = {
    dependencies: undefined,
    devDependencies: undefined,
  }

  /**
   * Do registry request
   */
  @bind
  public async doRegistryRequest(uri: string) {
    const request = `${this.registry}/${uri}`
    logger.info(`fielding request`, request)

    const response = await axios
      .get(request)
      .catch((error: Error | string): never => {
        const normalError = BudError.normalize(error)
        normalError.details = `There was a problem requesting data from ${request}`
        normalError.thrownBy = `@roots/bud-support/axios`
        throw normalError
      })

    if (response.status !== 200) {
      const badResponse = BudError.normalize(response.statusText)
      badResponse.details = `There was a problem requesting data from ${request}`
      badResponse.thrownBy = `@roots/bud-support/axios`
      throw badResponse
    }

    logger.info(`registry request data for`, uri, response.data)
    return response.data
  }

  /**
   * {@link Command.execute}
   */
  public override async execute() {
    await this.makeBud().catch(error => {
      logger.warn(`error making bud`, error)
    })
    const basedir = this.bud?.context?.basedir ?? process.cwd()
    logger.log(`using basedir:`, basedir)

    if (!this.pm) {
      await whichPm(basedir)
        .catch(thrownError => {
          const error = BudError.normalize(thrownError)
          error.details = error.message
          error.thrownBy = `@roots/bud-support/which-pm`
          throw error
        })
        .then(pm => {
          if (pm === false) {
            logger.info(`no package manager could be detected.`)
            this.pm = `npm`
            return
          }

          this.pm = pm
        })
        .catch(e => {
          logger.info(`error getting package manager`, `\n`, e)
          this.pm = `npm`
        })
    }
    logger.log(`using package manager:`, this.pm)

    if (this.pm === `yarn`) {
      if (this.registry !== `https://registry.npmjs.org`) {
        logger.warn(
          `Yarn berry does not support custom registries set by CLI. Ignoring --registry flag; set your custom registry in \`.yarnrc.yml\``,
        )
        this.registry = `https://registry.npmjs.org`
      }

      await this.bud.fs.yml
        .read(this.bud.path(`.yarnrc.yml`))
        .then(yarnrc => {
          if (!yarnrc) return

          if (yarnrc[`npmRegistryServer`]) {
            this.registry = yarnrc[`npmRegistryServer`]

            logger.log(
              `registry set to`,
              this.registry,
              `(setting sourced from .yarnrc.yml)`,
            )
          }
        })
        .catch(error => {
          logger.warn(`error reading .yarnrc.yml`, error)
        })
    }
    logger.log(`using registry:`, this.registry)

    if (!isString(this.version)) {
      logger.log(`getting latest version from registry`)
      const data = await this.doRegistryRequest(`@roots/bud/latest`)
      this.version = data?.version
    }
    logger.log(`upgrading to target version:`, this.version)

    /**
     * Upgrade dependencies
     */
    await this.upgrade(`devDependencies`)
    await this.upgrade(`dependencies`)

    /**
     * Handle pnpm hoisting
     */
    if (this.bin === `pnpm`) {
      logger.log(`hoisting installed dependencies with pnpm`)
      await this.$(this.bin, [`install`, `--shamefully-hoist`])
    }
  }

  /**
   * Find relevant signifiers for bud packages
   */
  @bind
  public findCandidates(type: Type): Array<string> {
    const dependencies = this.bud.context.manifest?.[type]
    if (!dependencies) {
      logger.log(`no candidates found in manifest`)
      return []
    }

    const results = Object.entries(dependencies)
      .filter(([signifier, version]: [string, string]) => {
        if (!version || !signifier) return false
        if (version.includes(`workspace:`)) return false

        if (
          signifier.includes(`bud-`) ||
          signifier.includes(`/bud`) ||
          signifier.includes(`@roots/sage`)
        )
          return true

        return false
      })
      .map(([signifier]) => signifier)

    logger.log(`candidates:`, `\n`, results)

    return results
  }

  /**
   * Get upgradeable dependencies and their versions
   * from the registry
   */
  @bind
  public async getUpgradeableDependencies(
    type: Type,
  ): Promise<Array<string>> {
    if (typeof this.upgradeable[type] !== `undefined`) {
      logger.log(
        `using cached results for`,
        type,
        `\n`,
        this.upgradeable[type],
      )
      return this.upgradeable[type]
    }
    this.upgradeable[type] = []

    /**
     * Add `@roots/*` packages to upgradeable dependencies
     */
    logger.log(`finding upgradeable @roots packages in`, type, `...`)
    this.findCandidates(type)
      .filter(signifier => signifier.startsWith(`@roots/`))
      .map(signifier => `${signifier}@${this.version}`)
      .forEach(signifier => {
        logger.log(`adding`, signifier, `to upgradeable`, type)
        this.upgradeable[type].push(signifier)
      })

    /**
     * Add non-`@roots/*` packages to upgradeable dependencies
     * and try to find a compatible version in the registry
     */
    logger.log(`finding upgradeable community packages in`, type, `...`)
    const communityDependencies = this.findCandidates(type).filter(
      signifier => !signifier.startsWith(`@roots/`),
    )
    logger.log(`found community dependencies`, communityDependencies)
    await Promise.all(
      communityDependencies.map(async signifier => {
        const {versions} = await this.doRegistryRequest(signifier)
        const manifests = Object.values(versions).reverse()

        /**
         * Find the first version that satisfies the semver range
         */
        const match: {version?: string} = manifests.find(
          ({
            bud,
            version,
          }: {
            bud?: {version?: string}
            version: string
          }) => {
            // no specific version requested
            if (!bud?.version) return false

            const satisfies = semver.satisfies(this.version, bud.version)
            if (satisfies) {
              signifier = `${signifier}@${version}`
              logger.log(`adding`, signifier, `to upgradeable`, type)
              this.upgradeable[type].push(signifier)
            }

            return satisfies
          },
        )
        /**
         * If no compatible version is found
         * add the latest version to the upgradeable list
         */
        if (!match) {
          logger.warn(
            `No version of ${signifier} found which is compatible with ${this.version}. Installing ${signifier}@latest.`,
          )
          this.upgradeable[type].push(`${signifier}@latest`)
          return
        }
      }),
    ).catch(error => {
      logger.warn(`error getting upgradeable`, type, `\n`, error)
    })

    logger.log(
      `discovered upgradeable`,
      type,
      `:\n`,
      this.upgradeable[type],
    )
    return this.upgradeable[type]
  }

  @bind
  public async upgrade(type: Type, flags = []) {
    const signifiers = await this.getUpgradeableDependencies(type)
    if (!signifiers?.length) {
      logger.log(`No`, type, `to upgrade`)
      return
    }

    if (type === `devDependencies`)
      switch (this.pm) {
        case `npm`:
          flags.push(`--save-dev`)
          break

        case `pnpm`:
          flags.push(`--save-dev`)
          break

        default:
          flags.push(`--dev`)
          break
      }

    if (type === `dependencies`)
      switch (this.pm) {
        case `npm`:
          flags.push(`--save`)
          break

        case `pnpm`:
          flags.push(`--save-prod`)
          break

        default:
          break
      }

    if (
      this.pm !== `yarn` &&
      this.registry !== `https://registry.npmjs.org`
    ) {
      flags.push(`--registry`, this.registry)
    }

    logger.log(this.bin, this.subcommand, ...signifiers, ...flags)

    await this.$(this.bin, [
      this.subcommand,
      ...signifiers,
      ...flags,
    ], undefined, () => {}).catch(error => {
      logger.error(error)
    })
  }
}
