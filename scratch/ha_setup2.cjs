const { chromium } = require('/home/toczektomasz/node_modules/@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    console.log("Navigating to HA...");
    await page.goto('http://localhost:8123/');
    
    // wait until "Create Account" or similar is visible
    console.log("Waiting for network idle...");
    await page.waitForLoadState('networkidle', { timeout: 300000 });
    
    await page.screenshot({ path: 'scratch/ha_onboarding.png' });
    console.log("Screenshot saved.");
  } catch(e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
