import type * as Build from './build.js'
import type * as Dev from './dev.js'
import type * as Events from './events.js'
import type * as Flags from './flags.js'
import type * as Locations from './locations.js'
import type * as Modules from './modules.js'
import type * as Patterns from './patterns.js'
import type * as Values from './values.js'

interface SyncRegistry
  extends Build.SyncRegistry,
    Dev.SyncRegistry,
    Flags.SyncRegistry,
    Locations.SyncRegistry,
    Patterns.SyncRegistry,
    Values.SyncRegistry {}

type SyncCallback = {
  [K in keyof SyncRegistry as `${K & string}`]?:
    | ((current?: SyncRegistry[K]) => SyncRegistry[K])
    | SyncRegistry[K]
}

type SyncStore = {
  [K in keyof SyncRegistry as `${K & string}`]?: Array<
    (current?: SyncRegistry[K]) => SyncRegistry[K]
  >
}

type Async = Build.Async
type AsyncRegistry = Build.AsyncRegistry

type AsyncCallback = {
  [K in keyof AsyncRegistry as `${K & string}`]?:
    | ((current?: AsyncRegistry[K]) => Promise<AsyncRegistry[K]>)
    | AsyncRegistry[K]
}

type AsyncStore = {
  [K in keyof AsyncRegistry as `${K & string}`]?: Array<AsyncCallback>
}

type EventsStore = {
  [K in keyof Events.Registry as `${K & string}`]?: Array<
    Events.Registry[K]
  >
}

type Store = SyncStore & AsyncStore & EventsStore

export type {
  Async,
  AsyncCallback,
  AsyncRegistry,
  AsyncStore,
  Build,
  Dev,
  Events,
  EventsStore,
  Flags,
  Locations,
  Modules,
  Patterns,
  Store,
  SyncCallback,
  SyncRegistry,
  SyncStore,
  Values,
}