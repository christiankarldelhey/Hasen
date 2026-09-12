// Quick mobile UI check screenshots → /tmp/hasen-mobile-check/
import { chromium, devices } from 'playwright'
import { mkdirSync } from 'fs'

const BASE = process.argv[2] ?? 'http://localhost:5174'
const OUT = '/tmp/hasen-mobile-check'
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const ctx = await browser.newContext({ ...devices['iPhone 13'], locale: 'es-ES' })
const page = await ctx.newPage()
await page.addInitScript(() => window.localStorage.setItem('hasen.locale', 'es'))

// 1. Lobby (no wood bg expected)
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(800)
await page.screenshot({ path: `${OUT}/1-lobby.png` })

// 2. Board with public cards visible (player_drawing phase)
await page.goto(`${BASE}/dev/mobile-board?phase=player_drawing`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}/2-board-drawing.png` })

// 3. Board in playing phase → open bids sheet
await page.goto(`${BASE}/dev/mobile-board`, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.screenshot({ path: `${OUT}/3-board-playing.png` })

const bidsBtn = page.locator('button', { hasText: /apuestas|bids/i }).first()
if (await bidsBtn.count()) {
  await bidsBtn.click()
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/4-bids-sheet.png` })
  console.log('bids sheet captured')
} else {
  console.log('bids button NOT found — dumping buttons:')
  console.log(await page.locator('button').allTextContents())
}

await browser.close()
console.log('done →', OUT)
