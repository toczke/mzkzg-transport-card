const { chromium } = require('/home/toczektomasz/node_modules/@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    console.log("Navigating to HA...");
    await page.goto('http://localhost:8123/');
    await page.waitForLoadState('networkidle');
    
    console.log("Clicking 'Stwórz swój inteligentny dom'...");
    await page.locator('mwc-button, ha-button').filter({ hasText: /Stwórz|Create/i }).click();
    
    console.log("Waiting for user form...");
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'scratch/ha_step2.png' });
    
    console.log("Filling user form...");
    await page.fill('input[name="name"]', 'admin');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin1234');
    await page.fill('input[name="password_confirm"]', 'admin1234');
    
    await page.locator('mwc-button, ha-button').filter({ hasText: /Utwórz|Create/i }).click();
    
    console.log("Waiting for next step...");
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'scratch/ha_step3.png' });
    
    console.log("Clicking Next...");
    await page.locator('mwc-button, ha-button').filter({ hasText: /Dalej|Next/i }).click();
    
    await page.waitForTimeout(2000);
    await page.locator('mwc-button, ha-button').filter({ hasText: /Dalej|Next/i }).click();
    
    await page.waitForTimeout(2000);
    await page.locator('mwc-button, ha-button').filter({ hasText: /Zakończ|Finish/i }).click();
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'scratch/ha_step4.png' });
    console.log("Done!");
    
  } catch(e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
