// Deprecated: kept for backwards compatibility.
// Canonical event definitions live in GameEvents.ts.
export {
  createCardPlayedEvent,
  createCardReplacedPrivateEvent,
  createBidPlacedEvent,
  createCardReplacementSkippedEvent,
  createCardReplacementCompletedEvent
} from './GameEvents.js'

export type {
  CardPlayedEvent,
  CardReplacedPrivateEvent,
  BidPlacedEvent,
  CardReplacementSkippedEvent,
  CardReplacementCompletedEvent
} from './GameEvents.js'

export type PlayerEvent =
  | import('./GameEvents.js').CardPlayedEvent
  | import('./GameEvents.js').CardReplacedPrivateEvent
  | import('./GameEvents.js').BidPlacedEvent
  | import('./GameEvents.js').CardReplacementSkippedEvent
  | import('./GameEvents.js').CardReplacementCompletedEvent