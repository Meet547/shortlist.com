import {inspectGeometry} from './geometry.js';
import {assessRasterRegion} from './extraction-audit.js';

function compact(text){let value='',map=[];for(let i=0;i<text.length;i++){for(const c of text[i].normalize('NFKC'))if(!/\s/.test(c)){value+=c;map.push(i);}}return {value,map};}
export function inspectPDFOperators(operators,pdfjs,text,baseOffset,page){
  const findings=[],source=compact(text),stack=[];let state={mode:0,fillAlpha:1,strokeAlpha:1,transparent:false},cursor=0;
  for(let i=0;i<operators.fnArray.length;i++){
    const op=operators.fnArray[i],args=operators.argsArray[i]||[];
    if(op===pdfjs.OPS.save)stack.push({...state});
    if(op===pdfjs.OPS.restore)state=stack.pop()||state;
    if(op===pdfjs.OPS.setTextRenderingMode)state.mode=args[0];
    if(op===pdfjs.OPS.setFillTransparent)state.transparent=true;
    if(op===pdfjs.OPS.setFillRGBColor||op===pdfjs.OPS.setFillColorN)state.transparent=false;
    if(op===pdfjs.OPS.setGState)for(const entry of args[0]||[]){if(entry[0]==='ca')state.fillAlpha=entry[1];if(entry[0]==='CA')state.strokeAlpha=entry[1];}
    if(op!==pdfjs.OPS.showText)continue;
    const glyphs=args[0]||[],shown=glyphs.filter(g=>g&&typeof g==='object').map(g=>g.unicode||'').join(''),needle=compact(shown).value;
    if(!needle)continue;const at=source.value.indexOf(needle,cursor);if(at>=0)cursor=at+needle.length;
    const invisible=state.mode===3||(state.mode===0&&(state.fillAlpha===0||state.transparent))||(state.mode===1&&state.strokeAlpha===0)||(state.mode===2&&state.fillAlpha===0&&state.strokeAlpha===0);
    if(invisible){const start=at>=0?baseOffset+source.map[at]:undefined,end=at>=0?baseOffset+source.map[at+needle.length-1]+1:undefined;findings.push({code:'pdf-invisible-text',severity:'high',title:'PDF text is explicitly non-painting or transparent',source:`PDF page ${page}`,page,start,end,evidence:shown.slice(0,300),excludeFromScoring:at>=0,explanation:'The PDF operator state explicitly hides this text. It remains in the raw stream; mapped hidden characters are excluded from this app’s score.'});}
  }
  return findings;
}

// Shared by the browser and integration tests; renderPage supplies the platform canvas.
export async function extractPDFDocument(pdf,pdfjs,{name='Resume.pdf',renderPage}={}){
  if(pdf.numPages>30)throw new Error('This PDF has more than 30 pages. Upload the resume rather than a portfolio.');
  const pages=[],streams=[],hyperlinks=[],headerHyperlinks=[],forensicFindings=[];let tables=0,drawings=0,imageCount=0,offset=0,previewBytes=0,visibilityInspected=false;
  for(let p=1;p<=pdf.numPages;p++){
    const page=await pdf.getPage(p),viewport=page.getViewport({scale:1}),content=await page.getTextContent({includeMarkedContent:false}),segments=[];let stream='';
    for(const [order,item]of content.items.entries()){
      if(!('str'in item))continue;
      const transform=pdfjs.Util.transform(viewport.transform,item.transform),height=Math.hypot(transform[2],transform[3])||item.height,start=offset+stream.length;
      segments.push({text:item.str,x:transform[4],y:transform[5]-height,width:item.width,height,order,font:item.fontName,start,end:start+item.str.length});
      stream+=item.str+(item.hasEOL?'\n':item.str.endsWith(' ')?'':' ');
    }
    // Retain native order and exact per-page whitespace for stable source offsets.
    const record={number:p,width:viewport.width,height:viewport.height,segments};
    const annotations=await page.getAnnotations();
    for(const annotation of annotations){
      if(annotation.url&&/^https?:\/\//i.test(annotation.url)){hyperlinks.push(annotation.url);const [a,b,c,d,e,f]=viewport.transform,[x1,y1,x2,y2]=annotation.rect;const rect=[a*x1+c*y1+e,b*x1+d*y1+f,a*x2+c*y2+e,b*x2+d*y2+f];if(Math.min(rect[1],rect[3])<140)headerHyperlinks.push(annotation.url);}
      const unsafe=annotation.unsafeUrl||annotation.url;
      if(unsafe&&/^(?:javascript|file|data):/i.test(unsafe))forensicFindings.push({code:'unsafe-link',severity:'high',title:'Non-web link action',source:`PDF page ${p}`,page:p,evidence:unsafe.slice(0,250),explanation:'This link is displayed as evidence only and is not made clickable.'});
    }
    const tree=await page.getStructTree().catch(()=>null);const countTables=node=>{if(!node)return;if(node.role==='Table')tables++;node.children?.forEach(countTables);};countTables(tree);
    const operators=await page.getOperatorList();drawings+=operators.fnArray.filter(fn=>fn===pdfjs.OPS.constructPath).length;imageCount+=operators.fnArray.filter(fn=>fn===pdfjs.OPS.paintImageXObject||fn===pdfjs.OPS.paintInlineImageXObject).length;
    forensicFindings.push(...inspectPDFOperators(operators,pdfjs,stream,offset,p));
    for(const segment of segments.filter(s=>s.text.trim()&&s.height>0&&s.height<3))forensicFindings.push({code:'pdf-tiny-text',severity:'review',title:'Very small PDF text',source:`PDF page ${p}`,page:p,start:segment.start,end:segment.end,evidence:segment.text.slice(0,200),explanation:`The text height is ${segment.height.toFixed(1)} pt. Small text can be legitimate; inspect whether it is intended to be read.`});
    if(renderPage){
      try{
        const raster=await renderPage(page,viewport);visibilityInspected=true;
        for(const segment of segments.filter(s=>s.text.trim()&&s.width>1&&s.height>1)){
          const assessment=assessRasterRegion(raster.imageData,segment,raster.scale);
          segment.visibility=assessment.visibility;segment.contrast=assessment.contrast;
          if(['not-visible','low-contrast'].includes(assessment.visibility))forensicFindings.push({code:'pdf-low-contrast',severity:'review',title:'Text has little visible contrast in the rendered page',source:`PDF page ${p}`,page:p,start:segment.start,end:segment.end,evidence:segment.text.slice(0,200),explanation:'This is a pixel-contrast heuristic, not proof of concealment. White text, covered text, clipping or rendering differences can cause it.'});
          if(segment.x+segment.width<=0||segment.y+segment.height<=0||segment.x>=viewport.width||segment.y>=viewport.height)forensicFindings.push({code:'pdf-off-page',severity:'high',title:'Text is completely outside the page',source:`PDF page ${p}`,page:p,start:segment.start,end:segment.end,evidence:segment.text.slice(0,200),excludeFromScoring:true,explanation:'The run has selectable text but its bounding box is entirely off the page. It is excluded from the local score.'});
        }
        if(raster.preview&&raster.preview.length<350000&&previewBytes+raster.preview.length<1500000){record.preview=raster.preview;previewBytes+=raster.preview.length;}
      }catch{record.previewUnavailable=true;forensicFindings.push({code:'preview-unavailable',severity:'info',title:'Rendered-page inspection unavailable',source:`PDF page ${p}`,page:p,evidence:'Text extraction still completed.',explanation:'The preview could not be rendered. This page has not had a pixel-contrast check.'});}
    }
    pages.push(record);streams.push(stream);offset+=stream.length+2;page.cleanup();
  }
  const text=streams.join('\n\n'),geometry=inspectGeometry(pages);
  if(text.length>250000)throw new Error('Extracted text exceeds 250,000 characters.');
  if(tables)geometry.issues.push({code:'tables',severity:'warning',message:`${tables} tagged PDF tables detected. Inspect reading order.`});
  const metadata=await pdf.getMetadata().catch(()=>null),info=metadata?.info||{};
  const producer=[info.Creator,info.Producer].filter(Boolean).join(' | ');
  if(/ChatGPT|OpenAI|Claude|Copilot|Gemini/i.test(producer))forensicFindings.push({code:'tool-metadata',severity:'info',title:'Document metadata names an AI-related tool',source:'PDF metadata',evidence:producer.slice(0,300),explanation:'Metadata describes document creation software, not reliable text authorship.'});
  const actions=await pdf.getJSActions?.().catch(()=>null);
  if(actions&&Object.keys(actions).length)forensicFindings.push({code:'pdf-active-content',severity:'high',title:'Embedded PDF JavaScript actions',source:'PDF catalog',evidence:Object.keys(actions).join(', '),explanation:'Action names were inspected as data. Embedded JavaScript is never executed by this app.'});
  return {text,extraction:{...geometry,name,type:'pdf',tables,textboxes:0,hyperlinks,headerHyperlinks,drawings,imageCount,segments:pages,forensicFindings,visibilityInspected,metadata:{creator:info.Creator||null,producer:info.Producer||null},sourceStream:'PDF.js selectable text in native item order. The page image is rendered from the original PDF; overlays do not invent missing text.'}};
}
