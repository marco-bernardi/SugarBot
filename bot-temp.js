#! node
const puppeteer = require('puppeteer');//headless browser emulator
const request = require('request');
const config = require('./config');

let invites = 0;
let link = 'https://sugargoo.com/index/user/register/invite/MTYwNDI%3D.html'
let myArgs = process.argv.slice(2);
if (process.argv.length >= 3){
  link = myArgs[0];
}

async function getProxy() {//not used
  request("https://raw.githubusercontent.com/scidam/proxy-list/master/proxy.json", {json: true}, (error, res, body) => {
    if (error) {
        return console.log(error);
    };
    if (!error && res.statusCode == 200) {
        rand = Math.floor(Math.random() * 1000);
        const proxy = body.proxies[rand].ip + ':' + body.proxies[rand].port;
        console.log(proxy);
        return proxy;
    };
  });
}

//generates a casual id
function makeid(length) {
  let result           = "";
  const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for ( let i = 0; i < length; i++ ) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

//blocks images ,fonts and css on the page
async function speedup(page){
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (request.resourceType() === 'image') request.abort();
    else if (request.resourceType() === 'media') request.abort();
    else if (request.resourceType() === 'font') request.abort();
    else if (request.resourceType() === 'stylesheet') request.abort();
    else request.continue();
  });
}

//gets a random email
async function getMail(tempmail){
  await tempmail.goto("https://temp-mail.org/", {
      waitUntil: 'networkidle2',
    })

  await new Promise(r => setTimeout(() => r(), 8000));
  const mail = await tempmail.$eval('input#mail.emailbox-input', el => el.value); //gets mail
  return mail;
}

//fills sugargoo page
async function sugarFill(sugargoo, user, email) {
  await sugargoo.waitForSelector('input[name=username]');
  await sugargoo.$eval('input[name=username]', (el, value) => el.value = value, user);
  await sugargoo.waitForSelector('input[name=email]');
  await sugargoo.$eval('input[name=email]', (el, value) => el.value = value, email);
  await sugargoo.waitForSelector('input[name=password]');
  await sugargoo.$eval('input[name=password]', el => el.value = 'Password1');

  await new Promise(r => setTimeout(() => r(), config.emailInputWait));

  await sugargoo.waitForSelector('a[data-type=email]');
  await new Promise(r => setTimeout(() => r(), config.emailSendCode));
  await sugargoo.click('a[data-type=email]');

  await new Promise(r => setTimeout(() => r(), config.waitForCode));
  return;
}

//gets code
async function getCode(tempmail, browser){
    //moves the mouse randomly to trigger MouseEvent
    let intervalId = setInterval( () => {
      tempmail.mouse.move(Math.floor(Math.random() * 100) , Math.floor(Math.random() * 100));
    },1000);
  
    await tempmail.waitForSelector('span[title="noreply@sugargoo.com"]', {timeout: 0});
    clearInterval(intervalId);
    await tempmail.click('span[title="noreply@sugargoo.com"]');
    await tempmail.waitForSelector('.inbox-data-content-intro');
    await new Promise(r => setTimeout(() => r(), 6000));
    const value = await tempmail.$eval('.inbox-data-content-intro', el => el.innerText);
    let code = 0;
    try{
      code = await value.split(":")[2].slice(0, 4)
      await tempmail.close();
    }catch{
      console.log("I need more time loading the mail page");
      browser.close();
      return;
    };
    console.log(code);
    return code;
}

//fills the code
async function confirmCode(sugargoo, code) {
  await sugargoo.waitForSelector('input[name=captcha]');
  await new Promise(r => setTimeout(() => r(), config.codeFillTime));
  await sugargoo.$eval('input[name=captcha]', (el, value) => el.value = value, code);
  await (await sugargoo.waitForSelector('input[name=checkbox]')).click();
  await (await sugargoo.waitForSelector('input[type=submit]')).click();
}

async function main(){
  //lancia puppeteer senza "grafica" e in incognito
  const browser = await puppeteer.launch({headless: true, args: [`--incognito`]});
  const pages = await browser.pages();
  const sugargoo = pages[0];
  const tempmail = await browser.newPage();

  await speedup(sugargoo);
  await speedup(tempmail);

  sugargoo.setViewport({ width: 900, height: 900 });
  tempmail.setViewport({ width: 900, height: 900 });

  //opens the pages asyncronously
 sugargoo.goto(link, {
    waitUntil: 'networkidle2',
  });
  const email = await getMail(tempmail);
    
  //generates a fake id
  const user = makeid(5);
  await new Promise(r => setTimeout(() => r(), config.inputWaiting));

  console.log(user);
  //fills sugargoo page
  await sugarFill(sugargoo, user, email);

  console.log(`opening ${email} inbox`);
  //gets the code from tempmail
  const code = await getCode(tempmail, browser);

  //fills the code
  await confirmCode(sugargoo, code);

  await new Promise(r => setTimeout(() => r(), config.waitToQuit))
  browser.close();
  invites = invites + 1;
  console.log(`inviti totali:${invites}`);
}

main() //does one main asap and then waits the interval
setInterval(async function () {
    main();
}, config.frequency + (Math.random() * config.frequencyRandomness));