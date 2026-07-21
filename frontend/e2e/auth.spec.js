import { test, expect } from '@playwright/test'

test.describe('Auth pages', () => {
  test('login page renders and has accessible form controls', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('signup link navigates to signup page', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: /sign up for free/i }).click()
    await expect(page).toHaveURL(/\/signup$/)
  })

  test('forgot password link navigates to forgot-password', async ({ page }) => {
    await page.goto('/login')
    await page.getByRole('link', { name: /forgot password/i }).click()
    await expect(page).toHaveURL(/\/forgot-password$/)
  })

  test('protected route redirects guest to login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login$/)
  })

  test('skip-to-content link is keyboard-accessible', async ({ page }) => {
    await page.goto('/login')
    await page.keyboard.press('Tab')

    const focused = await page.evaluate(() => document.activeElement?.textContent)
    expect(focused).toMatch(/skip to main content/i)
  })
})
