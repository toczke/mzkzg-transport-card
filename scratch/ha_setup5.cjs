const { chromium } = require('/home/toczektomasz/node_modules/@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:8123/');
    await page.waitForLoadState('networkidle');
    
    await page.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
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
      const deepQueryAll = (selector, root = document, result = []) => {
        const els = root.querySelectorAll(selector);
        result.push(...els);
        const all = root.querySelectorAll('*');
        for (let i = 0; i < all.length; i++) {
          if (all[i].shadowRoot) deepQueryAll(selector, all[i].shadowRoot, result);
        }
        return result;
      };

      // 1. Click "Stwórz swój inteligentny dom"
      const btn1 = deepQueryAll('mwc-button, ha-button').find(b => b.textContent.includes('Stwórz') || b.textContent.includes('Create'));
      if (btn1) {
        btn1.click();
        await wait(2000);
      }
      
      // 2. Fill User form
      const name = deepQuery('ha-textfield[name="name"]');
      if (name) { name.value = 'admin'; name.dispatchEvent(new Event('input', { bubbles: true, composed: true })); }
      const username = deepQuery('ha-textfield[name="username"]');
      if (username) { username.value = 'admin'; username.dispatchEvent(new Event('input', { bubbles: true, composed: true })); }
      const pw1 = deepQuery('ha-textfield[name="password"]');
      if (pw1) { pw1.value = 'admin1234'; pw1.dispatchEvent(new Event('input', { bubbles: true, composed: true })); }
      const pw2 = deepQuery('ha-textfield[name="password_confirm"]');
      if (pw2) { pw2.value = 'admin1234'; pw2.dispatchEvent(new Event('input', { bubbles: true, composed: true })); }
      
      await wait(1000);
      const btn2 = deepQueryAll('mwc-button, ha-button').find(b => b.textContent.includes('Utwórz') || b.textContent.includes('Create') && !b.textContent.includes('Stwórz'));
      if (btn2) {
        btn2.click();
        await wait(4000);
      }
      
      // 3. Name your home (Dalej)
      const btn3 = deepQueryAll('mwc-button, ha-button').find(b => b.textContent.includes('Dalej') || b.textContent.includes('Next'));
      if (btn3) {
        btn3.click();
        await wait(3000);
      }
      
      // 4. Country/Location (Dalej)
      const btn4 = deepQueryAll('mwc-button, ha-button').find(b => b.textContent.includes('Dalej') || b.textContent.includes('Next'));
      if (btn4) {
        btn4.click();
        await wait(3000);
      }
      
      // 5. Analytics (Zakończ)
      const btn5 = deepQueryAll('mwc-button, ha-button').find(b => b.textContent.includes('Zakończ') || b.textContent.includes('Finish'));
      if (btn5) {
        btn5.click();
        await wait(5000);
      }
    });
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'scratch/ha_step5.png' });
    console.log("Onboarding complete!");
  } catch(e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
