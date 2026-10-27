import test from 'node:test';
import assert from 'node:assert/strict';
import {newWorkspace,restoreWorkspace,isReviewStale,validateReview,reviewTasks,changeDomain} from '../src/workflow.js';
import {platformGuide,recruiterOutcome,PLATFORM_GUIDES} from '../src/recruiter.js';
import {analyze} from '../src/engine.js';
import {PRESETS,sampleResume} from '../src/data.js';

const day='2026-10-27';
const draft=(strong=true)=>({...newWorkspace(day).draft,text:sampleResume('aero',strong)});
const result=(strong=true,extra={})=>analyze({...draft(strong),...extra});

test('new workspace begins empty, with no invented review or confirmed answers',()=>{
  const w=newWorkspace(day);assert.equal(w.draft.text,'');assert.equal(w.analysisInputs,null);assert.equal(w.applicationReviewed,false);assert.ok(validateReview(w.draft).startsWith('Add your resume'));
});
test('resume and JD edits invalidate the analyzed snapshot independently',()=>{
  const original=draft();assert.equal(isReviewStale(original,original),false);
  assert.equal(isReviewStale({...original,text:original.text+'\nNew bullet'},original),true);
  assert.equal(isReviewStale({...original,jd:'Different job description'},original),true);
  assert.equal(original.text,sampleResume('aero',true));
});
test('application, criteria and analysis date changes invalidate exports',()=>{
  const original=draft();
  for(const change of [{asOf:'2026-09-01'},{criteria:['One','Two','Three']},{application:{...original.application,notice:'90'}}])assert.ok(isReviewStale({...original,...change},original));
});
test('coordinate display data alone does not make otherwise identical findings stale',()=>{
  const original=draft();const copy={...original,extraction:{...original.extraction,segments:[{number:1,segments:[]}]}};
  assert.equal(isReviewStale(original,copy),false);
  assert.equal(isReviewStale({...original,extraction:{...original.extraction,collision:true}},copy),true);
});
test('session restore preserves unsaved draft and analyzed version separately',()=>{
  const w=newWorkspace(day),analyzed=draft();w.analysisInputs=analyzed;w.draft={...analyzed,text:analyzed.text+'\nUnreviewed change'};
  const restored=restoreWorkspace(JSON.parse(JSON.stringify(w)),day);
  assert.equal(restored.draft.text,w.draft.text);assert.equal(restored.analysisInputs.text,analyzed.text);assert.ok(isReviewStale(restored.draft,restored.analysisInputs));
});
test('older sessions retain resume input without pretending it has just been reviewed',()=>{
  const legacy={...draft(),company:'Hardware Team'};const restored=restoreWorkspace(legacy,day);
  assert.equal(restored.draft.text,legacy.text);assert.equal(restored.analysisInputs,null);assert.equal(restored.company,'Hardware Team');
});
test('damaged session values are safely normalized',()=>{
  for(const raw of [null,{},'bad',false,{version:2,draft:{text:null}}])assert.doesNotThrow(()=>restoreWorkspace(raw,day));
  const restored=restoreWorkspace({version:2,draft:{...draft(),asOf:null,application:{allowedYears:3},extraction:{issues:[],pages:'bad'}}},day);
  assert.equal(restored.draft.asOf,day);assert.equal(typeof restored.draft.application.allowedYears,'string');assert.deepEqual(restored.draft.extraction.pages,[]);assert.doesNotThrow(()=>analyze(restored.draft));
});
test('changing a domain updates example JDs and preserves a custom JD',()=>{
  const a=changeDomain(draft(),'ev');assert.equal(a.jd,PRESETS.ev.jd);assert.equal(a.domain,'ev');
  const custom={...draft(),jd:'My specific robotics vacancy'};assert.equal(changeDomain(custom,'robotics').jd,custom.jd);
});
test('review validation explains missing JD and invalid recruiter criteria',()=>{
  assert.match(validateReview({...draft(),jd:' '}),/job description/);
  assert.match(validateReview({...draft(),criteria:['One']}),/3–5/);
  assert.equal(validateReview(draft()),null);
});
test('recommended actions link weak-resume findings to specific tools',()=>{
  const actions=reviewTasks(result(false));assert.ok(actions.some(a=>a.destination==='pipeline'));assert.ok(actions.some(a=>a.id==='anchoring'&&a.check===2));assert.ok(actions.every(a=>a.title&&a.detail&&a.action));
});
test('unconfirmed example answers never masquerade as a passed gate',()=>{
  const r=result();for(const guide of PLATFORM_GUIDES){const outcome=recruiterOutcome(r,guide.id);assert.equal(outcome.kind,'pending');assert.match(outcome.title,/Confirm/);}
});
test('changing inputs after confirmation marks every platform outcome out of date',()=>{
  const r=result();for(const guide of PLATFORM_GUIDES){const outcome=recruiterOutcome(r,guide.id,{reviewed:true,stale:true});assert.equal(outcome.kind,'pending');assert.match(outcome.title,/Update/);}
});
test('all eight ATS models explain a failed form gate before resume matching',()=>{
  const input=draft();const r=result(true,{application:{...input.application,relocate:false}});
  for(const guide of PLATFORM_GUIDES){const outcome=recruiterOutcome(r,guide.id,{reviewed:true});assert.equal(outcome.kind,'blocked',guide.id);assert.match(outcome.reason,/relocation/i);assert.ok(outcome.next);}
});
test('Zoho distinguishes failed assessment from passing eligibility answers',()=>{
  const input=draft();const r=result(true,{application:{...input.application,assessment:'50'}});
  assert.equal(r.gate.passed,true);assert.match(recruiterOutcome(r,'zoho',{reviewed:true}).title,/assessment below threshold/);
});
test('a confirmed Ashby review references the actual evaluated criteria count',()=>{
  const r=result();assert.equal(recruiterOutcome(r,'ashby',{reviewed:true}).title,`${r.criteria.filter(c=>c.status==='Met').length} of ${r.criteria.length} criteria supported`);
});
test('unknown platform selection falls back to general review with an explanation',()=>{
  assert.equal(platformGuide('unknown').id,'general');assert.ok(platformGuide('unknown').description);assert.equal(PLATFORM_GUIDES.length,9);
});
test('platform-specific outcomes explain different workflow stages',()=>{
  const r=result();
  assert.match(recruiterOutcome(r,'greenhouse',{reviewed:true}).title,/Match · application review/);
  assert.match(recruiterOutcome(r,'workable',{reviewed:true}).title,/disqualifying answer/);
  assert.match(recruiterOutcome(r,'zoho',{reviewed:true}).title,/alignment · pre-screen passed/);
  assert.match(recruiterOutcome(r,'freshteam',{reviewed:true}).title,/rubric/);
});
test('graduate-requisition exception controls the main outcome as well as the details',()=>{
  const r=result();assert.match(recruiterOutcome(r,'workday',{reviewed:true,campus:true}).title,/Not graded/);
  assert.match(recruiterOutcome(r,'workday',{reviewed:true,campus:false}).title,/Simulated grade/);
});
