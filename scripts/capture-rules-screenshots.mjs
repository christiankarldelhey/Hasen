// Captures screenshots of the game UI for the rules docs.
// Uses the tutorial route, which renders the real board with mock state (no backend needed).
//
// Usage: node scripts/capture-rules-screenshots.mjs [baseUrl]
//   default baseUrl: http://localhost:5173 (expects `npm run dev` running)

import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const BASE = process.argv[2] ?? 'http://localhost:5173'
const LOCALE = process.env.LOCALE ?? 'es'
const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), `../frontend/public/rules/${LOCALE}`)
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.addInitScript(locale => window.localStorage.setItem('hasen.locale', locale), LOCALE)

// ?bare=1 renders the board full-size, without the tutorial sidebar/highlights.
// &state=full-board renders the demo snapshot covering every zone we capture.
await page.goto(`${BASE}/tutorial/first-round?bare=1&state=full-board`, { waitUntil: 'networkidle' })

// Let sprites/animations settle
await page.waitForTimeout(1800)

const elements = [
  ['available-bids', 'bids-panel.png'],
  ['trick-center', 'trick.png'],
  ['player-hand', 'player-hand.png'],
  ['player-round-score', 'round-score.png'],
  ['game-scores', 'game-scores.png'],
  ['deck-zone', 'deck-zone.png'],
  ['other-players-zone', 'opponent.png'],
  ['game-controls', 'game-controls.png']
]

for (const [id, name] of elements) {
  const el = page.locator(`[data-tutorial-id="${id}"]`).first()
  if (await el.count()) {
    await el.screenshot({ path: path.join(OUT, name) })
    console.log(`✓ ${name}`)
  } else {
    console.log(`✗ ${name} — element [data-tutorial-id="${id}"] not found`)
  }
}

await page.screenshot({ path: path.join(OUT, 'board-overview.png') })
console.log('✓ board-overview.png')

await browser.close()
console.log(`Done → ${OUT}`)
