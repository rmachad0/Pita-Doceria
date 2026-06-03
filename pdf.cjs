const { chromium } = require('playwright');
const path = require('path');

const HTML = path.resolve(
  '/Users/regianemachado/Library/Application Support/Claude/local-agent-mode-sessions/b37f7efb-c1f2-4f76-a27f-18ec6b23c610/1603ee71-3031-4726-b7fc-a4a14ce1064d/local_f6f4512e-8bb0-4054-b83f-ba8fa5d662cf/outputs/pita-doceria/instrutivo/guia.html'
);
const PDF = '/Users/regianemachado/Library/Application Support/Claude/local-agent-mode-sessions/b37f7efb-c1f2-4f76-a27f-18ec6b23c610/1603ee71-3031-4726-b7fc-a4a14ce1064d/local_f6f4512e-8bb0-4054-b83f-ba8fa5d662cf/outputs/pita-doceria/instrutivo/PiTa_Guia_de_Uso.pdf';

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();

  console.log('Carregando HTML...');
  await page.goto('file://' + HTML, { waitUntil: 'networkidle', timeout: 20000 });
  // Aguarda imagens carregarem
  await page.waitForTimeout(2000);

  console.log('Gerando PDF...');
  await page.pdf({
    path: PDF,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
    scale: 0.82,
  });

  await browser.close();
  console.log('PDF gerado em:', PDF);
})().catch(e => { console.error(e); process.exit(1); });
