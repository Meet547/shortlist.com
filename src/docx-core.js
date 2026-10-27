import {unzipSync,strFromU8} from 'fflate';
const descendants=(node,tag)=>[...node.getElementsByTagNameNS('*',tag)];
const attr=(node,name)=>node?.getAttribute(`w:${name}`)||node?.getAttribute(name)||'';
export function wordRunRisks({hidden=false,color='',size=null}){
  const risks=[];
  if(hidden)risks.push({code:'word-hidden-run',severity:'high',title:'Word hidden-text formatting',excludeFromScoring:true,explanation:'The run uses vanish/webHidden formatting. Its text is extracted for inspection but excluded from the local score.'});
  if(/^F{6}$/i.test(color))risks.push({code:'word-white-text',severity:'review',title:'White-font text in Word',explanation:'White font may be invisible on a white page, or legitimate on a dark background. Word is not rendered here; inspect the source document.'});
  if(size!==null&&size>0&&size<3)risks.push({code:'word-tiny-text',severity:'review',title:'Very small Word text',explanation:`The run font size is ${size} pt. Inspect whether it is intended to be readable.`});
  return risks;
}
export function extractDOCX(bytes,name,Parser=DOMParser){
  if(bytes[0]!==0x50||bytes[1]!==0x4b)throw new Error('This DOCX does not have an Office ZIP signature.');
  let expanded=0,entries;const filenames=[];
  try{entries=unzipSync(bytes,{filter:file=>{filenames.push(file.name);expanded+=file.originalSize;if(expanded>50*1024*1024)throw new Error('Expanded archive too large.');return /^word\/(?:document\.xml|styles\.xml|header\d*\.xml|footer\d*\.xml|_rels\/document\.xml\.rels)$/.test(file.name);}});}catch{throw new Error('The DOCX archive is damaged or exceeds the 50 MB expanded limit.');}
  if(!entries['word/document.xml'])throw new Error('The archive has no Word document body.');
  const parse=data=>{const doc=new Parser().parseFromString(strFromU8(data),'application/xml');if(doc.getElementsByTagName('parsererror').length)throw new Error('The DOCX contains invalid XML.');return doc;};
  const doc=parse(entries['word/document.xml']),forensicFindings=[],sourceRegions=[],styles=new Map();
  const properties=node=>{if(!node)return {};const hiddenNodes=descendants(node,'vanish').concat(descendants(node,'webHidden')),hidden=hiddenNodes.length?hiddenNodes.some(n=>!['0','false','off'].includes(attr(n,'val'))):null,color=attr(descendants(node,'color')[0],'val'),size=Number(attr(descendants(node,'sz')[0],'val'))/2;return {hidden,color,size:size||null};};
  if(entries['word/styles.xml'])for(const style of descendants(parse(entries['word/styles.xml']),'style'))styles.set(attr(style,'styleId'),{...properties(style),basedOn:attr(descendants(style,'basedOn')[0],'val')});
  const resolveStyle=(id,seen=new Set())=>{if(!id||seen.has(id)||!styles.has(id))return {};seen.add(id);const own=styles.get(id),base=resolveStyle(own.basedOn,seen);return {hidden:own.hidden??base.hidden??false,color:own.color||base.color||'',size:own.size??base.size??null};};
  const paragraphText=p=>{const walk=node=>{if(node!==p&&node.localName==='p')return '';if(node.localName==='t')return node.textContent;if(node.localName==='tab')return '\t';if(['br','cr'].includes(node.localName))return '\n';return [...node.childNodes].map(walk).join('');};return walk(p);};
  const paragraphs=descendants(doc,'p');let text='';
  for(const [index,p]of paragraphs.entries()){
    if(index)text+='\n';const paragraphStart=text.length,value=paragraphText(p);text+=value;
    const pStyle=resolveStyle(attr(descendants(p,'pStyle')[0],'val'));let cursor=0;
    for(const run of descendants(p,'r')){
      // Ignore nested textbox paragraphs here; they are visited independently.
      let parent=run.parentElement;while(parent&&parent.localName!=='p')parent=parent.parentElement;if(parent!==p)continue;
      const runText=paragraphText(run);if(!runText)continue;const local=value.indexOf(runText,cursor);if(local<0)continue;cursor=local+runText.length;
      const rStyle=resolveStyle(attr(descendants(run,'rStyle')[0],'val')),direct=properties(descendants(run,'rPr')[0]);
      const props={hidden:direct.hidden??rStyle.hidden??pStyle.hidden??false,color:direct.color||rStyle.color||pStyle.color||'',size:direct.size??rStyle.size??pStyle.size??null};
      for(const risk of wordRunRisks(props))forensicFindings.push({...risk,source:'Word document body',start:paragraphStart+local,end:paragraphStart+local+runText.length,evidence:runText.slice(0,300)});
    }
  }
  let headerFooterText='';
  for(const [path,data]of Object.entries(entries))if(/word\/(header|footer)/.test(path)){const content=descendants(parse(data),'p').map(paragraphText).join('\n');headerFooterText+=content+'\n';if(content.trim())sourceRegions.push({name:path.includes('header')?'Word header':'Word footer',text:content,inParserBody:false,status:'missing'});}
  if(!text.trim()&&!headerFooterText.trim())throw new Error('This Word document has no selectable paragraph text.');
  if(text.length>250000)throw new Error('Extracted text exceeds 250,000 characters.');
  const tables=descendants(doc,'tbl').length,nestedTables=descendants(doc,'tbl').filter(t=>{let parent=t.parentElement;while(parent){if(parent.localName==='tbl')return true;parent=parent.parentElement;}return false;}).length;
  const textboxes=descendants(doc,'txbxContent').length,floatingShapes=descendants(doc,'anchor').length,hyperlinks=[];
  if(entries['word/_rels/document.xml.rels'])for(const rel of descendants(parse(entries['word/_rels/document.xml.rels']),'Relationship')){const target=rel.getAttribute('Target')||'';if(rel.getAttribute('Type')?.endsWith('/hyperlink')&&/^https?:\/\//i.test(target))hyperlinks.push(target);else if(/^(?:javascript|data|file):/i.test(target))forensicFindings.push({code:'unsafe-link',severity:'high',title:'Non-web relationship target',source:'Word relationships',evidence:target.slice(0,300),explanation:'The relationship is inspected as data and never followed.'});}
  if(filenames.some(path=>/vbaProject\.bin$/i.test(path)))forensicFindings.push({code:'word-macro',severity:'high',title:'Macro payload in the Office archive',source:'Word ZIP entries',evidence:'vbaProject.bin',explanation:'A macro-bearing payload was found inside the archive. It is not loaded or executed. This scan is not an antivirus substitute.'});
  if(filenames.some(path=>/^word\/embeddings\//.test(path)))forensicFindings.push({code:'embedded-object',severity:'review',title:'Embedded Office object',source:'Word ZIP entries',evidence:filenames.filter(path=>/^word\/embeddings\//.test(path)).slice(0,5).join(', '),explanation:'Embedded objects are not executed or fully analyzed. Inspect the original document if these objects are unexpected.'});
  const issues=[];
  if(tables)issues.push({code:'tables',severity:'warning',message:`${tables} Word tables (${nestedTables} nested) detected. Cell text was extracted in XML order.`});
  if(textboxes||floatingShapes)issues.push({code:'textboxes',severity:'warning',message:`${textboxes} textboxes and ${floatingShapes} floating shapes detected. Check scope and reading order.`});
  const headerFooterContact=/@|(?:\+91[\s-]?)?\d{10}|linkedin|github|portfolio|20\d{2}/i.test(headerFooterText);
  if(headerFooterContact)issues.push({code:'header-footer',severity:'error',message:'Contact or date information is stored in Word header/footer XML, outside the main-body extraction stream.'});
  return {text,extraction:{type:'docx',name,geometryVerified:false,tables,nestedTables,textboxes,floatingShapes,hyperlinks,headerHyperlinks:[],headerFooterText,headerFooterContact,sourceRegions,forensicFindings,visibilityInspected:false,issues,pages:[],sourceStream:'Word body paragraphs in XML order. Header/footer text and hidden run formatting are inspected separately; Word page geometry is unavailable.'}};
}
