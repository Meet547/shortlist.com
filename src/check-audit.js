import {SKILLS} from './data.js';
export const SCORE_MODEL={id:'shortlist-rules-v1',engine:'Local deterministic rules',aiModel:null,weights:[20,25,25,15,15]};
export const VENDOR_REFERENCES={
  workday:{title:'Workday: HiredScore grades',url:'https://stage.doc.workday.com/hiredscore/en-us/workday-hiredscore/recruiter-productivity-/concept--hiredscore-grades.html',limitation:'Grade letters and qualification-based prioritization are documented. This app does not reproduce Workday’s LLM or proprietary grade calculation.'},
  greenhouse:{title:'Greenhouse: Application rules',url:'https://support.greenhouse.io/hc/en-us/articles/203105595-Application-rules-overview',limitation:'Configured form rules are documented. Matching-tier thresholds and delay examples here are local assumptions.'},
  lever:{title:'Lever: Operating the Archive',url:'https://help.lever.co/s/article/Operating-the-Archive',limitation:'Conditional auto-archive is documented. Fast-forward is an explicitly enabled local form scenario; no matching-score threshold is attributed to Lever.'},
  ashby:{title:'Ashby: AI-assisted application review',url:'https://docs.ashbyhq.com/ai-assisted-application-review',limitation:'Resume criteria and evidence-based evaluation are documented. This app uses supported lexical rules and flags unsupported criteria for manual review.'},
  zoho:{title:'Zoho: Candidate Matches',url:'https://help.zoho.com/portal/en/kb/recruit/zia/zia-matches/articles/candidate-matches',limitation:'Skill-based matching is documented. The 45/25/20/10 weights and pre-screen threshold here are app-defined.'},
  workable:{title:'Workable: Application form questions',url:'https://help.workable.com/hc/en-us/articles/115012087467-What-types-of-questions-can-I-add-to-my-application-form',limitation:'Optional disqualification on designated No answers is documented. Other filters in this app are scenario settings.'},
  darwinbox:{title:'Darwinbox / Keka scenario',url:null,limitation:'Notice, pay, degree and contextual-skill checks are local scenarios. Proprietary ranking behavior has not been validated.'},
  freshteam:{title:'Freshteam / Kula scenario',url:null,limitation:'This combines a local multi-condition form gate with an app-defined rubric. It is not a validated implementation of either vendor’s internal scoring.'}
};
const state=pass=>pass?'pass':'gap';
export function scoreExecutionAudit(result){
  const checks=result.pillars.flatMap((pillar,p)=>pillar.items.map((item,i)=>({id:`score-${p+1}-${i+1}`,name:item.name,category:pillar.short,earned:item.earned,max:item.max,status:item.earned===item.max?'pass':item.earned>0?'partial':'gap',rule:item.explanation,basis:'App-defined score model',executed:true})));
  const sum=Math.round(result.pillars.reduce((n,p)=>n+p.earned,0)*10)/10;
  return {...SCORE_MODEL,checks,total:result.total,recomputedTotal:sum,max:result.pillars.reduce((n,p)=>n+p.max,0),consistent:sum===result.total,excludedCharacters:result.security.excludedRanges.reduce((n,r)=>n+r.end-r.start,0)};
}
export function platformExecutionAudit(result,id,{reviewed=false,stale=false,campus=false}={}){
  const ready=reviewed&&!stale,reference=VENDOR_REFERENCES[id]||null,checks=[];
  const add=(key,name,pass,observed,rule,basis='Local approximation',evidence=[])=>checks.push({id:key,name,status:ready?state(pass):'not-run',observed,rule,basis,evidence,executed:ready});
  const a=result.gate.answers,fail=new Set(result.gate.fails.map(f=>f.id));
  for(const [key,name,value,rule]of [
    ['year','Graduation cohort',a.graduation,`Allowed: ${a.allowedYears}`],['notice','Joining availability',`${a.notice||'unspecified'} days`,`Maximum: ${a.maxNotice} days`],['duration','Full-time availability',`${a.duration} months`,`Minimum: ${a.minDuration} months`],['relocate','On-site / relocation',a.relocate?'Yes':'No',`Required on-site in ${a.city}`],['authorization','Work authorization',a.authorization?'Yes':'No','Designated positive eligibility question'],['degree','Degree answer',a.degree?'Yes':'No','Designated positive eligibility question'],['format','Numeric compensation',a.compensation,'One numeric value; no currency symbols or ranges']
  ])add(`form-${key}`,name,!fail.has(key),value,rule,['workable','greenhouse','lever'].includes(id)&&['relocate','authorization','degree'].includes(key)?'Documented workflow; scenario question':'Scenario rule');
  if(['workday','general'].includes(id)){
    for(const skillId of result.jdInfo.required){const definition=SKILLS.find(s=>s.id===skillId),skill=result.skills.find(s=>s.TaxonomyID===skillId);add(`required-${skillId}`,`Required skill: ${definition?.name||skillId}`,!!skill&&!skill.IsOrphanSkill,skill?`${skill.MonthsOfExperience} months; last used ${skill.LastUsedDate||'unknown'}`:'Not found','Requires a mention inside a dated project/internship bullet.','Local evidence approximation',skill?.Evidence||[]);}
    add('degree-evidence','Parsed education evidence',result.degreeOK,result.degreeOK?'Eligible branch/degree found':'Not established','Uses the explicit degree and engineering branch in Education.','Local evidence approximation');
    add('grade','Qualification grade',!['C','D'].includes(result.grade),campus?'Graduate exception: not graded':result.grade,'A/B require all locally supported basic requirements. Preferred coverage differentiates A from B.','Local grade approximation');
    if(campus)checks.at(-1).status=ready?'not-applicable':'not-run';
  }
  if(id==='ashby')for(const [index,criterion]of result.criteria.entries()){add(`criterion-${index+1}`,criterion.criterion,criterion.status==='Met',criterion.status,criterion.reason||'Supported criteria use dated lexical evidence; quotes are extracted verbatim.','Local criteria approximation',criterion.evidence);if(criterion.status==='Manual review'&&ready)checks.at(-1).status='manual';}
  if(id==='lever'){add('fast-forward','Fast-forward scenario enabled',!!a.leverFastForwardEnabled,a.leverFastForwardEnabled?'Enabled':'Disabled','Only enabled, qualifying form scenarios can fast-forward. No vendor matching percentage is assumed.','Scenario rule');if(ready&&!a.leverFastForwardEnabled)checks.at(-1).status='disabled';}
  if(['zoho','greenhouse','freshteam'].includes(id))add('alignment','Contextual alignment proxy',result.zia>=75,`${result.zia}%`,'45% weighted skill evidence + 25% role/project alignment + 20% degree + 10% keywords/certifications.','App-defined proxy');
  if(id==='zoho')add('assessment','Pre-screen assessment',result.gate.assessmentPassed,`${a.assessment}/100`,`Threshold: ${a.assessmentThreshold}%`,'Scenario rule');
  if(id==='workable')add('field-search','Generated recruiter query',result.search.passed,result.search.passed?'All AND clauses pass':'At least one AND clause fails',result.query,'Local Boolean search approximation');
  if(id==='darwinbox')add('context','Dated contextual skills',result.anchoredMatched.length===result.matched.length&&result.matched.length>0,`${result.anchoredMatched.length}/${result.matched.length}`,'Counts matched concepts with positive inherited duration.','Local contextual-weight approximation');
  return {platform:id,ready,checks,reference,verifiedAgainstVendorSystem:false,externalVendorCalls:0,engine:'Local rules only',evaluatedChecks:checks.filter(c=>c.executed).length};
}
