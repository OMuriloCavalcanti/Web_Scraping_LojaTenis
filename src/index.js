const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
puppeteer.use(StealthPlugin());

const url = "https://www.netshoes.com.br/busca?nsCat=Natural&q=tenis";

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise(resolve => {
      let totalHeight = 0;
      const distance = 400;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 300);
    });
  });
}

async function main() {
  const browser = await puppeteer.launch({
      headless: false,
      args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--start-maximized"
      ],
      defaultViewport: null,
  });

  const page = await browser.newPage();
  let allTenis = [];
  console.log("Acessando site...");
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector('.product-list__items.double-columns', { timeout: 20000 });
  const maxPage = await page.$$eval(
    '.pagination__list a',
    links => {
      return Math.max(
        ...links
          .map(a => a.innerText.trim())
          .filter(text => /^\d+$/.test(text))
          .map(Number)
      );
    }
  );

  console.log(maxPage);
  for(let i = 1; i < maxPage; i++){
    await autoScroll(page);
    const tenis = await page.$$eval(
      '.product-list__items.double-columns .card.double-columns.full-image',
      cards => {
      return cards.map(card => {
        const title = card.querySelector('.card__description--name')?.innerText.trim();
        const price = card.querySelector('.full-mounted')?.innerText.trim();
        return { title, price };
    });});
    allTenis.push(...tenis);
    const nextBtn = await page.$('.pagination__next',{ timeout: 40000});

    if(!nextBtn) {
      console.log("Fim da paginação.");
      break;
    }
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      nextBtn.click()
    ]);
  }
  console.log(allTenis);
  saveToJson(allTenis);
  await browser.close();
}

function saveToJson(data, fileName = 'tenis_raw.json') {
  const filePath = path.resolve(__dirname, 'json', fileName);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  fs.writeFileSync(
    filePath,
    JSON.stringify(data, null, 2),
    'utf-8'
  );

  console.log('JSON salvo em:', filePath);
}

main();