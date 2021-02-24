#! node
const { Console } = require('console');
const puppeteer = require('puppeteer');//headless browser emulator
const https = require('https');
const request = require('request');

const frequency = 10000;
const inputWaiting = 4000;
const emailInputWait = 200;
const emailSendCode = 15000;
const waitForCode = 5000;
const codeFillTime = 500;
const waitToQuit = 2000;
let invites = 0;
let link = 'https://sugargoo.com/index/user/register/invite/MTI1Nzg%3D.html'
let myArgs = process.argv.slice(2);
if (process.argv.length >= 3){
  link = myArgs[0];
}

function makeid(length) {//generates a casual id
  let result           = "";
  const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for ( let i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

async function speedup(page){
  await page.setRequestInterception(true);//blocks images ,fonts and css
  page.on('request', (request) => {
    if (request.resourceType() === 'image') request.abort();
    else if (request.resourceType() === 'media') request.abort();
    else if (request.resourceType() === 'font') request.abort();
    else if (request.resourceType() === 'stylesheet') request.abort();
    else request.continue();
  });
}

async function getMail(tempmail){
  await tempmail.goto("https://temp-mail.org/", {
      waitUntil: 'networkidle2',
    });

  await new Promise(r => setTimeout(() => r(), 8000));
  const mail = await tempmail.$eval('input#mail.emailbox-input', el => el.value); //gets mail
  return mail;
}

function moveMouse(){
  tempmail.mouse.move(Math.floor(Math.random() * 100) , Math.floor(Math.random() * 100));
  console.log("mouse mosso");
}

async function main(browser){
  const pages = await browser.pages();
  const sugargoo = pages[0];
  const tempmail = await browser.browserContexts()[0].newPage();

  await speedup(sugargoo);
  await speedup(tempmail);

  sugargoo.setViewport({ width: 900, height: 900 });
  tempmail.setViewport({ width: 900, height: 900 });

  await sugargoo.goto(link, {
    waitUntil: 'networkidle2',
  });
  let email = await getMail(tempmail);
    
  const user = makeid(5);
  await new Promise(r => setTimeout(() => r(), inputWaiting));

  console.log(user)
  await sugargoo.waitForSelector('input[name=username]');
  await sugargoo.$eval('input[name=username]', (el, value) => el.value = value, user);
  await sugargoo.waitForSelector('input[name=email]');
  await sugargoo.$eval('input[name=email]', (el, value) => el.value = value, email);
  await sugargoo.waitForSelector('input[name=password]');
  await sugargoo.$eval('input[name=password]', el => el.value = 'Password1');

  await new Promise(r => setTimeout(() => r(), emailInputWait));

  await sugargoo.waitForSelector('a[data-type=email]');
  await new Promise(r => setTimeout(() => r(), emailSendCode));
  await sugargoo.click('a[data-type=email]');

  await new Promise(r => setTimeout(() => r(), waitForCode));

  //---------------------------------------------------------------------------------------------------------------------bestemmie
  console.log("apertura mail...");
  var intervalId = setInterval(moveMouse ,1000); //se gli do la variabile non parte
  console.log("aspettando");
  await tempmail.waitForSelector('span[title="noreply@sugargoo.com"]', {timeout: 0}).then(clearInterval(intervalId));
  await tempmail.click('span[title="noreply@sugargoo.com"]');
  await tempmail.waitForSelector('.inbox-data-content-intro');
  await new Promise(r => setTimeout(() => r(), 20000));
  const value = await tempmail.$eval('.inbox-data-content-intro', el => el.innerText);
  const code = await value.split(":")[2].slice(0, 4);
  console.log(code);
  

  await tempmail.close();
  await sugargoo.waitForSelector('input[name=captcha]');
  await new Promise(r => setTimeout(() => r(), codeFillTime));
  await sugargoo.$eval('input[name=captcha]', (el, value) => el.value = value, code);
  await (await sugargoo.waitForSelector('input[name=checkbox]')).click();
  await (await sugargoo.waitForSelector('input[type=submit]')).click();

  await new Promise(r => setTimeout(() => r(), waitToQuit))
  await sugargoo.close();
  invites = invites + 1;
  console.log(`inviti totali:${invites}`);

}

/*
setInterval(async function () {
  const browser = await puppeteer.launch({headless: false, args: ['--incognito']});//lancia puppeteer senza "grafica" e in incognito
  main(browser);
}, frequency);*/

async function asd(){
  const browser = await puppeteer.launch({headless: true, args: ['--incognito']});//lancia puppeteer senza "grafica" e in incognito
  main(browser);
}
asd()