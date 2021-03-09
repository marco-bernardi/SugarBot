#! node
const { Console } = require('console');
const puppeteer = require('puppeteer');//headless browser emulator
const https = require('https');
const request = require('request');

const frequency = 10000;
const inputWaiting = 4000;
const emailInputWait = 200;
const emailSendCode = 15000;
const waitForCode = 15000;
const codeFillTime = 500;
const waitToQuit = 2000;
let invites = 0;
let link = 'https://sugargoo.com/index/user/register/invitehttps://sugargoo.com/index/user/register/invite/ODY1OA==.html/ODY1OA%3D%3D.html'
let myArgs = process.argv.slice(2);
if (process.argv.length >= 3){
  link = myArgs[0];
}

async function checkCode(user, domain) { //confirmation code
  const p = new Promise((substring, error) => {
    request(`https://www.1secmail.com/api/v1/?action=getMessages&login=${user}&domain=${domain}`, { json: true }, (err, res, body) => {
      if (err) { 
        console.log(err); 
      }
      if (!body[0]){
        error("Ops... 👉👈 tengo uno errore😓\n\rDIOPORCO");
        return;
      }
      id = body[0].id;
      request(`https://www.1secmail.com/api/v1/?action=readMessage&login=${user}&domain=${domain}&id=${id}`, { json: true }, (err, res, body) => {
          if (err) { return console.log(err); }
          const text = body.textBody;
          split = text.split(":")[2].substring(0, 4);
          console.log(split);
          substring(split); 
      });  
    });
  })
  return p;    
}

function makeid(length) {//generates a casual id
  var result           = "";
  var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

async function main(browser){
  const pages = await browser.pages();
  const page = pages[0];

  await page.setRequestInterception(true);//blocks images ,fonts and css
  page.on('request', (request) => {
    if (request.resourceType() === 'image') request.abort();
    else if (request.resourceType() === 'media') request.abort();
    else if (request.resourceType() === 'font') request.abort();
    else if (request.resourceType() === 'stylesheet') request.abort();
    else request.continue();
  }); 

  page.setViewport({ width: 900, height: 900 });
  var email;
  await page.goto(link, {
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
  const user = makeid(5);
  await new Promise(r => setTimeout(() => r(), inputWaiting));

  console.log(user)
  await page.waitForSelector('input[name=username]');
  await page.$eval('input[name=username]', (el, value) => el.value = value, user);
  await page.waitForSelector('input[name=email]');
  await page.$eval('input[name=email]', (el, value) => el.value = value, email);
  await page.waitForSelector('input[name=password]');
  await page.$eval('input[name=password]', el => el.value = 'Password1');

  await new Promise(r => setTimeout(() => r(), emailInputWait))

  await page.waitForSelector('a[data-type=email]');
  await new Promise(r => setTimeout(() => r(), emailSendCode));
  await page.click('a[data-type=email]');

  await new Promise(r => setTimeout(() => r(), waitForCode))

  var esplit = email.split("@");
  console.log(esplit[0]);
  console.log(esplit[1]);
  
  let codice = "DioCan"
  try {
    codice = await checkCode(esplit[0],esplit[1]);
  } catch (error) {
    console.log(error);
    await page.close();
    return;
  }
  
  await page.waitForSelector('input[name=captcha]');
  await new Promise(r => setTimeout(() => r(), codeFillTime))
  await page.$eval('input[name=captcha]', (el, value) => el.value = value, codice);
  await (await page.waitForSelector('input[name=checkbox]')).click();
  await (await page.waitForSelector('input[type=submit]')).click();

  await new Promise(r => setTimeout(() => r(), waitToQuit))
  await page.close();
  invites = invites + 1;
  console.log(`inviti totali:${invites}`);

}

setInterval(async function () {
  const browser = await puppeteer.launch({headless: true, args: ['--incognito']});//lancia puppeteer senza "grafica" e in incognito
  main(browser);
}, frequency);