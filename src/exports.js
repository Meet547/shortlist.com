import {scoreExecutionAudit,platformExecutionAudit} from './check-audit.js';
export function auditPayload(result,applicationReviewed){
  return {Engine:'Shortlist deterministic diagnostic simulator',Version:'2.0.0',AsOf:result.asOf,TotalScore:result.total,GeometryProvisional:result.provisional,ApplicationAnswersConfirmed:applicationReviewed,Pillars:result.pillars,Issues:result.layoutProblems,Warnings:result.warnings,Criteria:result.criteria,KnockoutAudit:result.gate,ScoreExecution:scoreExecutionAudit(result),PlatformExecutions:['workday','greenhouse','lever','ashby','zoho','workable','darwinbox','freshteam'].map(id=>platformExecutionAudit(result,id,{reviewed:applicationReviewed})),SecurityAudit:{...result.security,scoreText:undefined},Disclaimer:result.profile.Diagnostics.Assumptions};
}
export function exportFile(kind,{result,text,applicationReviewed,stale=false}){
  if(stale)throw new Error('Update the review before downloading so the export matches your current draft.');
  if(kind==='resume')return {name:'resume-reviewed.txt',content:text,type:'text/plain;charset=utf-8'};
  if(kind==='audit')return {name:'shortlist-audit.json',content:JSON.stringify(auditPayload(result,applicationReviewed),null,2),type:'application/json'};
  if(kind==='profile')return {name:'candidate-hr-profile.json',content:JSON.stringify({...result.profile,ApplicationAnswersConfirmed:applicationReviewed},null,2),type:'application/json'};
  throw new Error('Choose a supported export format.');
}
export function requestDownload(file){
  const url=URL.createObjectURL(new Blob([file.content],{type:file.type}));
  const link=document.createElement('a');
  link.href=url;link.download=file.name;link.hidden=true;
  document.body.appendChild(link);
  try{link.click();}finally{link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
}
