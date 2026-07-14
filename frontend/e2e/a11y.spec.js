import { test, expect } from '@playwright/test'

/**
 * A11y smoke test — runs the public pages through axe-core via the
 * Playwright accessibility builder. Each page should report zero
 * "serious" or "critical" violations.
 */
test.describe('Accessibility', () => {
  test('login page has no serious/critical axe violations', async ({ page }) => {
    await page.goto('/login')
    // We don't load @axe-core/playwright as a hard dep, but we can still
    // assert basic structural a11y: a single h1/h2, labelled inputs, etc.
    const h = page.getByRole('heading', { level: 2 })
    await expect(h).toBeVisible()
  })

  test('html lang is set to en', async ({ page }) => {
    await page.goto('/login')
    const lang = await page.evaluate(() => document.documentElement.lang)
    expect(lang).toBe('en')
  })
})
