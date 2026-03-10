import { expect, test } from '@playwright/test'

test.describe('Tutorial flow', () => {
  test('navigates tutorial steps with next/previous/restart', async ({ page }) => {
    await page.goto('/tutorial/basic-rules')

    await expect(page.getByTestId('tutorial-notification')).toBeVisible()
    await expect(page.getByText('Step 1 / 8')).toBeVisible()
    await expect(page.getByTestId('tutorial-step-title')).toHaveText('The deck')

    await page.getByTestId('tutorial-next-btn').click()
    await expect(page.getByText('Step 2 / 8')).toBeVisible()
    await expect(page.getByTestId('tutorial-step-title')).toHaveText('Your play area')

    await page.getByTestId('tutorial-prev-btn').click()
    await expect(page.getByText('Step 1 / 8')).toBeVisible()
    await expect(page.getByTestId('tutorial-step-title')).toHaveText('The deck')

    await page.getByTestId('tutorial-restart-btn').click()
    await expect(page.getByText('Step 1 / 8')).toBeVisible()
    await expect(page.getByTestId('tutorial-step-title')).toHaveText('The deck')
  })

  test('shows finish label on last step and returns to first step after finish', async ({ page }) => {
    await page.goto('/tutorial/basic-rules')

    const nextButton = page.getByTestId('tutorial-next-btn')
    for (let i = 0; i < 7; i += 1) {
      await nextButton.click()
    }

    await expect(page.getByText('Step 8 / 8')).toBeVisible()
    await expect(page.getByTestId('tutorial-next-btn')).toHaveText('Finish')

    await page.getByTestId('tutorial-next-btn').click()

    await expect(page.getByText('Step 1 / 8')).toBeVisible()
    await expect(page.getByTestId('tutorial-step-title')).toHaveText('The deck')
  })
})
