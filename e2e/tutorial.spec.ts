import { expect, test } from '@playwright/test'

test.describe('Tutorial flow', () => {
  test('navigates tutorial steps with next/previous/restart', async ({ page }) => {
    await page.goto('/tutorial/basic-rules')

    const stepTitle = page.getByTestId('tutorial-step-title')
    const stepDescription = page.getByTestId('tutorial-step-description')
    const notification = page.getByTestId('tutorial-notification')

    await expect(page.getByTestId('tutorial-notification')).toBeVisible()
    await expect(notification).toContainText(/1\s*\/\s*8/)

    const firstTitle = await stepTitle.textContent()
    const firstDescription = await stepDescription.textContent()

    await page.getByTestId('tutorial-next-btn').click()
    await expect(notification).toContainText(/2\s*\/\s*8/)
    await expect(stepTitle).not.toHaveText(firstTitle ?? '')
    await expect(stepDescription).not.toHaveText(firstDescription ?? '')

    await page.getByTestId('tutorial-prev-btn').click()
    await expect(notification).toContainText(/1\s*\/\s*8/)
    await expect(stepTitle).toHaveText(firstTitle ?? '')

    await page.getByTestId('tutorial-restart-btn').click()
    await expect(notification).toContainText(/1\s*\/\s*8/)
    await expect(stepTitle).toHaveText(firstTitle ?? '')
  })

  test('shows finish label on last step and returns to first step after finish', async ({ page }) => {
    await page.goto('/tutorial/basic-rules')

    const notification = page.getByTestId('tutorial-notification')
    const nextButton = page.getByTestId('tutorial-next-btn')
    const initialNextLabel = await nextButton.textContent()

    for (let i = 0; i < 7; i += 1) {
      await nextButton.click()
    }

    await expect(notification).toContainText(/8\s*\/\s*8/)
    await expect(nextButton).not.toHaveText(initialNextLabel ?? '')

    await page.getByTestId('tutorial-next-btn').click()

    await expect(notification).toContainText(/1\s*\/\s*8/)
  })
})
