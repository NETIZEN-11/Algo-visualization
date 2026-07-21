import { test, expect } from '@playwright/test'

test.describe('Accessibility', () => {
  test('login page has no serious/critical axe violations', async ({ page }) => {
    await page.goto('/login')

    const h = page.getByRole('heading', { level: 2 })
    await expect(h).toBeVisible()
  })

  test('html lang is set to en', async ({ page }) => {
    await page.goto('/login')
    const lang = await page.evaluate(() => document.documentElement.lang)
    expect(lang).toBe('en')
  })
})
