import {existsSync} from 'node:fs';
import {GlobalFonts} from '@napi-rs/canvas';

let registered=false;
export function registerInspectionFonts(){
 if(registered)return;
 registered=true;
 const families=[
  ['DejaVuSans',['sans-serif','system-ui','Arial']],
  ['DejaVuSansMono',['monospace','Courier New']],
  ['DejaVuSerif',['serif','Georgia','Times New Roman']]
 ];
 for(const [file,aliases]of families)for(const style of ['', '-Bold', '-Oblique', '-BoldOblique', '-Italic', '-BoldItalic']){
  const path=`/usr/share/fonts/truetype/dejavu/${file}${style}.ttf`;
  if(existsSync(path))for(const alias of aliases)GlobalFonts.registerFromPath(path,alias);
 }
}
