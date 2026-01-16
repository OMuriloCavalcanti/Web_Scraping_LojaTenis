const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');//Para salvar em arquivo separado para tratar os dados recebidos
puppeteer.use(StealthPlugin());

const url = "https://www.netshoes.com.br/busca?nsCat=Natural&q=tenis&page=557";

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
  await autoScroll(page);

  const tenis = await page.$$eval(
      '.product-list__items.double-columns .card.double-columns.full-image',
      cards => {
      return cards.map(card => {
          const title = card.querySelector('.card__description--name')?.innerText.trim();
          const price = card.querySelector('.full-mounted')?.innerText.trim();
          return { title, price };
      });
      }
  );



  allTenis.push(...tenis);
  console.log(allTenis);
  const nextBtn = await page.$('.pagination__next',{ timeout: 20000});
  if(!nextBtn)
      console.log("botão de próximo não exite!");
  else
      console.log('próximo botão existe');
    
    
    
  //await browser.close();
}

main();