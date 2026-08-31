const { chromium } = require('/home/toczektomasz/node_modules/@playwright/test');

(async () => {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    console.log("Navigating to HA...");
    await page.goto('http://localhost:8123/');
    
    console.log("Waiting for onboarding screen...");
    await page.waitForSelector('ha-textfield[name="name"]', { timeout: 60000 });
    
    console.log("Filling user info...");
    await page.fill('ha-textfield[name="name"]', 'admin');
    await page.fill('ha-textfield[name="username"]', 'admin');
    await page.fill('ha-textfield[name="password"]', 'admin1234');
    await page.fill('ha-textfield[name="password_confirm"]', 'admin1234');
    
    console.log("Clicking Create Account...");
    await page.click('mwc-button:has-text("Create Account")');
    
    console.log("Waiting for next step (Name your home)...");
    await page.waitForSelector('ha-textfield[name="name"]', { timeout: 30000 });
    
    console.log("Clicking Next on home name...");
    await page.click('mwc-button:has-text("Next")');
    
    console.log("Waiting for next step (Country/Location)...");
    await page.waitForSelector('mwc-button:has-text("Next")', { timeout: 30000 });
    await page.waitForTimeout(2000); // give it a sec to load dropdowns
    console.log("Clicking Next on location...");
    await page.click('mwc-button:has-text("Next")');
    
    console.log("Waiting for next step (Analytics)...");
    await page.waitForSelector('mwc-button:has-text("Next")', { timeout: 30000 });
    console.log("Clicking Next on Analytics...");
    await page.click('mwc-button:has-text("Next")');
    
    console.log("Waiting for Finish button...");
    await page.waitForSelector('mwc-button:has-text("Finish")', { timeout: 30000 });
    console.log("Clicking Finish...");
    await page.click('mwc-button:has-text("Finish")');
    
    console.log("Waiting for dashboard...");
    await page.waitForURL('**/lovelace/0', { timeout: 30000 });
    console.log("Onboarding complete!");
    
  } catch (err) {
    console.error("Error during setup:", err);
  } finally {
    await browser.close();
  }
})();
