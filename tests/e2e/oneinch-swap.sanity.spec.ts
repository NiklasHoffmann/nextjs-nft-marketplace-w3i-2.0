import { test, expect, Page, Locator } from '@playwright/test';

interface FlowScenario {
  url?: string;
  sourceSymbol: string;
  destinationSymbol: string;
}

const scenarios = {
  ethToToken: {
    buyNow: {
      url: process.env.E2E_ONEINCH_ETH_TO_TOKEN_BUYNOW_URL,
      sourceSymbol: process.env.E2E_ONEINCH_ETH_TO_TOKEN_SOURCE || 'ETH',
      destinationSymbol: process.env.E2E_ONEINCH_ETH_TO_TOKEN_DEST || 'USDC',
    } satisfies FlowScenario,
    cart: {
      url: process.env.E2E_ONEINCH_ETH_TO_TOKEN_CART_URL,
      sourceSymbol: process.env.E2E_ONEINCH_ETH_TO_TOKEN_SOURCE || 'ETH',
      destinationSymbol: process.env.E2E_ONEINCH_ETH_TO_TOKEN_DEST || 'USDC',
    } satisfies FlowScenario,
  },
  tokenToEth: {
    buyNow: {
      url: process.env.E2E_ONEINCH_TOKEN_TO_ETH_BUYNOW_URL,
      sourceSymbol: process.env.E2E_ONEINCH_TOKEN_TO_ETH_SOURCE || 'USDC',
      destinationSymbol: process.env.E2E_ONEINCH_TOKEN_TO_ETH_DEST || 'ETH',
    } satisfies FlowScenario,
    cart: {
      url: process.env.E2E_ONEINCH_TOKEN_TO_ETH_CART_URL,
      sourceSymbol: process.env.E2E_ONEINCH_TOKEN_TO_ETH_SOURCE || 'USDC',
      destinationSymbol: process.env.E2E_ONEINCH_TOKEN_TO_ETH_DEST || 'ETH',
    } satisfies FlowScenario,
  },
  tokenToToken: {
    buyNow: {
      url: process.env.E2E_ONEINCH_TOKEN_TO_TOKEN_BUYNOW_URL,
      sourceSymbol: process.env.E2E_ONEINCH_TOKEN_TO_TOKEN_SOURCE || 'DAI',
      destinationSymbol: process.env.E2E_ONEINCH_TOKEN_TO_TOKEN_DEST || 'USDT',
    } satisfies FlowScenario,
    cart: {
      url: process.env.E2E_ONEINCH_TOKEN_TO_TOKEN_CART_URL,
      sourceSymbol: process.env.E2E_ONEINCH_TOKEN_TO_TOKEN_SOURCE || 'DAI',
      destinationSymbol: process.env.E2E_ONEINCH_TOKEN_TO_TOKEN_DEST || 'USDT',
    } satisfies FlowScenario,
  },
};

function requireScenarioUrl(url: string | undefined, testName: string): string {
  test.skip(!url, `Set URL env for scenario: ${testName}`);
  return url || '/';
}

async function ensureBuyNowModalOpen(page: Page): Promise<Locator> {
  const swapPanel = page.locator('div').filter({ hasText: '1inch Swap Preparation' }).first();
  if (await swapPanel.isVisible()) {
    return swapPanel;
  }

  const buyNowButton = page.getByRole('button', { name: /buy now|complete purchase/i }).first();
  await expect(buyNowButton).toBeVisible({ timeout: 30_000 });
  await buyNowButton.click();

  await expect(swapPanel).toBeVisible({ timeout: 30_000 });
  return swapPanel;
}

async function assertSourceSelectable(container: Locator, sourceSymbol: string): Promise<void> {
  const select = container.locator('select').first();
  await expect(select).toBeVisible();

  await select.selectOption({ label: sourceSymbol });
  await expect(select).toHaveValue(/0x[a-fA-F0-9]{40}|0x0000000000000000000000000000000000000000/);

  await expect(container).toContainText(sourceSymbol);
}

test.describe('1inch swap sanity (manual-wallet aware)', () => {
  test('BuyNow: ETH -> Token controls and route are available', async ({ page }) => {
    const scenario = scenarios.ethToToken.buyNow;
    const url = requireScenarioUrl(scenario.url, 'E2E_ONEINCH_ETH_TO_TOKEN_BUYNOW_URL');

    await page.goto(url);
    const panel = await ensureBuyNowModalOpen(page);

    await assertSourceSelectable(panel, scenario.sourceSymbol);
    await expect(panel).toContainText(new RegExp(scenario.destinationSymbol, 'i'));
    await expect(panel.getByRole('button', { name: /swap & continue|swap not required/i })).toBeVisible();
  });

  test('BuyNow: Token -> ETH controls and route are available', async ({ page }) => {
    const scenario = scenarios.tokenToEth.buyNow;
    const url = requireScenarioUrl(scenario.url, 'E2E_ONEINCH_TOKEN_TO_ETH_BUYNOW_URL');

    await page.goto(url);
    const panel = await ensureBuyNowModalOpen(page);

    await assertSourceSelectable(panel, scenario.sourceSymbol);
    await expect(panel).toContainText(new RegExp(scenario.destinationSymbol, 'i'));
    await expect(panel.getByRole('button', { name: /swap & continue|swap not required/i })).toBeVisible();
  });

  test('BuyNow: Token -> Token controls and route are available', async ({ page }) => {
    const scenario = scenarios.tokenToToken.buyNow;
    const url = requireScenarioUrl(scenario.url, 'E2E_ONEINCH_TOKEN_TO_TOKEN_BUYNOW_URL');

    await page.goto(url);
    const panel = await ensureBuyNowModalOpen(page);

    await assertSourceSelectable(panel, scenario.sourceSymbol);
    await expect(panel).toContainText(new RegExp(scenario.destinationSymbol, 'i'));
    await expect(panel.getByRole('button', { name: /swap & continue|swap not required/i })).toBeVisible();
  });

  test('Cart: ETH -> Token row is configurable', async ({ page }) => {
    const scenario = scenarios.ethToToken.cart;
    const url = requireScenarioUrl(scenario.url, 'E2E_ONEINCH_ETH_TO_TOKEN_CART_URL');

    await page.goto(url);
    const prepPanel = page.locator('div').filter({ hasText: '1inch Payment Preparation' }).first();
    await expect(prepPanel).toBeVisible({ timeout: 30_000 });

    const row = prepPanel.locator('div').filter({ hasText: new RegExp(`Paying with\\s+${scenario.destinationSymbol}`, 'i') }).first();
    await expect(row).toBeVisible();

    await assertSourceSelectable(row, scenario.sourceSymbol);
    await expect(row.getByRole('button', { name: /swap & continue|swap not required|processing/i })).toBeVisible();
  });

  test('Cart: Token -> ETH row is configurable', async ({ page }) => {
    const scenario = scenarios.tokenToEth.cart;
    const url = requireScenarioUrl(scenario.url, 'E2E_ONEINCH_TOKEN_TO_ETH_CART_URL');

    await page.goto(url);
    const prepPanel = page.locator('div').filter({ hasText: '1inch Payment Preparation' }).first();
    await expect(prepPanel).toBeVisible({ timeout: 30_000 });

    const row = prepPanel.locator('div').filter({ hasText: new RegExp(`Paying with\\s+${scenario.destinationSymbol}`, 'i') }).first();
    await expect(row).toBeVisible();

    await assertSourceSelectable(row, scenario.sourceSymbol);
    await expect(row.getByRole('button', { name: /swap & continue|swap not required|processing/i })).toBeVisible();
  });

  test('Cart: Token -> Token row is configurable', async ({ page }) => {
    const scenario = scenarios.tokenToToken.cart;
    const url = requireScenarioUrl(scenario.url, 'E2E_ONEINCH_TOKEN_TO_TOKEN_CART_URL');

    await page.goto(url);
    const prepPanel = page.locator('div').filter({ hasText: '1inch Payment Preparation' }).first();
    await expect(prepPanel).toBeVisible({ timeout: 30_000 });

    const row = prepPanel.locator('div').filter({ hasText: new RegExp(`Paying with\\s+${scenario.destinationSymbol}`, 'i') }).first();
    await expect(row).toBeVisible();

    await assertSourceSelectable(row, scenario.sourceSymbol);
    await expect(row.getByRole('button', { name: /swap & continue|swap not required|processing/i })).toBeVisible();
  });
});
