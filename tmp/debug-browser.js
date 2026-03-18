import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    logs.push(`PAGE ERROR: ${error.message}`);
  });
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle', timeout: 30000 });
  
  await page.waitForTimeout(3000);
  
  const bodyContent = await page.evaluate(() => document.body.innerHTML.slice(0, 500));
  const rootContent = await page.evaluate(() => document.getElementById('root')?.innerHTML?.slice(0, 500) || 'ROOT NOT FOUND');
  
  console.log('=== CONSOLE LOGS ===');
  logs.forEach(log => console.log(log));
  
  console.log('\n=== BODY CONTENT ===');
  console.log(bodyContent);
  
  console.log('\n=== ROOT CONTENT ===');
  console.log(rootContent);
  
  await browser.close();
})();
