import {PRESETS,DEFAULT_APPLICATION} from './data.js';

export const WORKSPACE_VERSION=2;
export const STEPS=[{id:'setup',number:'01',label:'Resume & role'},{id:'review',number:'02',label:'Review findings'},{id:'improve',number:'03',label:'Improve & export'}];
export const REVIEW_TABS=[{id:'summary',label:'Findings'},{id:'skills',label:'Skill evidence'},{id:'platforms',label:'ATS simulator'},{id:'pipeline',label:'Parsed text'},{id:'security',label:'AI Detector'}];
const plainExtraction=()=>({type:'text',name:'Pasted resume',geometryVerified:false,issues:[],tables:0,textboxes:0,hyperlinks:[],pages:[]});
export function newWorkspace(asOf) {
  return {version:WORKSPACE_VERSION,draft:{text:'',jd:PRESETS.aero.jd,domain:'aero',extraction:plainExtraction(),application:{...DEFAULT_APPLICATION},asOf,criteria:null},analysisInputs:null,company:'',isExample:false,applicationReviewed:false};
}
export function restoreWorkspace(raw,asOf) {
  const fresh=newWorkspace(asOf);
  if(!raw||typeof raw!=='object')return fresh;
  const clean=input=>{
    if(!input||typeof input.text!=='string'||typeof input.jd!=='string')return null;
    const application=Object.fromEntries(Object.entries(DEFAULT_APPLICATION).map(([key,value])=>[key,typeof input.application?.[key]===typeof value?input.application[key]:value]));
    const extraction=input.extraction&&Array.isArray(input.extraction.issues)?{...plainExtraction(),...input.extraction}:plainExtraction();
    for(const key of ['pages','hyperlinks','headerHyperlinks'])if(!Array.isArray(extraction[key]))extraction[key]=[];
    if(!['text','pdf','docx'].includes(extraction.type))extraction.type='text';
    if(typeof extraction.name!=='string')extraction.name='Pasted resume';
    if(extraction.segments&&!Array.isArray(extraction.segments))delete extraction.segments;
    return {text:input.text.slice(0,250000),jd:input.jd.slice(0,50000),domain:PRESETS[input.domain]?input.domain:'aero',application,extraction,asOf:typeof input.asOf==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(input.asOf)?input.asOf:asOf,criteria:Array.isArray(input.criteria)?input.criteria.filter(c=>typeof c==='string').slice(0,5):null};
  };
  if(raw.version===WORKSPACE_VERSION){
    const draft=clean(raw.draft)||fresh.draft;
    return {...fresh,draft,analysisInputs:clean(raw.analysisInputs),company:typeof raw.company==='string'?raw.company.slice(0,120):'',isExample:!!raw.isExample,applicationReviewed:!!raw.applicationReviewed};
  }
  // Earlier drafts are retained as inputs, never presented as a fresh analysis.
  return {...fresh,draft:clean(raw)||fresh.draft,company:typeof raw.company==='string'?raw.company.slice(0,120):''};
}
export function changeDomain(draft,domain){
  if(!PRESETS[domain])return draft;
  const usesPreset=draft.jd===PRESETS[draft.domain]?.jd;
  return {...draft,domain,...(usesPreset?{jd:PRESETS[domain].jd,criteria:null}:{})};
}
export function reviewFingerprint(input) {
  if(!input)return '';
  const {segments,...extraction}=input.extraction||{};
  return JSON.stringify({...input,extraction});
}
export function isReviewStale(draft,analysisInputs) {
  return !analysisInputs||reviewFingerprint(draft)!==reviewFingerprint(analysisInputs);
}
export function validateReview(input) {
  const inspectableFile=(input.extraction?.type==='pdf'&&input.extraction.pages?.length>0)||(input.extraction?.type==='docx'&&input.extraction.sourceRegions?.length>0);
  if(!input.text.trim()&&!inspectableFile)return 'Add your resume first. Upload a file or paste the text.';
  if(!input.jd.trim())return 'Add a job description, or choose “Use example job description”.';
  if(input.criteria&&input.criteria.filter(c=>c.trim()).length<3)return 'Add 3–5 recruiter criteria, or reset the criteria to the job description.';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(input.asOf))return 'Choose a valid review date.';
  return null;
}
export function reviewTasks(result,{applicationReviewed=false}={}) {
  const tasks=[];
  if(applicationReviewed&&!result.gate.passed)tasks.push({id:'application',title:'Review the application requirements',detail:`${result.gate.fails.length} answers conflict with this scenario. Check the role’s requirements before applying.`,destination:'application',action:'Check answers'});
  const structural=result.layoutProblems.filter(i=>i.severity!=='info');
  if(structural.length)tasks.push({id:'layout',title:'Check what survives document parsing',detail:`${structural.length} layout or date findings may change how your experience is read.`,destination:'pipeline',action:'Inspect parsed text'});
  const orphans=result.matched.filter(s=>s.IsOrphanSkill);
  if(orphans.length)tasks.push({id:'anchoring',title:'Show where you used your skills',detail:`${orphans.slice(0,3).map(s=>s.CanonicalName).join(', ')}${orphans.length>3?` and ${orphans.length-3} more`:''} ${orphans.length===1?'has':'have'} no dated project evidence.`,destination:'improve',check:2,action:'Improve a bullet'});
  const missing=result.jdInfo.required.filter(id=>!result.skills.some(s=>s.TaxonomyID===id));
  if(missing.length)tasks.push({id:'coverage',title:'Review missing job requirements',detail:`${missing.length} required engineering concepts weren’t found. Add evidence only for skills you actually have.`,destination:'skills',action:'Review skill evidence'});
  const dual=result.dualAudit.filter(d=>!d.hasFull||!d.hasAcronym);
  if(dual.length)tasks.push({id:'terms',title:'Write technical terms in both forms',detail:`${dual.length} concepts need a full phrase or acronym so literal searches can find them.`,destination:'improve',check:1,action:'Review replacements'});
  if(!result.titleMatch||result.headlineCoverage<1)tasks.push({id:'headline',title:'Make the target role clear',detail:'Place the role title and the relevant skills you can support near the top of your resume.',destination:'improve',check:3,action:'Draft a headline'});
  if(!result.contact.PortfolioInHeader)tasks.push({id:'portfolio',title:'Make your engineering portfolio easy to find',detail:'Add a main-body link to your CAD, simulation or hardware work near your contact details.',destination:'improve',check:4,action:'Check portfolio'});
  if(!tasks.length)tasks.push({id:'complete',title:'Review the document before applying',detail:'The configured checks pass. Confirm your dates, evidence and portfolio, then export your current draft.',destination:'improve',check:4,action:'Review and export'});
  return tasks;
}
