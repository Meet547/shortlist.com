import React,{useState} from 'react';
import {ArrowRight,ChevronDown,Check,Settings2} from 'lucide-react';
import {Button,Badge} from './ui.jsx';
import {PLATFORM_GUIDES,platformGuide,recruiterOutcome} from './recruiter.js';
import {PlatformDetails} from './platform-details.jsx';
import {PlatformAudit} from './inspection-views.jsx';

export function RecruiterView({result,application,setApplication,criteria,setCriteria,selectedPlatform,setSelectedPlatform,applicationReviewed,stale,onRun,busy,navigate}){
  const [campus,setCampus]=useState(false);
  const guide=platformGuide(selectedPlatform);
  const outcome=recruiterOutcome(result,guide.id,{reviewed:applicationReviewed,stale,campus});
  const set=(key,value)=>setApplication({...application,[key]:value});
  const select=(id,label,value,options,onChange)=><label htmlFor={id}>{label}<select id={id} value={value} onChange={e=>onChange(e.target.value)}>{options.map(([v,name])=><option value={v} key={v}>{name}</option>)}</select></label>;
  return <div className="recruiter-view">
    <div className="view-intro"><h2>See how an application might be handled.</h2><p>You don’t need to run every simulator. Choose the system named on the job portal, confirm your answers, then read the outcome and its reason.</p></div>
    <section className="simulator-step"><div className="section-title"><span className="field-number">1</span><div><h3>Choose an application system</h3><p>Not sure which one? Leave General review selected.</p></div></div><label htmlFor="ats-platform">ATS on the job portal</label><select id="ats-platform" value={guide.id} onChange={e=>setSelectedPlatform(e.target.value)}>{PLATFORM_GUIDES.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select><div className="platform-explainer"><p>{guide.description}</p><span><b>Checks:</b> {guide.checks}.</span></div></section>
    <section className="simulator-step"><div className="section-title"><span className="field-number">2</span><div><h3>Confirm your application answers</h3><p>{applicationReviewed?'Change an answer to test another scenario.':'Example answers are filled in below. Replace them with your actual answers.'}</p></div><Badge>{applicationReviewed?'Confirmed':'Not confirmed'}</Badge></div>
      <form onSubmit={e=>{e.preventDefault();onRun();}}>
        <div className="application-fields">
          {select('app-graduation','Graduation year',application.graduation,['2023','2024','2025','2026','2027','2028'].map(y=>[y,y]),v=>set('graduation',v))}
          {select('app-notice','Joining availability',application.notice,[['0','Immediate / 0 days'],['15','15 days'],['30','30 days'],['60','60 days'],['90','90 days'],['','Not specified']],v=>set('notice',v))}
          <label htmlFor="app-duration">Full-time availability (months)<input id="app-duration" type="number" min="0" max="24" required value={application.duration} onChange={e=>set('duration',e.target.value)}/></label>
          {select('app-relocation','Willing to relocate / work on-site?',String(application.relocate),[['true','Yes'],['false','No']],v=>set('relocate',v==='true'))}
          {select('app-authorization','Authorized to work in India?',String(application.authorization),[['true','Yes'],['false','No']],v=>set('authorization',v==='true'))}
          {select('app-degree','Have the required degree and branch?',String(application.degree),[['true','Yes'],['false','No']],v=>set('degree',v==='true'))}
        </div>
        <details className="advanced-options"><summary>Compensation and assessment <ChevronDown size={14}/></summary><div className="application-fields">
          {select('app-pay-type','Compensation type',application.compensationType,[['ctc','CTC · LPA'],['stipend','Stipend · INR/month']],v=>setApplication({...application,compensationType:v,compensation:v==='ctc'?'8':'25000'}))}
          <label htmlFor="app-pay">Expected amount (numeric only)<input id="app-pay" value={application.compensation} onChange={e=>set('compensation',e.target.value)} placeholder="8 or 25000"/></label>
          <label htmlFor="app-assessment">Pre-screen assessment score / 100<input id="app-assessment" type="number" min="0" max="100" value={application.assessment} onChange={e=>set('assessment',e.target.value)}/></label>
        </div></details>
        <details className="advanced-options"><summary>Scenario rules <span>Example employer requirements</span><ChevronDown size={14}/></summary><p className="input-caption">Use the job’s actual requirements if you know them. These example values are not universal platform policies or verified salary benchmarks.</p><div className="application-fields">
          <label htmlFor="rule-years">Eligible graduation years<input id="rule-years" value={application.allowedYears} onChange={e=>set('allowedYears',e.target.value)}/></label>
          <label htmlFor="rule-notice">Maximum notice (days)<input id="rule-notice" type="number" min="0" value={application.maxNotice} onChange={e=>set('maxNotice',e.target.value)}/></label>
          <label htmlFor="rule-duration">Minimum availability (months)<input id="rule-duration" type="number" min="0" max="24" value={application.minDuration} onChange={e=>set('minDuration',e.target.value)}/></label>
          <label htmlFor="rule-score">Assessment threshold (%)<input id="rule-score" type="number" min="0" max="100" value={application.assessmentThreshold} onChange={e=>set('assessmentThreshold',e.target.value)}/></label>
          {select('rule-delay','Rejection notification delay',application.delay,['1','24','48','72'].map(h=>[h,`${h} ${h==='1'?'hour':'hours'}`]),v=>set('delay',v))}
          {select('app-location','On-site location',application.city,['Bengaluru','Hyderabad','Chennai','Pune','NCR'].map(c=>[c,c]),v=>set('city',v))}
          {guide.id==='lever'&&<label className="toggle-label"><input type="checkbox" checked={!!application.leverFastForwardEnabled} onChange={e=>set('leverFastForwardEnabled',e.target.checked)}/> Enable the local form-based fast-forward scenario</label>}
          {[['ctcMin','CTC minimum (LPA)'],['ctcMax','CTC maximum (LPA)'],['stipendMin','Stipend minimum (INR/month)'],['stipendMax','Stipend maximum (INR/month)']].map(([key,label])=><label key={key} htmlFor={`rule-${key}`}>{label}<input id={`rule-${key}`} type="number" min="0" step="any" value={application[key]} onChange={e=>set(key,e.target.value)}/></label>)}
        </div></details>
        <div className="application-submit"><p>Answer accurately. Change the scenario rules when a role has different requirements.</p><Button type="submit" kind="primary" disabled={busy}>Check application answers <ArrowRight size={15}/></Button></div>
      </form>
    </section>
    <section className="simulator-step outcome-step"><div className="section-title"><span className="field-number">3</span><div><h3>Read the outcome</h3><p>The route, the reason, and what to do next.</p></div></div><div className={`outcome-summary ${outcome.kind}`} aria-live="polite"><span className="section-eyebrow">{guide.id==='general'?'General review':guide.name} · simulation</span><h3>{outcome.title}</h3><dl><div><dt>Why</dt><dd>{outcome.reason}</dd></div><div><dt>Next step</dt><dd>{outcome.next}</dd></div></dl></div>
      {applicationReviewed&&guide.index>=0&&<details className="tool-disclosure" key={guide.id}><summary>Inspect the {guide.name} evidence and rules <ChevronDown size={15}/></summary><PlatformDetails result={result} criteria={criteria} setCriteria={setCriteria} selected={guide.index} campus={campus} onCampusChange={setCampus}/></details>}
      {applicationReviewed&&guide.id==='general'&&<div className="general-next"><Button onClick={()=>navigate('summary')}>Return to resume findings <ArrowRight size={14}/></Button><p>The diagnostic score and application gate answer different questions. Passing form rules does not guarantee a recruiter will advance your application.</p></div>}
    </section>
    <PlatformAudit result={result} platform={guide.id} reviewed={applicationReviewed} stale={stale} campus={campus}/>
    <p className="fine-print simulator-limit">These are transparent teaching models. Vendor products and employer settings vary. Your selection does not send an application or contact a hiring team.</p>
  </div>;
}
