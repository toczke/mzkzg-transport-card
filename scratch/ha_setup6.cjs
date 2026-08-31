const { chromium } = require('/home/toczektomasz/node_modules/@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    console.log("Navigating...");
    await page.goto('http://localhost:8123/');
    
    console.log("Clicking Create Smart Home...");
    await page.getByRole('button', { name: /Stwórz swój inteligentny dom|Create my smart home/i }).click();
    
    console.log("Filling user info...");
    // The inputs don't have explicit accessible names sometimes in HA, but let's try input name attribute.
    // In HA, it's <ha-textfield name="name">
    await page.locator('ha-textfield[name="name"]').fill('admin');
    await page.locator('ha-textfield[name="username"]').fill('admin');
    await page.locator('ha-textfield[name="password"]').fill('admin1234');
    await page.locator('ha-textfield[name="password_confirm"]').fill('admin1234');
    
    console.log("Clicking Create Account...");
    await page.getByRole('button', { name: /Utwórz konto|Create Account/i }).click();
    
    console.log("Waiting for Next 1...");
    const nextBtn = page.getByRole('button', { name: /Dalej|Next/i });
    await nextBtn.click();
    
    console.log("Waiting for Next 2 (Location)...");
    await page.waitForTimeout(2000);
    await nextBtn.click();
    
    console.log("Waiting for Finish...");
    await page.getByRole('button', { name: /Zakończ|Finish/i }).click();
    
    console.log("Waiting for Dashboard...");
    await page.waitForURL('**/lovelace/0', { timeout: 30000 });
    
    await page.screenshot({ path: 'scratch/ha_dashboard_ready.png' });
    console.log("Done!");
    
  } catch(e) {
    console.error(e);
    await page.screenshot({ path: 'scratch/ha_error.png' });
  } finally {
    await browser.close();
  }
})();
