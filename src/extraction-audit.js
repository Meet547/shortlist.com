const normalized=text=>(text||'').normalize('NFKC').replace(/\s+/g,' ').trim().toLocaleLowerCase('en');
const words=text=>normalized(text).match(/[\p{L}\p{N}]+(?:[+#]+)?/gu)||[];
function containsPassage(haystack,needle){
  if(!needle)return false;
  let at=haystack.indexOf(needle);
  while(at>=0){const before=haystack[at-1]||'',after=haystack[at+needle.length]||'';if(!/[\p{L}\p{N}+#]/u.test(before)&&!/[\p{L}\p{N}+#]/u.test(after))return true;at=haystack.indexOf(needle,at+1);}
  return false;
}
export function compareExpectedText(expected,actual){
  const haystack=normalized(actual),actualWords=new Set(words(actual));
  return expected.split(/\r?\n/).map((text,index)=>({text:text.trim(),line:index+1})).filter(item=>item.text).map(item=>{
    const needle=normalized(item.text),found=containsPassage(haystack,needle);
    const tokens=words(needle),missingWords=[...new Set(tokens.filter(token=>!actualWords.has(token)))],present=tokens.filter(token=>actualWords.has(token)).length;
    return {...item,status:found?'found':present>0?'partial':'missing',matchedTokens:present,totalTokens:tokens.length,missingWords,location:found?'Found in parser text':'No reliable page position for missing text'};
  });
}
export function textRunStatus(segment,text,security,extraction,page){
  const hasRange=Number.isInteger(segment.start)&&Number.isInteger(segment.end);
  const rawPresent=hasRange?normalized(text.slice(segment.start,segment.end))===normalized(segment.text):normalized(text).includes(normalized(segment.text));
  if(!rawPresent)return {status:'missing',label:'Missing from parser text',reason:'A source text run could not be matched to the current raw stream.'};
  const excluded=hasRange&&security?.excludedRanges.some(range=>range.start<segment.end&&range.end>segment.start);
  if(excluded)return {status:'excluded',label:'Extracted; excluded from scoring',reason:'This run intersects a hidden-text or evaluator-instruction exclusion. The raw text is retained.'};
  if(segment.visibility==='low-contrast'||segment.visibility==='not-visible')return {status:'review',label:'Extracted; visibility needs review',reason:'The page preview shows very little contrast in this text area. This raster check is a heuristic.'};
  if(segment.x<0||segment.y<0||segment.x+segment.width>page.width+2||segment.y+segment.height>page.height+2)return {status:'review',label:'Extracted; outside page bounds',reason:'Some or all of this text run lies outside the visible page.'};
  if(segment.height<3)return {status:'review',label:'Extracted; unusually small text',reason:'Text smaller than 3 PDF points may be difficult to read.'};
  if(segment.y<36||segment.y+segment.height>page.height-36)return {status:'review',label:'Extracted; page-margin risk',reason:'Text in the outer 36 pt margin can be omitted by some parser configurations.'};
  if(extraction.pages?.find(p=>p.page===page.number)?.collision)return {status:'review',label:'Extracted; reading-order risk',reason:'This page has a detected column-flow risk. Inspect the raw stream.'};
  return {status:'found',label:'Extracted',reason:'This selectable text run is present in the raw parser stream.'};
}
export function assessRasterRegion(imageData,rect,scale=1){
  const {data,width,height}=imageData,x0=Math.max(0,Math.floor(rect.x*scale)),y0=Math.max(0,Math.floor(rect.y*scale)),x1=Math.min(width,Math.ceil((rect.x+rect.width)*scale)),y1=Math.min(height,Math.ceil((rect.y+rect.height)*scale));
  if(x1<=x0||y1<=y0)return {visibility:'off-page',contrast:0};
  let min=255,max=0,samples=0;
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const at=(y*width+x)*4,alpha=data[at+3]/255,lum=(.2126*data[at]+.7152*data[at+1]+.0722*data[at+2])*alpha+255*(1-alpha);min=Math.min(min,lum);max=Math.max(max,lum);samples++;}
  const contrast=max-min;
  return {visibility:samples<4?'unavailable':contrast<2?'not-visible':contrast<25?'low-contrast':'visible',contrast:Math.round(contrast)};
}
