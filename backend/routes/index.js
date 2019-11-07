var express = require('express');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const filestack = require('filestack-js');
const cookies = require('../helpers/authCookie');
const links = require('../helpers/links');

const client = filestack.init(process.env.FILESTACK_API_KEY);
var router = express.Router();

const FILE_PATH = path.resolve(__dirname, '../files');
const PDF_CONFIG = {
  path: 'url.pdf', // Saves pdf to disk.
  format: 'A4',
  printBackground: true,
};
const agents = [
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36',
  //"Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36",
  //"Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36",
  //"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.10; rv:34.0) Gecko/20100101 Firefox/34.0",
  //"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36",
  //"Mozilla/5.0 (Windows NT 6.3; WOW64; rv:34.0) Gecko/20100101 Firefox/34.0",
  //"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36",
  //"Mozilla/5.0 (Windows NT 6.2; WOW64; rv:34.0) Gecko/20100101 Firefox/34.0",
  //"Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.99 Safari/537.36"
];

const deliveries = { items: [] };

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

const getPage = async (page, link) => {
  await page.goto(link, { waitUntil: 'networkidle2' });
  const id = link.split('trips/')[1];
  const screenshot = await page.screenshot({
    path: path.resolve(FILE_PATH, `${id}.png`),
    fullPage: true,
  });
  fs.writeFileSync(path.resolve(FILE_PATH, `${id}.png`), screenshot);
  console.log('--- WRITING ---');
  return;
};

router.get('/scrape', async (req, res, next) => {
  console.log('-- ENTER ROUTE');
  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    console.log('--- COOKIES = ', cookies);
    await page.setCookie(...cookies);
    const cookres = await page.cookies();
    console.log('-- COOKIE = ', cookres);
    await page.setUserAgent(agents[Math.floor(Math.random() * agents.length)]);
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8' });
    await page.setViewport({
      width: 1920,
      height: 1080,
    });

    for (let i = 1; i < links.length; i++) {
      await getPage(page, links[i]);
    }

    await browser.close();

    return res.send({ iam: 'DONE!' });
  } catch (error) {
    console.log('--- ERROR TOP LEVEL = ', error);
    res.status(500).send(error);
  }
});

const onProgress = evt => {
  console.log('Progress: ' + evt.totalPercent);
};

router.get('/upload/filestack', async (req, res) => {
  try {
    const items = fs.readdirSync(path.resolve(__dirname, '../files'));

    for (let i = 0; i < items.length; i++) {
      const filePath = path.resolve(__dirname, `../files/${items[i]}`);
      console.log('--- PATH = ', filePath);
      const result = await client.upload(
        filePath,
        { onProgress },
        { workflows: ['26ba2462-cc62-4c12-a86c-dcae792587bb'] },
      );

      // console.log('--- RESULT = ', result);
    }

    res.send({ upload: 'done' });
  } catch (error) {
    console.log('--- ERROR = ', error);
    return res.status(500).send({ error: true });
  }
});

router.post('/webhook/filestack', (req, res) => {
  console.log('req = ', req.body);
  try {
    const { text } = req.body;
    const { results } = text;
    const key = Object.keys(results)[0];

    const result = results[key];

    const items = result.data.document.text_areas;
    let startingPoint = '';
    let tip = '';

    items.forEach((item, i) => {
      if (item.text === 'You receive') {
        console.log('-- TEXT OF ITEM = ', items[i + 1].text);
        const text = items[i + 1].text;
        const splitText = text.split('\n')[1] ? text.split('\n')[1] : text;
        startingPoint = splitText;
      }
    });

    items.forEach((item, i) => {
      if (item.text === 'Tip') {
        tip = items[i + 1].text;
      }
    });

    tip = tip ? parseFloat(tip.replace('$', '')) : 0;

    console.log('START = ', startingPoint);
    console.log('TIP = ', tip);

    const del = require('../results/deliveries.json');
    del.items.push({ startingPoint, tip });

    fs.writeFileSync(path.resolve(__dirname, '../results/deliveries.json'), JSON.stringify(del));

    return res.send({ image: 'done' });
  } catch (error) {
    console.log('--- ERROR = ', error);
    return res.status(500).send({ error: true });
  }
});

module.exports = router;
