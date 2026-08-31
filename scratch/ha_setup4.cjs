const { chromium } = require('/home/toczektomasz/node_modules/@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:8123/');
    await page.waitForLoadState('networkidle');
    
    // Fill the inputs using CSS deep combinators or evaluate
    await page.evaluate(() => {
      const deepQuery = (selector, root = document) => {
        let el = root.querySelector(selector);
        if (el) return el;
        const all = root.querySelectorAll('*');
        for (let i = 0; i < all.length; i++) {
          if (all[i].shadowRoot) {
            el = deepQuery(selector, all[i].shadowRoot);
            if (el) return el;
          }
        }
        return null;
      };
      
      const name = deepQuery('ha-textfield[name="name"]');
      if (name) name.value = 'admin';
      const username = deepQuery('ha-textfield[name="username"]');
      if (username) username.value = 'admin';
      const pw1 = deepQuery('ha-textfield[name="password"]');
      if (pw1) pw1.value = 'admin1234';
      const pw2 = deepQuery('ha-textfield[name="password_confirm"]');
      if (pw2) pw2.value = 'admin1234';
      
      // Dispatch input events
      [name, username, pw1, pw2].forEach(el => {
        if (el) el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
      });
    });
    
    await page.waitForTimeout(1000);
    
    await page.evaluate(() => {
      const deepQueryAll = (selector, root = document, result = []) => {
        const els = root.querySelectorAll(selector);
        result.push(...els);
        const all = root.querySelectorAll('*');
        for (let i = 0; i < all.length; i++) {
          if (all[i].shadowRoot) deepQueryAll(selector, all[i].shadowRoot, result);
        }
        return result;
      };
      const btn2 = deepQueryAll('mwc-button, ha-button').find(b => b.textContent.includes('Utwórz') || b.textContent.includes('Create'));
      if (btn2) btn2.click();
    });
    
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'scratch/ha_step4.png' });
    console.log("Step 4 done.");
  } catch(e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
