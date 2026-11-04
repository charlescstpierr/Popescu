// Native QA adapter only. Browser image URL resolution is supplied by the browser.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const {Image}=require('@napi-rs/canvas');
function offlineImages(inputPath){
 const directory=path.dirname(path.resolve(inputPath));
 function imageSource(source){
  assert.equal(typeof source,'string','image source must be a string');
  if(/^data:image\/(?:png|webp|svg\+xml);base64,/.test(source))return source.startsWith('data:image/svg+xml;')?Buffer.from(source.slice(source.indexOf(',')+1),'base64'):source;
  assert.match(source,/^assets\/[A-Za-z0-9._-]+$/,'offline images must stay inside the exported assets folder; network access is disabled');
  const file=path.join(directory,source);assert(fs.statSync(file).isFile());return file;
 }
 class OfflineImage extends Image{
  set src(source){super.src=source===''?'':imageSource(source);}
  get src(){return super.src;}
 }
 async function checkImageSource(source){
  const resolved=imageSource(source);
  return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{try{assert(image.width>0&&image.height>0);resolve(image);}catch(error){reject(error);}};image.onerror=reject;image.src=resolved;});
 }
 async function checkStaticImages(html){
  const sources=new Set([...html.matchAll(/assets\/[\w.-]+\.(?:png|webp|svg)/g)].map(match=>match[0]));
  for(const source of sources)await checkImageSource(source);
  return sources.size;
 }
 return {Image:OfflineImage,checkImageSource,checkStaticImages};
}
module.exports={offlineImages};
