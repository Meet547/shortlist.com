import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArrowRight,ArrowLeft,ArrowUpRight,ArrowDownToLine,Check,ChevronDown,ChevronRight,FileText,Upload,LoaderCircle,LockKeyhole,X,RefreshCw,HelpCircle,Braces} from 'lucide-react';
import {PRESETS} from './data.js';
import {analyze} from './engine.js';
import {parseFile,textExtraction} from './parsers.js';
import {STEPS,REVIEW_TABS,newWorkspace,restoreWorkspace,isReviewStale,validateReview,reviewTasks,changeDomain} from './workflow.js';
import {Badge,Button,Panel,Notice} from './ui.jsx';
import {PillarDetails,Pipeline,Skills,SearchLab,Checklist,Methodology} from './detail-views.jsx';
import {RecruiterView} from './recruiter-view.jsx';
import {SecurityInspector,ScoreAudit} from './inspection-views.jsx';
import {exportFile,requestDownload} from './exports.js';
import './styles.css';

const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const readSession=()=>{try{return JSON.parse(sessionStorage.getItem('shortlist-session')||'null');}catch{return null;}};

function App(){
  const [workspace,setWorkspace]=useState(()=>restoreWorkspace(readSession(),today()));
  const [step,setStep]=useState(()=>workspace.analysisInputs?'review':'setup');
  const [reviewTab,setReviewTab]=useState('summary');
  const [help,setHelp]=useState(false),[fixIndex,setFixIndex]=useState(0);
  const [busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [previousScore,setPreviousScore]=useState(null),[selectedPlatform,setSelectedPlatform]=useState('general'),[undoWorkspace,setUndoWorkspace]=useState(null);
  const uploadRef=useRef(null),operationRef=useRef(0),resumeRef=useRef(null);
  const {draft,analysisInputs,company,isExample,applicationReviewed}=workspace;
  const {text,jd,domain,extraction,application,asOf,criteria}=draft;
  const result=useMemo(()=>analysisInputs?analyze(analysisInputs):null,[analysisInputs]);
  const stale=isReviewStale(draft,analysisInputs);

  useEffect(()=>{
    try{sessionStorage.setItem('shortlist-session',JSON.stringify(workspace));}
    catch{setNotice('This tab’s storage is full. Your draft is still open; export it before closing the tab.');}
  },[workspace]);
  useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),(notice==='Workspace cleared for this tab.'||notice.startsWith('Loaded fictional audit'))?10000:4500);return()=>clearTimeout(timer);},[notice]);
  const setDraft=(key,value)=>setWorkspace(w=>({...w,draft:{...w.draft,[key]:value}}));
  const setCompany=value=>setWorkspace(w=>({...w,company:value}));
  const setCriteria=value=>setDraft('criteria',value);
  const setApplication=value=>setWorkspace(w=>({...w,applicationReviewed:false,draft:{...w.draft,application:value}}));
  function go(next,preferredCheck=null){if(next!=='setup'&&!result)return;if(next==='improve'){const firstIncomplete=result.checklist.findIndex(check=>!check.pass);setFixIndex(preferredCheck??(firstIncomplete>=0?firstIncomplete:4));}setStep(next);setHelp(false);setError('');window.scrollTo({top:0,behavior:'instant'});}
  function navigate(destination,check=0){
    if(destination==='improve'||destination==='checklist'){go('improve',check);return;}
    if(destination==='workbench'||destination==='setup'){go('setup');return;}
    if(destination==='methodology'){setHelp(true);window.scrollTo({top:0,behavior:'instant'});return;}
    if(destination==='application'){setReviewTab('platforms');go('review');return;}
    setReviewTab(['summary','skills','platforms','pipeline','security'].includes(destination)?destination:'summary');go('review');
  }
  function runReview(destination=step,confirmAnswers=false){
    const validation=validateReview(draft);
    if(validation){setError(validation);return false;}
    setPreviousScore(result?.total??null);
    setWorkspace(w=>({...w,analysisInputs:w.draft,applicationReviewed:confirmAnswers||w.applicationReviewed}));
    setError('');setNotice('Review updated. Findings and exports now use your current inputs.');
    setStep(destination==='setup'?'review':destination);setHelp(false);
    if(destination==='setup'){setReviewTab('summary');window.scrollTo({top:0,behavior:'instant'});}
    return true;
  }
  function editText(value){
    setWorkspace(w=>({...w,draft:{...w.draft,text:value,extraction:w.draft.extraction.type==='text'?w.draft.extraction:{...textExtraction('Edited resume text'),sourceFile:w.draft.extraction.name,issues:[{code:'edited-draft',severity:'info',message:'Text changed after extraction. Upload the revised PDF or DOCX to verify its layout again.'}]}}}));
  }
  async function readFile(file){
    if(!file||busy)return;
    const operation=++operationRef.current;setBusy(true);setError('');
    try{
      const parsed=await parseFile(file);if(operation!==operationRef.current)return;
      setWorkspace(w=>({...w,isExample:false,draft:{...w.draft,text:parsed.text,extraction:parsed.extraction}}));
      setNotice('Resume read. Check the target job, then select Review resume.');
    }catch(e){if(operation===operationRef.current)setError(e.message);}
    finally{if(operation===operationRef.current){setBusy(false);if(uploadRef.current)uploadRef.current.value='';}}
  }
  async function loadExample(strong=true){
    if(busy)return;const operation=++operationRef.current;setBusy(true);setError('');
    try{
      const response=await fetch(`/samples/${strong?'anchored':'orphan'}-${domain}.pdf`);
      if(!response.ok)throw new Error('Could not load the example. You can still upload a resume or paste text.');
      const parsed=await parseFile(new File([await response.blob()],`${strong?'structured':'two-column'}-example.pdf`,{type:'application/pdf'}));
      if(operation!==operationRef.current)return;
      const exampleInputs={...draft,text:parsed.text,extraction:parsed.extraction,jd:PRESETS[domain].jd,criteria:null};
      setPreviousScore(result?.total??null);
      setWorkspace(w=>({...w,isExample:true,applicationReviewed:false,draft:exampleInputs,analysisInputs:exampleInputs}));
      setStep('review');setReviewTab('summary');setNotice('Showing a fictional example. Choose Resume & role to add your own document.');window.scrollTo({top:0,behavior:'instant'});
    }catch(e){if(operation===operationRef.current)setError(e.message);}
    finally{if(operation===operationRef.current)setBusy(false);}
  }
  async function loadAuditExample(type='pdf'){
    if(busy)return;const operation=++operationRef.current;setBusy(true);setError('');
    try{const response=await fetch(`/samples/security-audit-demo.${type}`);if(!response.ok)throw new Error('Could not load the audit test document.');
      const parsed=await parseFile(new File([await response.blob()],`security-audit-demo.${type}`,{type:type==='pdf'?'application/pdf':'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}));
      if(operation!==operationRef.current)return;
      const inputs={...draft,text:parsed.text,extraction:parsed.extraction,jd:PRESETS.aero.jd,domain:'aero',criteria:null};
      setUndoWorkspace({workspace,step,reviewTab});setWorkspace(w=>({...w,isExample:true,applicationReviewed:false,draft:inputs,analysisInputs:inputs}));setStep('review');setReviewTab('security');setNotice('Loaded fictional audit test document. Undo restores your previous draft.');
    }catch(error){if(operation===operationRef.current)setError(error.message);}finally{if(operation===operationRef.current)setBusy(false);}
  }
  function reset(){
    setUndoWorkspace({workspace,step,reviewTab});++operationRef.current;setBusy(false);setWorkspace(newWorkspace(today()));setStep('setup');setReviewTab('summary');setHelp(false);setPreviousScore(null);setError('');setSelectedPlatform('general');setNotice('Workspace cleared for this tab.');
  }
  const common=result?{result,navigate,editText,text,jd,domain,extraction,application,setApplication,company,setCompany,asOf,criteria,setCriteria}:null;

  return <div className="app">
    <header className="site-header"><div className="header-inner">
      <a className="wordmark" href="#" onClick={e=>{e.preventDefault();go('setup');}}>shortlist<span>.</span></a>
      <span className="product-label">resume review for everyone</span>
      <div className="header-actions"><Button kind="text" onClick={()=>{setHelp(!help);window.scrollTo({top:0,behavior:'instant'});}}><HelpCircle size={15}/>{help?'Back to workspace':'How it works'}</Button><Button kind="text" onClick={reset} disabled={busy}>Start over</Button></div>
    </div></header>
    <div className="workspace">
      <nav className="step-nav" aria-label="Resume review steps">{STEPS.map((item,index)=><button key={item.id} aria-current={!help&&step===item.id?'step':undefined} className={step===item.id&&!help?'current':''} onClick={()=>go(item.id)} disabled={index>0&&!result}><span className="step-number">{item.number}</span><span>{item.label}</span>{index===0&&result&&!stale&&<Check size={13}/>}</button>)}</nav>
      <main id="main-content">
        {error&&<Notice kind="error" action={<button onClick={()=>setError('')} aria-label="Dismiss error"><X size={16}/></button>}>{error}</Notice>}
        {result&&stale&&!help&&<Notice kind="pending" action={<Button kind="small primary" onClick={()=>runReview(step)} disabled={busy}>Update review <RefreshCw size={13}/></Button>}>Your draft has changed. Findings still describe the last review; update it before exporting.</Notice>}
        {help?<><PageHeading label="Help" title="How the review works." description="What to do, what the score means, and where the model has limits."/><div className="help-steps"><p><b>1. Add a resume and a target role.</b> Use a PDF, DOCX, text file or pasted text. Choose a role preset or paste the actual job description.</p><p><b>2. Read the findings.</b> Start with the recommended changes. Use the ATS simulator only if you want to explore an application workflow.</p><p><b>3. Improve and export.</b> Edit the draft, update the review, then download the text or diagnostic report. Re-upload the revised document to verify its layout.</p></div><Methodology/><Button onClick={()=>setHelp(false)}><ArrowLeft size={14}/> Back to workspace</Button></>:<>
          {step==='setup'&&<>
            <PageHeading label="Step 01" title="Check your resume against a role." description="Add your resume and the job you want. We’ll show what gets parsed, what’s missing, and what to improve."/>
            <div className="setup-grid">
              <section className="input-section" aria-labelledby="resume-heading"><div className="section-title"><span className="field-number">1</span><div><h2 id="resume-heading">Your resume</h2><p>Upload a document or paste its text.</p></div></div>
                <button type="button" className={`upload-area ${busy?'loading':''}`} disabled={busy} onClick={()=>uploadRef.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();readFile(e.dataTransfer.files[0]);}}>
                  {busy?<LoaderCircle size={23} className="spin"/>:<Upload size={23}/>}<strong>{busy?'Reading document…':text&&extraction.type!=='text'?'Choose a different file':'Choose a resume file'}</strong><span>or drag it here · PDF, DOCX or TXT · 15 MB maximum</span>
                </button>
                {(text||extraction.pages?.length>0||extraction.sourceRegions?.length>0)&&<div className="file-receipt"><FileText size={16}/><span>{extraction.name||'Pasted resume'}</span><Badge>{extraction.type?.toUpperCase()||'TEXT'}</Badge>{isExample&&<Badge>Example</Badge>}</div>}
                <label className="editor-label" htmlFor="resume-text">{text?'Review or edit the extracted text':'Or paste your resume text'}</label><textarea ref={resumeRef} id="resume-text" className="input-resume" placeholder={'Name and contact details\n\nEducation\n\nExperience or internships\n\nEngineering projects\n\nTechnical skills'} value={text} maxLength={250000} onChange={e=>editText(e.target.value)} spellCheck={false}/>
                <p className="input-caption">{text?`${text.length.toLocaleString()} characters · `:''}Editing extracted text creates a draft. Re-upload the final document to recheck its layout.</p>
              </section>
              <section className="input-section" aria-labelledby="role-heading"><div className="section-title"><span className="field-number">2</span><div><h2 id="role-heading">The role you’re targeting</h2><p>Match the review to a specific job.</p></div></div>
                <label htmlFor="target-domain">Engineering domain</label><select id="target-domain" value={domain} onChange={e=>setWorkspace(w=>({...w,draft:changeDomain(w.draft,e.target.value)}))}>{Object.entries(PRESETS).map(([key,preset])=><option key={key} value={key}>{preset.label}</option>)}</select>
                <div className="label-row"><label htmlFor="job-description">Job description</label><button className="inline-link" onClick={()=>setWorkspace(w=>({...w,draft:{...w.draft,jd:PRESETS[domain].jd,criteria:null}}))}>Use example job description</button></div>
                <textarea id="job-description" className="input-jd" value={jd} maxLength={50000} onChange={e=>setWorkspace(w=>({...w,draft:{...w.draft,jd:e.target.value,criteria:null}}))} placeholder="Paste the role title, required skills and qualifications…"/>
                <p className="input-caption">Example descriptions are illustrative. Paste the actual vacancy for a more relevant review.</p>
                <details className="advanced-options"><summary>Optional review settings <ChevronDown size={14}/></summary><div className="form-grid"><label>Company or team<input value={company} maxLength={120} onChange={e=>setCompany(e.target.value)} placeholder="Used in the follow-up draft"/></label><label>Calculate experience as of<input type="date" value={asOf} max={today()} onChange={e=>setDraft('asOf',e.target.value)}/></label></div></details>
              </section>
            </div>
            <div className="setup-bottom"><p><LockKeyhole size={14}/> Documents are processed on your device. Drafts stay in this browser tab.</p><Button kind="primary" onClick={()=>runReview('setup')} disabled={busy}>Review resume <ArrowRight size={16}/></Button></div>
            <div className="example-row"><div><h3>Want to see how it works first?</h3><p>Review a fictional engineering resume using the selected domain.</p></div><Button onClick={()=>loadExample(true)} disabled={busy}>Try a structured example <ArrowUpRight size={14}/></Button><Button kind="text" onClick={()=>loadExample(false)} disabled={busy}>Try a two-column example</Button></div>
          </>}
          {step==='review'&&result&&<>
            <PageHeading label="Step 02" title="Review the findings." description={`${result.contact.FullName} · ${result.jdInfo.title}`} action={<Button kind="primary" onClick={()=>go('improve',reviewTasks(result,{applicationReviewed}).find(t=>t.destination==='improve')?.check??null)}>Improve resume <ArrowRight size={15}/></Button>}/>
            <div className="review-context"><span><FileText size={14}/>{analysisInputs.extraction.name||'Pasted resume'}{isExample&&<Badge>Fictional example</Badge>}</span><button className="inline-link" onClick={()=>go('setup')}>Change resume or role</button></div>
            <div className="review-tabs" role="tablist" aria-label="Review details" onKeyDown={e=>{const ids=REVIEW_TABS.map(t=>t.id),at=ids.indexOf(reviewTab);let next=null;if(e.key==='ArrowRight')next=ids[(at+1)%ids.length];if(e.key==='ArrowLeft')next=ids[(at+ids.length-1)%ids.length];if(e.key==='Home')next=ids[0];if(e.key==='End')next=ids.at(-1);if(next){e.preventDefault();setReviewTab(next);e.currentTarget.querySelector(`#tab-${next}`)?.focus();}}}>{REVIEW_TABS.map(tab=><button key={tab.id} id={`tab-${tab.id}`} role="tab" aria-selected={reviewTab===tab.id} tabIndex={reviewTab===tab.id?0:-1} aria-controls={`panel-${tab.id}`} onClick={()=>setReviewTab(tab.id)}>{tab.label}</button>)}</div>
            <div id={`panel-${reviewTab}`} role="tabpanel" aria-labelledby={`tab-${reviewTab}`}>
              {reviewTab==='summary'&&<Summary result={result} previousScore={previousScore} applicationReviewed={applicationReviewed} onNavigate={navigate}/>}
              {reviewTab==='skills'&&<><div className="view-intro"><h2>Which skills have supporting evidence?</h2><p>“Anchored” means the skill appears in a dated project or internship bullet. “Orphan” means it was found without a usable timeline.</p></div><Skills {...common}/><details className="tool-disclosure"><summary>Optional: test how a recruiter might search for you <ChevronDown size={15}/></summary><SearchLab {...common}/></details></>}
              {reviewTab==='security'&&<SecurityInspector {...common} onNotice={setNotice} onLoadExample={loadAuditExample} onRun={()=>runReview('review')}/>}
              {reviewTab==='pipeline'&&<><div className="view-intro"><h2>Check the reading order.</h2><p>Start with the raw text. If dates, sections or columns are mixed together, fix the source document before editing individual keywords.</p></div><Pipeline {...common}/></>}
              {reviewTab==='platforms'&&<RecruiterView {...common} selectedPlatform={selectedPlatform} setSelectedPlatform={setSelectedPlatform} applicationReviewed={applicationReviewed} stale={stale} onRun={()=>runReview('review',true)} busy={busy}/>}
            </div>
          </>}
          {step==='improve'&&result&&<>
            <PageHeading label="Step 03" title="Improve the draft. Check it again." description="Use the suggested fixes, edit your text, then update the review to see what changed." action={<Button kind="primary" onClick={()=>runReview('improve')} disabled={busy||!stale}>Update review <RefreshCw size={15}/></Button>}/>
            <div className="improve-grid"><div className="improvement-tools"><Checklist {...common} key={fixIndex} initialOpen={fixIndex} onNotice={setNotice}/></div><aside className="draft-pane"><div className="draft-pane-header"><h2>Your working draft</h2><Badge>{stale?'Changes pending':'Up to date'}</Badge></div><label className="sr-only" htmlFor="working-draft">Working resume draft</label><textarea id="working-draft" value={text} maxLength={250000} onChange={e=>editText(e.target.value)} spellCheck={false}/><div className="draft-pane-footer"><span>{text.length.toLocaleString()} characters</span><Button kind="small primary" onClick={()=>runReview('improve')} disabled={busy||!stale}>Update review</Button></div><p className="input-caption">This is a text draft. Re-upload the revised PDF or DOCX to verify its layout.</p></aside></div>
            <ExportActions result={result} text={analysisInputs.text} disabled={stale} applicationReviewed={applicationReviewed}/>
            <div className="page-end"><Button onClick={()=>{setReviewTab('summary');go('review');}}><ArrowLeft size={14}/> Back to findings</Button><Button kind="text" onClick={()=>go('setup')}>Upload revised document <ArrowRight size={14}/></Button></div>
          </>}
        </>}
        <PrintReport result={result} applicationReviewed={applicationReviewed} stale={stale}/>
      </main>
      <footer className="site-footer"><span>Shortlist · Personal resume review</span><button onClick={()=>{setHelp(true);window.scrollTo({top:0,behavior:'instant'});}}>Scoring and limitations <ArrowUpRight size={12}/></button></footer>
    </div>
    <input ref={uploadRef} hidden type="file" accept=".pdf,.docx,.txt" onChange={e=>readFile(e.target.files[0])}/>
    {notice&&<div className="toast" role="status"><Check size={16}/><span>{notice}</span>{undoWorkspace&&(notice==='Workspace cleared for this tab.'||notice.startsWith('Loaded fictional audit'))&&<button className="undo-button" onClick={()=>{setWorkspace(undoWorkspace.workspace);setStep(undoWorkspace.step);setReviewTab(undoWorkspace.reviewTab);setUndoWorkspace(null);setNotice('Previous workspace restored.');}}>Undo</button>}<button onClick={()=>setNotice('')} aria-label="Dismiss notification"><X size={14}/></button></div>}
  </div>;
}

function PageHeading({label,title,description,action}){
  return <div className="page-heading"><div><span className="page-label">{label}</span><h1>{title}</h1><p>{description}</p></div>{action&&<div className="heading-action">{action}</div>}</div>;
}

function Summary({result,previousScore,applicationReviewed,onNavigate}){
  const tasks=reviewTasks(result,{applicationReviewed});
  const change=previousScore===null?null:Math.round((result.total-previousScore)*10)/10;
  return <>
    <section className="review-overview"><div className="score-summary"><span className="section-eyebrow">Diagnostic score</span><div className="score-value">{result.total}<span>/ 100</span></div><p>{result.total>=85?'Strong evidence across the configured checks.':result.total>=65?'A useful foundation, with specific gaps to address.':'Start with the structural and evidence gaps below.'}</p>{change!==null&&change!==0&&<span className="score-change">{change>0?'+':''}{change} points since the previous review</span>}</div><div className="review-facts"><h2>What we found</h2><dl><div><dt>Skills supported by dates</dt><dd>{result.anchoredMatched.length} of {result.matched.length} matched skills</dd></div><div><dt>Project / internship timelines</dt><dd>{result.blocks.filter(b=>b.DateValid).length} of {result.blocks.length} recognized</dd></div><div><dt>Document layout</dt><dd>{result.provisional?'Needs a final document check':result.extraction.collision?'Reading-order issue detected':'PDF coordinates inspected'}</dd></div><div><dt>Application requirements</dt><dd>{!applicationReviewed?'Answers not confirmed':result.gate.passed?'Pass the configured rules':`${result.gate.fails.length} answers need review`}</dd></div></dl><p className="fine-print">This is a diagnostic model, not a hiring decision.{!applicationReviewed?' Application-readiness points currently use example answers. Review them in the ATS simulator.':''}</p></div></section>
    {result.security.counts.high>0&&<Notice kind="pending" action={<Button kind="small" onClick={()=>onNavigate('security')}>Inspect document risks <ArrowRight size={13}/></Button>}>{result.security.counts.high} high-priority document-integrity findings. Mapped hidden/instruction content was excluded from local scoring.</Notice>}
    <section className="recommendations"><div className="section-header"><div><h2>Start with these changes</h2><p>Work through the highest-priority findings first.</p></div><span className="count-label">{tasks.length} {tasks.length===1?'recommendation':'recommendations'}</span></div><ol>{tasks.map((task,i)=><li key={task.id}><span className="task-index">{String(i+1).padStart(2,'0')}</span><div><h3>{task.title}</h3><p>{task.detail}</p></div><button className="task-action" onClick={()=>onNavigate(task.destination,task.check)}>{task.action}<ArrowRight size={14}/></button></li>)}</ol></section>
    <ScoreAudit result={result}/>
    <section className="score-breakdown"><div className="section-header"><div><h2>Where the points come from</h2><p>Open any category to inspect its calculation.</p></div></div>{result.pillars.map(p=><details key={p.name}><summary><span>{p.short}</span><span className="breakdown-score">{p.earned}<small> / {p.max}</small><ChevronDown size={14}/></span></summary><PillarDetails pillar={p}/></details>)}</section>
  </>;
}

function ExportActions({result,text,disabled,applicationReviewed}){
  const [downloadNotice,setDownloadNotice]=useState(''),[downloadError,setDownloadError]=useState('');
  function download(kind){
    if(disabled)return;
    try{const file=exportFile(kind,{result,text,applicationReviewed,stale:disabled});requestDownload(file);setDownloadError('');setDownloadNotice(`Download requested: ${file.name}. Check your browser’s downloads if no save prompt appears.`);}catch(error){setDownloadError(error.message);}
  }
  return <section className="export-section" aria-labelledby="export-heading"><div><h2 id="export-heading">Export your work</h2><p>{disabled?'Update the review first so your downloads match the current draft.':'Download the reviewed text and its diagnostics. You can also print the audit to PDF.'}</p></div><div className="export-actions"><Button kind="primary" disabled={disabled} onClick={()=>download('resume')}><ArrowDownToLine size={15}/> Resume text</Button><Button disabled={disabled} onClick={()=>download('audit')}>Audit report <span>.json</span></Button><Button disabled={disabled} onClick={()=>download('profile')}>Candidate profile <span>.json</span></Button><Button disabled={disabled} onClick={()=>window.print()}>Print audit / save PDF</Button></div>{downloadNotice&&!disabled&&<p role="status">{downloadNotice}</p>}{downloadError&&<p role="alert">{downloadError}</p>}</section>;
}
function PrintReport({result,applicationReviewed,stale}){
  if(!result)return null;
  return <div className="print-report"><h1>Shortlist diagnostic report</h1><p>{result.contact.FullName} · {result.asOf} · {result.total}/100</p>{stale&&<p><b>Draft changes have not been reviewed. This report describes the previous review.</b></p>}<p>{result.profile.Diagnostics.Assumptions}</p>{!applicationReviewed&&<p>Application answers are example defaults and have not been confirmed by the user.</p>}{result.pillars.map(p=><section key={p.name}><h2>{p.name}: {p.earned}/{p.max}</h2>{p.items.map(item=><p key={item.name}><b>{item.name}: {item.earned}/{item.max}</b> — {item.explanation}</p>)}</section>)}<h2>Document findings</h2>{result.layoutProblems.map((item,index)=><p key={index}>{item.message}</p>)}<h2>Application rules</h2>{result.gate.fails.map(f=><p key={f.id}>{f.field}: {f.reason}</p>)}</div>;
}

createRoot(document.getElementById('root')).render(<App/>);
