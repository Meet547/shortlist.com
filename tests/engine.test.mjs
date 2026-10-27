import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {analyze,normalizeDate,unionMonths,auditApplication,impactElements,upgradeBullet,outreachKit} from '../src/engine.js';
import {sampleResume,PRESETS,DEFAULT_APPLICATION} from '../src/data.js';
import {evaluateQuery,highlightParts} from '../src/boolean.js';
import {inspectGeometry} from '../src/geometry.js';
import {extractPDFDocument} from '../src/pdf-core.js';

const AS_OF='2026-10-27';
const run=(text,extra={})=>analyze({text,jd:PRESETS.aero.jd,domain:'aero',application:DEFAULT_APPLICATION,asOf:AS_OF,...extra});
const skill=(r,name)=>r.skills.find(s=>s.CanonicalName===name);

test('all four domains produce repeatable evidence-based improvement',()=>{
  for(const domain of Object.keys(PRESETS)){
    const args={jd:PRESETS[domain].jd,domain};
    const weak=run(sampleResume(domain,false),args),strong=run(sampleResume(domain,true),args);
    assert.ok(weak.total<65,`${domain} weak ${weak.total}`);
    assert.ok(strong.total>=90,`${domain} strong ${strong.total}`);
    assert.deepEqual(strong,run(sampleResume(domain,true),args));
    assert.equal(strong.total,Math.round(strong.pillars.reduce((n,p)=>n+p.earned,0)*10)/10);
    for(const p of strong.pillars)assert.ok(p.earned>=0&&p.earned<=p.max);
  }
});
test('flat skill list receives zero experience and null last use',()=>{
  const r=run('Candidate\nTECHNICAL SKILLS\nSOLIDWORKS, FEA');
  assert.equal(skill(r,'SOLIDWORKS').MonthsOfExperience,0);
  assert.equal(skill(r,'SOLIDWORKS').LastUsedDate,null);
  assert.equal(skill(r,'SOLIDWORKS').ContextualWeight,.25);
  assert.equal(skill(r,'SOLIDWORKS').IsOrphanSkill,true);
});
test('dated bullet inherits scope, dates and exact source evidence',()=>{
  const line='- Designed a chassis in SOLIDWORKS, reducing mass by 12%.';
  const r=run(`Candidate\nEXPERIENCE\nAcme — Design Intern | Jan 2026 – Jul 2026\n${line}`);
  const s=skill(r,'SOLIDWORKS');assert.equal(s.MonthsOfExperience,6);assert.equal(s.LastUsedDate,'2026-07');assert.equal(s.IsOrphanSkill,false);assert.equal(s.Evidence[0].quote,line);
  assert.equal(r.blocks[0].Organization,'Acme');assert.equal(r.blocks[0].RoleTitle,'Design Intern');
});
test('wrapped PDF bullet remains one impact-complete evidence item',()=>{
  const text='Candidate\nPROJECTS\nTeam — Design Lead | Jan 2026 - Jul 2026\n- Designed a chassis in SOLIDWORKS,\nreducing mass by 12%.';
  const r=run(text);assert.equal(r.bullets.length,1);assert.ok(r.bullets[0].complete);assert.ok(text.includes(r.bullets[0].text));
});
test('concurrent experience intervals are unioned rather than added',()=>{
  const text='Candidate\nPROJECTS\nTeam A — Lead | Jan 2026 - Jul 2026\n- Designed a chassis in SOLIDWORKS.\nTeam B — Intern | Mar 2026 - Sep 2026\n- Designed a bracket in SOLIDWORKS.';
  assert.equal(skill(run(text),'SOLIDWORKS').MonthsOfExperience,8);
  assert.equal(unionMonths([['2026-01','2026-07'],['2026-03','2026-09'],['2026-10','2026-11']]),9);
});
test('skills in role headers do not inherit bullet evidence',()=>{
  const r=run('Candidate\nPROJECTS\nSOLIDWORKS Team — Lead | Jan 2026 - Jul 2026\n- Fabricated a bracket.');
  assert.equal(skill(r,'SOLIDWORKS').MonthsOfExperience,0);
});
test('future, reversed and seasonal ranges do not grant experience',()=>{
  for(const date of ['Jul 2026 - Jan 2026','Jan 2027 - Jul 2027','Summer 2025']){
    const r=run(`Candidate\nPROJECTS\nTeam — Lead | ${date}\n- Designed chassis in SOLIDWORKS.`);assert.equal(skill(r,'SOLIDWORKS').MonthsOfExperience,0);
  }
});
test('Present uses the explicit analysis date deterministically',()=>{
  const r=run('Candidate\nEXPERIENCE\nAcme — Intern | 01/2026 - Present\n- Designed a bracket in SOLIDWORKS.');
  assert.equal(skill(r,'SOLIDWORKS').MonthsOfExperience,9);assert.equal(skill(r,'SOLIDWORKS').LastUsedDate,'2026-10');
  assert.equal(normalizeDate('September 2025',AS_OF),'2025-09');assert.equal(normalizeDate('2026-03',AS_OF),'2026-03');
  assert.equal(normalizeDate('13/2026',AS_OF),null);
});
test('negated experience is not accepted as a skill anchor',()=>{
  const r=run('Candidate\nPROJECTS\nTeam — Lead | Jan 2026 - Jul 2026\n- No experience with SOLIDWORKS.');
  assert.ok(skill(r,'SOLIDWORKS').IsOrphanSkill);
});
test('creative headers zone into Unclassified_Text',()=>{
  const r=run('Candidate\nMY ENGINEERING JOURNEY\nAcme | SOLIDWORKS');assert.equal(r.document.zones.Unclassified_Text.length,1);assert.equal(r.document.creative.length,1);
});
test('dual-token audit requires both explicit forms',()=>{
  const one=run('Candidate\nTECHNICAL SKILLS\nFEA');const two=run('Candidate\nTECHNICAL SKILLS\nFinite Element Analysis (FEA)');
  assert.equal(one.dualAudit.find(x=>x.name==='FEA').hasFull,false);assert.equal(two.dualAudit.find(x=>x.name==='FEA').hasFull,true);
});
test('every Ashby-style evidence quote exists verbatim in the resume',()=>{
  const text=sampleResume('aero',true),r=run(text);for(const criterion of r.criteria)for(const e of criterion.evidence)assert.ok(text.includes(e.quote));
  const absent=run('Candidate\nEDUCATION\nB.Tech Mechanical Engineering');assert.ok(absent.criteria.some(c=>c.status==='Not Met'&&c.evidence.length===0));
});
test('empty input earns zero; unknown-JD concepts never create NaN scores',()=>{
  assert.equal(run('').total,0);
  const r=run('Candidate',{jd:'Custom novel engineering requirements'});assert.ok(Number.isFinite(r.total));assert.ok(r.total<=100);
});
test('all seven configured hard gates produce explicit failures',()=>{
  const a={...DEFAULT_APPLICATION,graduation:'2028',notice:'90',duration:'2',relocate:false,authorization:false,degree:false,compensation:'₹ 5-8 LPA'};
  const gate=auditApplication(a);assert.equal(gate.fails.length,7);assert.equal(gate.passed,false);
  const r=run(sampleResume('aero',true),{application:a});assert.equal(r.pillars[4].earned,0);assert.ok(r.gate.fails.some(f=>f.id==='format'));
});
test('assessment gate and salary warning stay separate from fatal gates',()=>{
  const gate=auditApplication({...DEFAULT_APPLICATION,assessment:'70',compensation:'20'});assert.equal(gate.passed,true);assert.equal(gate.assessmentPassed,false);assert.equal(gate.warnings.length,1);
  assert.equal(auditApplication({...DEFAULT_APPLICATION,assessment:'abc'}).assessmentPassed,false);
});
test('employer settings are configurable and do not force false answers',()=>{
  const a={...DEFAULT_APPLICATION,graduation:'2027',allowedYears:'2026,2027',notice:'30',maxNotice:'30',duration:'3',minDuration:'3'};assert.equal(auditApplication(a).passed,true);
});
test('bullet writer refuses missing facts and preserves supplied numbers',()=>{
  assert.equal(upgradeBullet({action:'Designed',tool:'SOLIDWORKS',subsystem:'a chassis',metric:''}),null);
  assert.equal(upgradeBullet({action:'Designed',tool:'SOLIDWORKS',subsystem:'a chassis',metric:'reducing mass by 4.2 kg'}),'Designed a chassis using SOLIDWORKS, reducing mass by 4.2 kg.');
  assert.ok(impactElements('Designed a chassis in SOLIDWORKS with 0.05 mm tolerance.').complete);
  assert.equal(impactElements('Worked on SOLIDWORKS 85%.').complete,false);
});

const fields={text:'Mechanical engineer with SOLIDWORKS and Finite Element Analysis. Designed battery enclosures.',skills:'SOLIDWORKS FEA',title:'Mechanical Design Intern',education:'B.Tech in Mechanical Engineering',location:'Pune, Maharashtra'};
test('Boolean precedence, parentheses, negation and implicit AND',()=>{
  for(const q of ['Mechanical AND (SOLIDWORKS OR CATIA) NOT HVAC','Mechanical SOLIDWORKS','CATIA OR SOLIDWORKS AND Mechanical','(CATIA OR SOLIDWORKS) AND NOT Civil'])assert.equal(evaluateQuery(q,fields).passed,true,q);
  for(const q of ['Mechanical AND CATIA','NOT SOLIDWORKS','(CATIA OR NX) AND Mechanical'])assert.equal(evaluateQuery(q,fields).passed,false,q);
});
test('exact phrases, wildcard boundaries and engineering punctuation',()=>{
  assert.ok(evaluateQuery('"Finite Element Analysis" AND mech*',fields).passed);
  assert.equal(evaluateQuery('NX',{text:'ANSYS'}).passed,false);
  assert.ok(evaluateQuery('"C++" AND "GD&T"',{text:'C++ and GD&T'}).passed);
  assert.equal(evaluateQuery('"Element Finite"',fields).passed,false);
});
test('field-scoped groups query actual extracted fields',()=>{
  assert.ok(evaluateQuery('skills:(SOLIDWORKS OR CATIA) AND education:Mechanical AND title:Intern',fields).passed);
  assert.equal(evaluateQuery('title:SOLIDWORKS',fields).passed,false);
});
test('invalid Boolean syntax produces errors, never silent passes',()=>{
  for(const q of ['"unclosed','Mechanical AND','(Mechanical OR CATIA','Mechanical )',''])assert.ok(evaluateQuery(q,fields).error,q);
});
test('highlighting reconstructs the original stream without injecting HTML',()=>{
  const text='<script>alert(1)</script> SOLIDWORKS';const r=evaluateQuery('SOLIDWORKS',{text});const parts=highlightParts(text,r.leaves);assert.equal(parts.map(x=>x.text).join(''),text);assert.equal(parts.filter(x=>x.hit).length,1);
});
test('generated query requires every AND clause',()=>{
  const r=run(sampleResume('aero',true));assert.ok(r.search.passed);assert.ok(r.search.clauses.every(c=>c.passed));assert.ok(r.search.leaves.length>0);
});
test('coordinate diagnostics detect narrow column and margin contact',()=>{
  const segments=[];for(let i=0;i<8;i++){segments.push({text:'Left skills',x:40,y:100+i*20,width:210,height:10,order:i*2});segments.push({text:'Right project',x:267,y:100+i*20,width:220,height:10,order:i*2+1});}
  segments.push({text:'candidate@example.com',x:40,y:10,width:120,height:10,order:20});
  const r=inspectGeometry([{number:1,width:612,height:792,segments}]);assert.equal(r.collision,true);assert.equal(r.headerFooterContact,true);assert.ok(r.issues.some(i=>i.code==='column-collision'));
});
test('clean single-column coordinates do not create a collision',()=>{
  const segments=Array.from({length:10},(_,i)=>({text:'One line of text',x:50,y:70+i*20,width:450,height:10,order:i}));
  const r=inspectGeometry([{number:1,width:612,height:792,segments}]);assert.equal(r.collision,false);assert.equal(r.headerFooterContact,false);
});
test('normalized profile includes required skill metadata and local taxonomy IDs',()=>{
  const profile=run(sampleResume('aero',true)).profile;assert.ok(profile.CandidateProfile.ExperienceBlocks.length);for(const s of profile.CandidateProfile.ExtractedSkills){for(const key of ['CanonicalName','RawMatches','TaxonomyID','MonthsOfExperience','LastUsedDate','IsOrphanSkill','SourceSection'])assert.ok(key in s,key);assert.ok(s.TaxonomyID.startsWith('ENG:'));}
});
test('follow-up drafts stay within the requested 60–80 words in every domain',()=>{
  for(const domain of Object.keys(PRESETS))for(const strong of [false,true]){
    const r=run(sampleResume(domain,strong),{domain,jd:PRESETS[domain].jd});
    const kit=outreachKit(r,'Example Hardware Engineering Startup Team');
    assert.ok(kit.wordCount>=60&&kit.wordCount<=80,`${domain}: ${kit.wordCount}`);
  }
});

test('real sample PDFs: native text geometry and high/low scores differ',async()=>{
  const pdfjs=await import('pdfjs-dist/legacy/build/pdf.mjs');
  for(const domain of Object.keys(PRESETS))for(const type of ['orphan','anchored']){
    const bytes=new Uint8Array(await readFile(new URL(`../public/samples/${type}-${domain}.pdf`,import.meta.url)));
    const loadingTask=pdfjs.getDocument({data:bytes,useSystemFonts:true,isEvalSupported:false}),pdf=await loadingTask.promise;
    try{
      const {text,extraction}=await extractPDFDocument(pdf,pdfjs),r=run(text,{domain,jd:PRESETS[domain].jd,extraction});
      if(type==='orphan'){assert.ok(extraction.collision,domain);assert.ok(r.total<65,`${domain} risky ${r.total}`);}
      else{assert.equal(extraction.collision,false,domain);assert.ok(r.total>=90,`${domain} anchored ${r.total}`);assert.ok(r.blocks.every(b=>b.DateValid));assert.ok(extraction.hyperlinks.some(url=>url.includes('linkedin.com')));assert.ok(extraction.headerHyperlinks.some(url=>url.includes('linkedin.com')));}
      for(const c of r.criteria)for(const e of c.evidence)assert.ok(text.includes(e.quote));
    }finally{await loadingTask.destroy();}
  }
});
