import type {Bud} from '@roots/bud-framework/bud'
import figures from 'figures'
import {Box, Text} from 'ink'
import Link from 'ink-link'
import {isString} from 'lodash-es'
import {networkInterfaces} from 'node:os'
import React from 'react'

import * as theme from './format.js'

const external = Object.values(networkInterfaces())
  .flat()
  .find(i => i?.family === `IPv4` && !i?.internal)?.address

const formatUrl = (host: string, protocol: string, port: string) =>
  `${protocol}//${host === `0.0.0.0` ? `localhost` : host}${
    !isString(port) || [``, `80`, `8080`].includes(port) ? `` : `:${port}`
  }`

const getServer = (app: Bud) => {
  const {protocol, port, hostname: internal} = app.server.connection.url

  return {
    internal: formatUrl(internal, protocol, port),
    external: formatUrl(external, protocol, port),
  }
}

const getProxy = (app: Bud) => {
  const proxy = app.hooks.filter(`dev.middleware.proxy.target`)
  if (!proxy) return false

  return formatUrl(proxy.hostname, proxy.protocol, proxy.port)
}

export const Server = ({app}: {app: Bud}) => {
  const server = getServer(app)
  const proxy = getProxy(app)

  return (
    <Box flexDirection="column">
      <Box flexDirection="row">
        <Text color={theme.color.cyan}>{figures.info} dev</Text>
      </Box>

      <Text dimColor>{figures.lineVerticalDashed7}</Text>

      {proxy && (
        <Box flexDirection="row">
          <Box marginRight={1}>
            <Text dimColor>├─ proxying:</Text>
          </Box>

          <Box>
            {/* @ts-ignore */}
            <Link url={proxy}>
              <Text>{proxy}</Text>
            </Link>
          </Box>
        </Box>
      )}

      <Box flexDirection="row">
        <Box marginRight={1}>
          <Text dimColor>├─ internal:</Text>
        </Box>

        <Box>
          {/* @ts-ignore */}
          <Link url={server.internal}>
            <Text>{server.internal}</Text>
          </Link>
        </Box>
      </Box>

      <Box flexDirection="row">
        <Box marginRight={1}>
          <Text dimColor>└─ external:</Text>
        </Box>
        <Box>
          {/* @ts-ignore */}
          <Link url={server.external}>
            <Text>{server.external}</Text>
          </Link>
        </Box>
      </Box>

      <Box
        marginTop={1}
        minWidth="100%"
        flexDirection="row"
        justifyContent="space-between"
      >
        <Text>
          {figures.ellipsis} watching project sources
          {app.server.watcher?.files?.size > 0 && (
            <Text dimColor>
              {` `}
              (and {app.server.watcher.files.size} other{` `}
              {app.server.watcher.files.size > 1 ? `files` : `file`}){` `}
            </Text>
          )}
        </Text>
        <Text>
          {figures.info} <Text dimColor>ctrl+c to exit</Text>
        </Text>
      </Box>
    </Box>
  )
}