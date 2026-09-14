import { expect, test } from '@playwright/test'

test.describe('Tutorial menu', () => {
  test('shows the scenario selector and navigates to the tutorial', async ({ page }) => {
    await page.goto('/tutorial')

    await expect(page.getByTestId('tutorial-menu')).toBeVisible()

    await page.getByTestId('tutorial-scenario-first-round').click()
    await expect(page).toHaveURL(/\/tutorial\/first-round/)
    await expect(page.getByTestId('tutorial-sidebar')).toBeVisible()
  })
})

test.describe('Tutorial flow', () => {
  test('navigates tutorial steps with next/previous/restart', async ({ page }) => {
    await page.goto('/tutorial/first-round')

    const stepTitle = page.getByTestId('tutorial-step-title')
    const stepDescription = page.getByTestId('tutorial-step-description')
    const sidebar = page.getByTestId('tutorial-sidebar')
    const nextButton = page.getByTestId('tutorial-next-btn')

    await expect(sidebar).toBeVisible()
    await expect(sidebar).toContainText(/1\s*\/\s*49/)

    const firstTitle = await stepTitle.textContent()
    const firstDescription = await stepDescription.textContent()

    await nextButton.click()
    await expect(sidebar).toContainText(/2\s*\/\s*49/)
    await expect(stepTitle).not.toHaveText(firstTitle ?? '')
    await expect(stepDescription).not.toHaveText(firstDescription ?? '')

    await page.getByTestId('tutorial-prev-btn').click()
    await expect(sidebar).toContainText(/1\s*\/\s*49/)
    await expect(stepTitle).toHaveText(firstTitle ?? '')

    await page.getByTestId('tutorial-restart-btn').click()
    await expect(sidebar).toContainText(/1\s*\/\s*49/)
    await expect(stepTitle).toHaveText(firstTitle ?? '')
  })

  test('exit button returns to the scenario menu', async ({ page }) => {
    await page.goto('/tutorial/first-round')

    await expect(page.getByTestId('tutorial-sidebar')).toBeVisible()
    await page.getByTestId('tutorial-exit-btn').click()

    await expect(page).toHaveURL(/\/tutorial$/)
    await expect(page.getByTestId('tutorial-menu')).toBeVisible()
  })
})

test.describe('Interactive tutorial', () => {
  test('requires the scripted action to advance and accepts the right card', async ({ page }) => {
    await page.goto('/tutorial/first-round')

    const sidebar = page.getByTestId('tutorial-sidebar')
    const nextButton = page.getByTestId('tutorial-next-btn')

    // intro → yourHand → swap (action step)
    await nextButton.click()
    await nextButton.click()
    await expect(sidebar).toContainText(/3\s*\/\s*49/)
    await expect(page.getByTestId('tutorial-action-badge')).toBeVisible()
    await expect(nextButton).toBeDisabled()

    // "Do it for me" performs the action
    await page.getByTestId('tutorial-skip-btn').click()
    await expect(sidebar).toContainText(/4\s*\/\s*49/)
    await expect(nextButton).toBeEnabled()

    // bet step: wrong input shows a hint; the right action advances
    await nextButton.click()
    await expect(sidebar).toContainText(/5\s*\/\s*49/)
    await page.getByTestId('tutorial-skip-btn').click()

    // playOber: wrong card → hint; right card → advance
    await expect(sidebar).toContainText(/6\s*\/\s*49/)
    const hand = page.locator('[data-tutorial-id="player-hand"]')
    await hand.locator('[data-testid="player-card-script-player_1-acorns-9"]').click()
    await expect(page.getByTestId('tutorial-hint')).toBeVisible()
    await expect(sidebar).toContainText(/6\s*\/\s*49/)

    await hand.locator('[data-testid="player-card-script-player_1-acorns-O"]').click()
    await expect(sidebar).toContainText(/7\s*\/\s*49/)
  })
})
