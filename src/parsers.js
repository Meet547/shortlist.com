import {extractPDFDocument} from './pdf-core.js';
import {extractDOCX} from './docx-core.js';
import workerURL from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
const MAX_BYTES=15*1024*1024;
export const textExtraction=(name='Pasted resume')=>({type:'text',name,geometryVerified:false,issues:[],tables:0,textboxes:0,hyperlinks:[],pages:[]});
export async function parseFile(file){
  if(file.size>MAX_BYTES)throw new Error('This file exceeds the 15 MB limit. Export a smaller text-based resume.');
  const ext=file.name.split('.').at(-1).toLowerCase(),bytes=new Uint8Array(await file.arrayBuffer());
  if(ext==='pdf')return parsePDF(bytes,file.name);
  if(ext==='docx')return extractDOCX(bytes,file.name);
  if(ext==='txt'){
    const text=new TextDecoder('utf-8',{fatal:true}).decode(bytes);if(text.includes('\0'))throw new Error('This file does not appear to be plain UTF-8 text.');
    if(text.length>250000)throw new Error('Resume text is too long (250,000 characters maximum).');return {text,extraction:textExtraction(file.name)};
  }
  throw new Error('Choose a .pdf, .docx or UTF-8 .txt file.');
}
async function parsePDF(bytes,name){
  if(!new TextDecoder().decode(bytes.slice(0,1024)).includes('%PDF-'))throw new Error('The file signature is not PDF. Renaming a file does not convert it.');
  const pdfjs=await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc=workerURL;
  const loadingTask=pdfjs.getDocument({data:bytes,isEvalSupported:false,useSystemFonts:true});
  try{
    let pdf;
    try{pdf=await loadingTask.promise;}
    catch(error){throw new Error(error.name==='PasswordException'?'This PDF is password-protected. Upload an unlocked copy.':'The PDF could not be read. It may be damaged or unsupported.');}
    return await extractPDFDocument(pdf,pdfjs,{name,renderPage:async(page,viewport)=>{
    const scale=Math.min(1.25,900/viewport.width),renderViewport=page.getViewport({scale}),canvas=document.createElement('canvas');
    canvas.width=Math.ceil(renderViewport.width);canvas.height=Math.ceil(renderViewport.height);
    const context=canvas.getContext('2d',{willReadFrequently:true});
    await page.render({canvasContext:context,viewport:renderViewport,background:'#ffffff'}).promise;
    const imageData=context.getImageData(0,0,canvas.width,canvas.height),preview=canvas.toDataURL('image/webp',.85);
    return {imageData,preview,scale};
  }});}finally{await loadingTask.destroy();}
}
