import { expect, test } from '@playwright/test'

test.describe('Lobby navigation', () => {
  test('shows all lobby entrypoints in main menu', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('lobby-menu')).toBeVisible()
    await expect(page.getByTestId('lobby-view-menu')).toBeVisible()

    await expect(page.getByTestId('lobby-create-game-btn')).toBeVisible()
    await expect(page.getByTestId('lobby-join-game-btn')).toBeVisible()
    await expect(page.getByTestId('lobby-tutorial-btn')).toBeVisible()
    await expect(page.getByTestId('lobby-rules-btn')).toBeVisible()
    await expect(page.getByTestId('lobby-settings-btn')).toBeVisible()
  })

  test('opens tutorial from lobby menu', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('lobby-menu')).toBeVisible()
    await expect(page.getByTestId('lobby-options')).toBeVisible()

    await expect(page.getByTestId('lobby-tutorial-btn')).toBeVisible()
    await page.getByTestId('lobby-tutorial-btn').locator('button').click({ force: true })

    await expect(page).toHaveURL(/\/tutorial(?:\/|$)/)
    await expect(page.getByTestId('tutorial-notification')).toBeVisible()
    await expect(page.getByTestId('tutorial-step-title')).toHaveText('The deck')
  })

})
