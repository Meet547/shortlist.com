// Evidence-based document inspection. This module never executes document content.
export const SECURITY_VERSION='1.0.0';
const CONTROL_NAMES={0x200b:'ZERO WIDTH SPACE',0x200c:'ZERO WIDTH NON-JOINER',0x200d:'ZERO WIDTH JOINER',0x2060:'WORD JOINER',0xfeff:'BYTE ORDER MARK / ZERO WIDTH NO-BREAK SPACE',0x00ad:'SOFT HYPHEN',0x202a:'LEFT-TO-RIGHT EMBEDDING',0x202b:'RIGHT-TO-LEFT EMBEDDING',0x202c:'POP DIRECTIONAL FORMATTING',0x202d:'LEFT-TO-RIGHT OVERRIDE',0x202e:'RIGHT-TO-LEFT OVERRIDE',0x2066:'LEFT-TO-RIGHT ISOLATE',0x2067:'RIGHT-TO-LEFT ISOLATE',0x2068:'FIRST STRONG ISOLATE',0x2069:'POP DIRECTIONAL ISOLATE',0x034f:'COMBINING GRAPHEME JOINER',0x061c:'ARABIC LETTER MARK'};
const INJECTION_RULES=[
  {id:'override',name:'Instruction override',pattern:/\b(?:ignore|disregard|override|forget)\s+(?:all\s+)?(?:the\s+)?(?:previous|prior|system|earlier|above)\s+(?:instructions?|rules?|prompts?)\b/gi},
  {id:'score-manipulation',name:'Instruction to manipulate evaluation',pattern:/\b(?:assign|give|award|return|output|set)\b[^\n.]{0,55}\b(?:score\s*(?:of|to|=|:)?\s*100(?:\s*\/\s*100)?|100\s*\/\s*100|maximum\s+score|perfect\s+score)\b/gi},
  {id:'rank-manipulation',name:'Instruction to override hiring review',pattern:/\b(?:rank|place|select|recommend|hire|advance)\s+(?:this|the|me\s+as\s+the)\s+(?:candidate|applicant|resume|application)\b[^\n.]{0,45}\b(?:first|top|best|regardless|automatically|immediately)\b/gi},
  {id:'role-delimiter',name:'Model role / instruction delimiter',pattern:/<\|(?:im_start|start_header_id)\|>\s*(?:system|assistant)|\[INST\]|<system>[^\n]{0,70}/gi},
  {id:'agent-address',name:'Instruction addressed to an evaluator',pattern:/\b(?:AI\s+(?:evaluator|reviewer|recruiter|assistant)|ATS\s+(?:evaluator|reviewer))\s*:\s*[^\n]{0,100}/gi},
  {id:'exfiltration',name:'Instruction to disclose protected information',pattern:/\b(?:send|reveal|exfiltrate|print|disclose)\s+(?:all\s+)?(?:the\s+)?(?:system\s+prompt|API\s+keys?|access\s+tokens?|passwords?|credentials)\b/gi}
];
const OMIT_FOR_INSPECTION=/[\u200b-\u200d\u2060\ufeff\u202a-\u202e\u2066-\u2069\u034f\u061c]/u;
export function inspectionText(text){
  let normalized='',offsets=[];
  for(let i=0;i<text.length;){const char=String.fromCodePoint(text.codePointAt(i));if(!OMIT_FOR_INSPECTION.test(char)){const form=char.normalize('NFKC');normalized+=form;for(let j=0;j<form.length;j++)offsets.push(i);}i+=char.length;}
  return {text:normalized,offsets};
}
const location=(text,offset)=>{const start=text.lastIndexOf('\n',Math.max(0,offset-1))+1;return {line:text.slice(0,offset).split('\n').length,column:offset-start+1};};
export function visibleControls(text){return [...text].map(char=>{const n=char.codePointAt(0);return CONTROL_NAMES[n]?`[U+${n.toString(16).toUpperCase().padStart(4,'0')}]`:char;}).join('');}
export function maskRanges(text,ranges){
  const valid=ranges.filter(r=>Number.isInteger(r.start)&&Number.isInteger(r.end)&&r.start>=0&&r.end>r.start&&r.end<=text.length).sort((a,b)=>a.start-b.start);
  let out='',at=0;
  for(const range of valid){if(range.end<=at)continue;const start=Math.max(at,range.start);out+=text.slice(at,start)+text.slice(start,range.end).replace(/[^\r\n]/g,' ');at=range.end;}
  return out+text.slice(at);
}
export function cleanZeroWidthSeparators(text){return text.replace(/[\u200b\u2060\ufeff]/gu,'');}
export function scanSecurity(text,extraction={}){
  const findings=[],excludedRanges=[],seen=new Set();
  const add=finding=>{const key=`${finding.code}:${finding.start??''}:${finding.source??''}:${finding.evidence??''}`;if(!seen.has(key)&&findings.length<300){seen.add(key);findings.push({id:`risk-${findings.length+1}`,severity:'review',...finding});}};
  const controls=new Map();
  for(let i=0;i<text.length;){const n=text.codePointAt(i),char=String.fromCodePoint(n);if(CONTROL_NAMES[n]&&!(n===0xfeff&&i===0)){const record=controls.get(n)||{offsets:[],count:0};record.count++;if(record.offsets.length<20)record.offsets.push(i);controls.set(n,record);}i+=char.length;}
  for(const [codepoint,record]of controls){const joiner=[0x200c,0x200d,0x061c].includes(codepoint),start=record.offsets[0];add({code:'unicode-control',severity:joiner?'info':'review',title:CONTROL_NAMES[codepoint],source:'Resume text',start,end:start+1,...location(text,start),count:record.count,codepoint:`U+${codepoint.toString(16).toUpperCase().padStart(4,'0')}`,evidence:visibleControls(text.slice(Math.max(0,start-35),start+45)),explanation:joiner?'This character can be required for Indic/Arabic shaping or emoji. Its presence is not evidence of AI or misconduct.':'Invisible formatting can affect matching or reading order. It is not an AI watermark or proof of misconduct.'});}
  const inspected=inspectionText(text);
  for(const rule of INJECTION_RULES){
    for(const match of inspected.text.matchAll(new RegExp(rule.pattern.source,rule.pattern.flags))){
      const start=inspected.offsets[match.index]??0,end=(inspected.offsets[match.index+match[0].length-1]??start)+1;
      const lineStart=text.lastIndexOf('\n',Math.max(0,start-1))+1,lineEnd=text.indexOf('\n',end)<0?text.length:text.indexOf('\n',end);
      const prefix=text.slice(lineStart,start),quotedResearch=/\b(?:detect|defen|mitigat|research|test|stud|example|quot|analyz|analys)\w*\b/i.test(prefix)&&/["'“‘]$/.test(prefix.trim());
      add({code:`prompt-${rule.id}`,severity:quotedResearch?'review':'high',title:rule.name,source:'Resume text',start,end,...location(text,start),evidence:visibleControls(text.slice(lineStart,Math.min(lineEnd,lineStart+350))),explanation:quotedResearch?'This resembles an attack example quoted in a project. Review the context; it is not automatically excluded.':'An instruction to an evaluator appears in candidate content. This line is treated as untrusted data and excluded from local scoring.'});
      if(!quotedResearch)excludedRanges.push({start:lineStart,end:lineEnd,reason:rule.name,code:`prompt-${rule.id}`});
    }
  }
  for(const match of text.matchAll(/\b(?:as an AI (?:language )?model|here(?:'s| is) (?:your|a) (?:tailored |optimized )?(?:resume|cover letter)|\[insert (?:your |a )?(?:name|metric|company|experience)[^\]]*\])/gi))add({code:'generation-residue',severity:'info',title:'Possible writing-tool or template residue',source:'Resume text',start:match.index,end:match.index+match[0].length,...location(text,match.index),evidence:match[0],explanation:'This is a literal drafting artifact, not a reliable AI-authorship finding. Check whether it belongs in the final resume.'});
  for(const match of text.matchAll(/(?:[A-Za-z0-9+/]{80,}={0,2})/g)){
    if(match[0].length>16000)continue;
    try{const decoded=atob(match[0]),plain=inspectionText(decoded).text;const rule=INJECTION_RULES.find(r=>new RegExp(r.pattern.source,'i').test(plain));if(rule){add({code:'encoded-instruction',severity:'high',title:'Encoded instruction payload',source:'Resume text',start:match.index,end:match.index+match[0].length,...location(text,match.index),evidence:decoded.slice(0,250),explanation:'A Base64-looking string decodes to a recognized evaluator instruction. The payload is shown as text and is never executed.'});excludedRanges.push({start:match.index,end:match.index+match[0].length,reason:'Encoded evaluator instruction',code:'encoded-instruction'});}}catch{}
  }
  const duplicate=new Map();let offset=0;
  for(const line of text.split('\n')){const key=line.trim().toLowerCase();if(key.length>75&&/^[-•]/.test(key)){const prior=duplicate.get(key);if(prior===2)add({code:'repeated-bullet',title:'Repeated bullet text',source:'Resume text',start:offset,end:offset+line.length,...location(text,offset),evidence:line,explanation:'The same long bullet appears at least three times. Check for accidental duplication or keyword stuffing; repetition is not proof of AI writing.'});duplicate.set(key,(prior||0)+1);}offset+=line.length+1;}
  for(const risk of extraction.forensicFindings||[]){
    add({...Number.isInteger(risk.start)?location(text,risk.start):{},...risk,source:risk.source||'Document structure'});
    if(risk.excludeFromScoring&&Number.isInteger(risk.start)&&Number.isInteger(risk.end))excludedRanges.push({start:risk.start,end:risk.end,reason:risk.title,code:risk.code});
  }
  const merged=[];
  for(const range of excludedRanges.filter(r=>r.start>=0&&r.end<=text.length&&r.end>r.start).sort((a,b)=>a.start-b.start)){const previous=merged.at(-1);if(previous&&range.start<=previous.end){previous.end=Math.max(previous.end,range.end);if(!previous.reason.includes(range.reason))previous.reason+='; '+range.reason;}else merged.push({...range});}
  excludedRanges.splice(0,excludedRanges.length,...merged);
  const scoreText=maskRanges(text,excludedRanges);
  return {version:SECURITY_VERSION,authorship:{status:'Undetermined',probability:null,explanation:'This local audit cannot reliably establish AI authorship or identify a universal AI text watermark.'},findings,excludedRanges,scoreText,counts:{high:findings.filter(f=>f.severity==='high').length,review:findings.filter(f=>f.severity==='review').length,info:findings.filter(f=>f.severity==='info').length,excludedCharacters:text.length-scoreText.replace(/ /g,'').length-(text.length-text.replace(/ /g,'').length)},coverage:[{name:'Evaluator / prompt-injection patterns',state:'checked'},{name:'Invisible Unicode and directional controls',state:'checked'},{name:'Encoded instruction patterns',state:'checked'},{name:'Template and generation residue',state:'checked'},{name:'Hidden document formatting',state:extraction.type==='docx'||extraction.visibilityInspected?'checked':'unavailable'},{name:'AI authorship, proprietary watermarks and exhaustive malware analysis',state:'not supported'}]};
}
