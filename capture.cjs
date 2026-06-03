const { chromium } = require('playwright');

const OUT = '/Users/regianemachado/Library/Application Support/Claude/local-agent-mode-sessions/b37f7efb-c1f2-4f76-a27f-18ec6b23c610/1603ee71-3031-4726-b7fc-a4a14ce1064d/local_f6f4512e-8bb0-4054-b83f-ba8fa5d662cf/outputs/pita-doceria/instrutivo/screenshots';

(async () => {
  const browser = await chromium.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox']
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  console.log('Navegando para localhost:5174...');
  await page.goto('http://localhost:5174', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(2000);
  console.log('Página carregada');

  // 1 - Visão geral - header + topo
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: OUT + '/01_visao_geral.png' });
  console.log('01 OK');

  // 2 - Custos fixos expandidos
  await page.click('button:has-text("Configurações de Custos Fixos")');
  await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + '/02_custos_fixos.png' });
  console.log('02 OK');
  await page.click('button:has-text("Configurações de Custos Fixos")');
  await page.waitForTimeout(300);

  // 3 - Scroll para ingredientes
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(400);
  await page.screenshot({ path: OUT + '/03_ingredientes.png' });
  console.log('03 OK');

  // 4 - Scroll para resultados / painel
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(400);
  await page.screenshot({ path: OUT + '/04_resultados.png' });
  console.log('04 OK');

  // 5 - Aba Histórico
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const btns = await page.$$('div.flex.gap-1.mb-4 button');
  if (btns[1]) { await btns[1].click(); await page.waitForTimeout(2000); }
  await page.screenshot({ path: OUT + '/05_historico.png' });
  console.log('05 OK');

  // 6 - Modal editar precificação
  const editBtn = page.locator('button:has-text("Editar")').first();
  if (await editBtn.isVisible()) {
    await editBtn.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: OUT + '/06_modal_editar.png' });
    console.log('06 OK');
    // Force-click the ✕ close button (rounded-full) inside the modal
    await page.locator('.fixed.inset-0.z-50 button.rounded-full').click({ force: true });
    await page.waitForTimeout(800);
  }

  // 7 - Aba Pedidos
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.click('button:has-text("Pedidos")');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: OUT + '/07_pedidos.png' });
  console.log('07 OK');

  // 8 - Aba Painel Financeiro
  await page.click('button:has-text("Painel Financeiro")');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: OUT + '/08_painel_financeiro.png' });
  console.log('08 OK');

  // 9 - Scroll painel
  await page.evaluate(() => window.scrollTo(0, 700));
  await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + '/09_painel_graficos.png' });
  console.log('09 OK');

  await browser.close();
  console.log('Todas as screenshots capturadas!');
})().catch(e => { console.error(e); process.exit(1); });
