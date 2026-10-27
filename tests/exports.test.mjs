import test from 'node:test';
import assert from 'node:assert/strict';
import {exportFile} from '../src/exports.js';
import {analyze} from '../src/engine.js';
import {newWorkspace} from '../src/workflow.js';
import {sampleResume} from '../src/data.js';

const input={...newWorkspace('2026-10-27').draft,text:sampleResume('aero',true)};
const result=analyze(input);
test('resume export preserves exact reviewed text and line breaks',()=>{
  const file=exportFile('resume',{result,text:input.text,applicationReviewed:true});
  assert.equal(file.name,'resume-reviewed.txt');assert.equal(file.content,input.text);assert.equal(file.type,'text/plain;charset=utf-8');
});
test('audit export contains the actual score and confirmed-answer status',()=>{
  const file=exportFile('audit',{result,text:input.text,applicationReviewed:false});const data=JSON.parse(file.content);
  assert.equal(data.TotalScore,result.total);assert.equal(data.ApplicationAnswersConfirmed,false);assert.deepEqual(data.Pillars,result.pillars);assert.equal(data.Version,'2.0.0');
});
test('profile export preserves experience and skill evidence with confirmation metadata',()=>{
  const file=exportFile('profile',{result,text:input.text,applicationReviewed:true});const data=JSON.parse(file.content);
  assert.deepEqual(data.CandidateProfile.ExperienceBlocks,result.blocks);assert.equal(data.ApplicationAnswersConfirmed,true);assert.ok(data.CandidateProfile.ExtractedSkills.length);
});
test('every stale export is rejected even if called outside the disabled UI',()=>{
  for(const kind of ['resume','audit','profile'])assert.throws(()=>exportFile(kind,{result,text:input.text,applicationReviewed:true,stale:true}),/Update the review/);
});
