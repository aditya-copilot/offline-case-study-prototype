import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  
  await page.screenshot({ path: '/Users/pramod.kumarbs/offline-case-study-prototype/tmp/showroom-homepage.png', fullPage: true });
  console.log('Screenshot saved to showroom-homepage.png');
  
  // Get page info
  const title = await page.title();
  const url = page.url();
  console.log({ title, url });
  
  // Keep browser open for manual inspection
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
})();
