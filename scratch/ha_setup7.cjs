const { chromium } = require('/home/toczektomasz/node_modules/@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    console.log("Navigating...");
    await page.goto('http://localhost:8123/');
    await page.waitForLoadState('networkidle');
    
    // Evaluate to click the button and focus first field
    await page.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const deepQueryAll = (selector, root = document, result = []) => {
        const els = root.querySelectorAll(selector);
        result.push(...els);
        const all = root.querySelectorAll('*');
        for (let i = 0; i < all.length; i++) {
          if (all[i].shadowRoot) deepQueryAll(selector, all[i].shadowRoot, result);
        }
        return result;
      };
      
      const btn1 = deepQueryAll('mwc-button, ha-button').find(b => b.textContent.includes('Stwórz') || b.textContent.includes('Create'));
      if (btn1) {
        btn1.click();
        await wait(2000);
      }
      
      const name = deepQueryAll('input').find(i => i.name === 'name' || i.id === 'name');
      if (name) name.focus();
    });
    
    console.log("Typing...");
    await page.keyboard.type('admin');
    await page.keyboard.press('Tab');
    await page.keyboard.type('admin');
    await page.keyboard.press('Tab');
    await page.keyboard.type('admin1234');
    await page.keyboard.press('Tab');
    await page.keyboard.type('admin1234');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    
    console.log("Waiting...");
    await page.waitForTimeout(4000);
    
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Next
    await page.waitForTimeout(3000);
    
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Location Next
    await page.waitForTimeout(3000);
    
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter'); // Analytics Finish
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: 'scratch/ha_dashboard_final.png' });
    console.log("Done!");
    
  } catch(e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
