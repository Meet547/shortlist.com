import React,{useEffect,useState} from 'react';
import {Check,Clipboard,Search,AlertCircle} from 'lucide-react';

export function Badge({children,tone='neutral',dot=false}) {
  return <span className={`badge ${tone}`}>{dot&&<i aria-hidden="true"/>}{children}</span>;
}
export function Button({children,onClick,kind='',disabled=false,type='button',...props}) {
  return <button type={type} className={`button ${kind}`} onClick={onClick} disabled={disabled} {...props}>{children}</button>;
}
export function Panel({title,subtitle,action,children,className=''}) {
  return <section className={`panel ${className}`}><div className="panel-head"><div><h3>{title}</h3>{subtitle&&<p>{subtitle}</p>}</div>{action}</div>{children}</section>;
}
export function Empty({children}) {
  return <div className="empty"><Search size={20}/><p>{children}</p></div>;
}
export function Copy({text,label='Copy'}) {
  const [status,setStatus]=useState('idle');
  useEffect(()=>{if(status==='idle')return;const timer=setTimeout(()=>setStatus('idle'),2500);return()=>clearTimeout(timer);},[status]);
  return <span className="copy-control"><Button kind="small" onClick={async()=>{try{await navigator.clipboard.writeText(text);setStatus('copied');}catch{setStatus('failed');}}}>{status==='copied'?<Check size={14}/>:<Clipboard size={14}/>} {status==='copied'?'Copied':label}</Button>{status==='failed'&&<span role="status">Couldn’t copy. Select the text and copy it manually.</span>}</span>;
}
export function ApplyButton({children='Apply to draft',onApply,disabled=false,...props}){
  const [state,setState]=useState('idle');
  useEffect(()=>{if(state==='idle')return;const timer=setTimeout(()=>setState('idle'),2200);return()=>clearTimeout(timer);},[state]);
  async function apply(){try{const changed=await onApply();setState(changed===false?'unchanged':'applied');}catch{setState('failed');}}
  return <span className="apply-control"><Button kind={`small apply-button ${state}`} disabled={disabled||state==='applied'} onClick={apply} {...props}>{state==='applied'?<Check size={14} className="applied-tick"/>:null}<span>{state==='applied'?'Applied to draft':state==='unchanged'?'No change needed':children}</span></Button><span className="sr-only" role="status">{state==='applied'?'The draft was updated.':state==='failed'?'Could not apply the change.':state==='unchanged'?'The draft already contains this change.':''}</span>{state==='failed'&&<span className="apply-error" role="alert">Could not apply this change. Try copying it into the draft.</span>}</span>;
}
export function Notice({children,kind='info',action}) {
  return <div className={`notice ${kind}`} role={kind==='error'?'alert':'status'}><AlertCircle size={16}/><div>{children}</div>{action}</div>;
}
