#! node
const { Console } = require('console');
const puppeteer = require('puppeteer');
const https = require('https');
const request = require('request');

async function checkCode(user, domain) {
  const p = new Promise((pippo, ten) => {
    request(`https://www.1secmail.com/api/v1/?action=getMessages&login=${user}&domain=${domain}`, { json: true }, (err, res, body) => {
      if (err) { 
        console.log(err); 
      }
      if (!body[0]){
        ten("DIOPORCO");
        return;
      }
      id = body[0].id;
      request(`https://www.1secmail.com/api/v1/?action=readMessage&login=${user}&domain=${domain}&id=${id}`, { json: true }, (err, res, body) => {
          if (err) { return console.log(err); }
          const testo = body.textBody;
          split = testo.split(":")[2].substring(0, 4);
          console.log(split);
          pippo(split); 
      });  
    });
  })
  return p;    
}

function makeid(length) {
  var result           = "";
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

async function bella(browser){
  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();
  page.setViewport({ width: 1366, height: 768 });
  var email;
  await page.goto('https://sugargoo.com/index/user/register/invite/ODY1OA%3D%3D.html', {
    waitUntil: 'networkidle2',
  });
  https.get('https://www.1secmail.com/api/v1/?action=genRandomMailbox&count=1', (resp) => {
    let data = '';   
    resp.on('data', (chunk) => {
      data += chunk;
    });
    resp.on('end', () => {
      email = data.substring(2, data.length - 2);
      console.log(email);
    });
  }).on("error", (err) => {
    console.log("Error: " + err.message);
  });    
  var user = makeid(5)
  await new Promise(r => setTimeout(() => r(), 8000))

  console.log(user)
  await page.waitForSelector('input[name=username]');
  await page.$eval('input[name=username]', (el, value) => el.value = value, user);
  await page.waitForSelector('input[name=email]');
  await page.$eval('input[name=email]', (el, value) => el.value = value, email);
  await page.waitForSelector('input[name=password]');
  await page.$eval('input[name=password]', el => el.value = 'Password1');

  await new Promise(r => setTimeout(() => r(), 200))

  await page.waitForSelector('a[data-type=email]');
  await new Promise(r => setTimeout(() => r(), 6000));
  await page.click('a[data-type=email]');

  await new Promise(r => setTimeout(() => r(), 15000))

  var esplit = email.split("@");
  console.log(esplit[0]);
  console.log(esplit[1]);
  
  let codice = "diomaiale"
  try {
    codice = await checkCode(esplit[0],esplit[1]);
  } catch (error) {
    console.log(error);
    await page.close();
    return;
  }
  
  await page.waitForSelector('input[name=captcha]');
  await new Promise(r => setTimeout(() => r(), 500))
  await page.$eval('input[name=captcha]', (el, value) => el.value = value, codice);
  await (await page.waitForSelector('input[name=checkbox]')).click();
  await (await page.waitForSelector('input[type=submit]')).click();

  await new Promise(r => setTimeout(() => r(), 2000))
  await page.close();

}

setInterval(async function () {
  const browser = await puppeteer.launch({headless: false,});//lancia puppeteer
  bella(browser);
}, 30000);
/*
async function main() {
  const browser = await puppeteer.launch({headless: false,});//lancia puppeteer
  setInterval(() => bella(browser), 10000);
}
main()
*/