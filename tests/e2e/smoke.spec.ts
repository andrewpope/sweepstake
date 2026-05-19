import { expect, test } from '@playwright/test'

test('home page renders with brand tokens', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveTitle('World Cup Sweepstake')

  // Sample card shows a team name and a success-tone status chip
  const card = page.getByTestId('card-sample')
  await expect(card).toContainText('Brazil')
  await expect(card.getByText('Through')).toBeVisible()

  // Dark background is applied
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(10, 10, 10)')

  // Mono font wired up — score uses Geist Mono
  await expect(card.getByText('2 — 1')).toHaveCSS('font-family', /Geist Mono/)

  // Header shows Sign in (signed-out state)
  await expect(page.getByTestId('header-sign-in')).toBeVisible()
})

test('login page exposes only Slack auth', async ({ page }) => {
  await page.goto('/login')

  const cta = page.getByTestId('sign-in-slack')
  await expect(cta).toBeVisible()
  await expect(cta).toContainText(/Sign in with Slack/i)

  // No other auth method exposed: no email input, no Google/Apple/etc buttons.
  await expect(page.locator('input[type="email"]')).toHaveCount(0)
  await expect(page.locator('input[type="password"]')).toHaveCount(0)
  await expect(page.getByText(/google|apple|github|magic link/i)).toHaveCount(0)
})
