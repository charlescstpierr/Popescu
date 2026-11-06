// Optional browser QA: PLAYWRIGHT_MODULE and CHROMIUM_PATH can select local installs.
const assert=require('node:assert/strict');
const {resolve}=require('node:path');
const {pathToFileURL,fileURLToPath}=require('node:url');
function playwright(){
  if(process.env.PLAYWRIGHT_MODULE)return require(process.env.PLAYWRIGHT_MODULE);
  for(const name of ['playwright','playwright-core']){try{return require(name);}catch(error){if(error.code!=='MODULE_NOT_FOUND')throw error;}}
  throw new Error('Install playwright, or set PLAYWRIGHT_MODULE to an existing playwright-core module and CHROMIUM_PATH to Chromium.');
}
async function main(){
  const input=process.argv[2]||resolve(__dirname,'../release/Toma_Popescu_JOUER.html');
  const url=input.startsWith('file:')?new URL(input):pathToFileURL(resolve(input));
  assert.equal(url.protocol,'file:','this check must exercise file:// security');
  const {chromium}=playwright(),browser=await chromium.launch(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{});
  const errors=[],failedRequests=[],networkRequests=[];
  try{
    const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();
    page.on('pageerror',error=>errors.push(`pageerror: ${error.message}`));
    page.on('console',message=>{if(message.type()==='error')errors.push(`console: ${message.text()}`);});
    page.on('requestfailed',request=>failedRequests.push(`${request.url()}: ${request.failure()?.errorText}`));
    await page.route(/^https?:/,route=>{networkRequests.push(route.request().url());return route.abort();});
    await page.goto(url.href);
    await page.locator('#play').click();
    await page.locator('#skip-dialogue').click();
    await page.waitForFunction(()=>/^\d{2}:\d{2}$/.test(document.getElementById('time')?.textContent?.trim())&&document.getElementById('time').textContent.trim()!=='00:00',{},{timeout:15000}).catch(error=>{if(error.name!=='TimeoutError')throw error;});
    await page.keyboard.down('KeyD');await page.waitForTimeout(2500);await page.keyboard.up('KeyD');
    const time=await page.locator('#time').innerText();
    if(process.argv[3])await page.screenshot({path:resolve(process.argv[3])});
    const report={file:fileURLToPath(url),time,started:time!=='00:00',errors,failedRequests,networkRequests};
    console.log(JSON.stringify(report));
    assert.equal(report.started,true,'the run clock must advance');
    assert.deepEqual(errors,[],'no runtime or console errors');
    assert.deepEqual(failedRequests,[],'all local resources must load');
    assert.deepEqual(networkRequests,[],'offline play must not request the network');
  }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
