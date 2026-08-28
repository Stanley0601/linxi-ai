/* eslint-disable @typescript-eslint/no-require-imports */
// 独立 Node 脚本（puppeteer 生成说明文档 PDF），CommonJS require 为刻意保留
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'shell',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  
  const htmlPath = path.resolve(__dirname, '产品说明文档.html');
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });
  
  await page.evaluateHandle('document.fonts.ready');
  await page.emulateMediaType('screen');
  
  await page.pdf({
    path: path.resolve(__dirname, '灵犀_说明文档.pdf'),
    format: 'A4',
    printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' },
  });
  
  await browser.close();
  console.log('PDF generated successfully!');
})();
