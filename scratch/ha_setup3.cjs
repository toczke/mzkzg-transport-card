const { chromium } = require('/home/toczektomasz/node_modules/@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    await page.goto('http://localhost:8123/');
    await page.waitForLoadState('networkidle');
    
    await page.evaluate(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms));
      const getShadowRoot = (el) => el && el.shadowRoot ? el.shadowRoot : el;
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
          if (all[i].shadowRoot) {
            deepQueryAll(selector, all[i].shadowRoot, result);
          }
        }
        return result;
      };

      const btn1 = deepQueryAll('mwc-button, ha-button').find(b => b.textContent.includes('Stwórz') || b.textContent.includes('Create'));
      if (btn1) {
        btn1.click();
        await wait(2000);
      }
      
      const name = deepQuery('ha-textfield[name="name"]');
      if (name) name.value = 'admin';
      const username = deepQuery('ha-textfield[name="username"]');
      if (username) username.value = 'admin';
      const pw1 = deepQuery('ha-textfield[name="password"]');
      if (pw1) pw1.value = 'admin1234';
      const pw2 = deepQuery('ha-textfield[name="password_confirm"]');
      if (pw2) pw2.value = 'admin1234';
      
      const btn2 = deepQueryAll('mwc-button, ha-button').find(b => b.textContent.includes('Utwórz') || b.textContent.includes('Create'));
      if (btn2) {
        btn2.click();
        await wait(3000);
      }
      
      let btnNext = deepQueryAll('mwc-button, ha-button').find(b => b.textContent.includes('Dalej') || b.textContent.includes('Next'));
      while (btnNext) {
        btnNext.click();
        await wait(2000);
        btnNext = deepQueryAll('mwc-button, ha-button').find(b => b.textContent.includes('Dalej') || b.textContent.includes('Next'));
      }
      
      const btnFinish = deepQueryAll('mwc-button, ha-button').find(b => b.textContent.includes('Zakończ') || b.textContent.includes('Finish'));
      if (btnFinish) {
        btnFinish.click();
        await wait(3000);
      }
    });
    
    await page.screenshot({ path: 'scratch/ha_step_final.png' });
    console.log("Done!");
    
  } catch(e) {
    console.error(e);
  } finally {
    await browser.close();
  }
})();
