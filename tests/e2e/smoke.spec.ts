import { expect, test } from '@playwright/test'

test('home page renders with brand tokens', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('World Cup Sweepstake')

  // Primary CTA exists on screen
  const cta = page.getByTestId('cta-primary')
  await expect(cta).toBeVisible()
  await expect(cta).toHaveText('Sign in with Slack')

  // Sample card shows a team name and a success-tone status chip
  const card = page.getByTestId('card-sample')
  await expect(card).toContainText('Brazil')
  await expect(card.getByText('Through')).toBeVisible()

  // Dark background is applied (RGB form is stable across Tailwind versions)
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(10, 10, 10)')

  // Mono font wired up — score uses Geist Mono
  await expect(card.getByText('2 — 1')).toHaveCSS('font-family', /Geist Mono/)
})
