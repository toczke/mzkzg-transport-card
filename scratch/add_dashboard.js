const { chromium } = require('/home/toczektomasz/node_modules/@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:8123/');
    
    // Login
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin1234');
    await page.click('button:has-text("Log in"), mwc-button:has-text("Zaloguj")');
    await page.waitForLoadState('networkidle');
    
    console.log("Logged in. Saving tokens and calling API...");
    // Get tokens from localStorage
    const auth = await page.evaluate(() => JSON.parse(localStorage.getItem('hassTokens')));
    
    // Update lovelace config
    const dashboardConfig = {
      views: [
        {
          title: "Home",
          cards: [
            {
              type: "custom:polish-transport-card",
              entity: "sensor.mzkzg_transport_strzyza_pkm"
            }
          ]
        }
      ]
    };
    
    const response = await page.evaluate(async ({ token, config }) => {
      const res = await fetch('/api/lovelace/config', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      return await res.text();
    }, { token: auth.access_token, config: dashboardConfig });
    
    console.log("Dashboard response:", response);
    
  } catch(e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
