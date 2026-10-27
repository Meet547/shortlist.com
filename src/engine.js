import {SKILLS,PRESETS,DEFAULT_APPLICATION} from './data.js';
import {evaluateQuery,termPattern} from './boolean.js';
import {scanSecurity} from './security.js';
export const ENGINE_VERSION='1.0.0';
const rounded=n=>Math.round(n*10)/10;
const ratio=(a,b)=>b?a/b:0;
export const has=(text,term)=>termPattern({value:term}).test(text||'');
const matches=(text,skill)=>skill.aliases.filter(a=>has(text,a));
const negativeEvidence=(line,skill)=>skill.aliases.some(a=>new RegExp(`(?:no|never|not|without)\\s+(?:\\w+\\s+){0,4}${a.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`,'i').test(line));
const monthMap={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12};
export function normalizeDate(value,asOf){
  if(/^(present|current|now)$/i.test(value.trim()))return asOf.slice(0,7);
  const m=value.match(/^(\d{4})-(0[1-9]|1[0-2])$/);if(m)return m[0];
  const n=value.match(/^(0?[1-9]|1[0-2])\/(\d{4})$/);if(n)return `${n[2]}-${n[1].padStart(2,'0')}`;
  const w=value.match(/^([A-Za-z]{3,9})\.?\s+(\d{4})$/);return w&&monthMap[w[1].slice(0,3).toLowerCase()]?`${w[2]}-${String(monthMap[w[1].slice(0,3).toLowerCase()]).padStart(2,'0')}`:null;
}
const dateToken='(?:[A-Za-z]{3,9}\\.?\\s+20\\d{2}|(?:0?[1-9]|1[0-2])\\/20\\d{2}|20\\d{2}-(?:0[1-9]|1[0-2]))';
const dateRange=new RegExp(`(${dateToken})\\s*(?:–|—|−|\\bto\\b|-)\\s*(${dateToken}|Present|Current|Now)`,'i');
const monthIndex=d=>Number(d.slice(0,4))*12+Number(d.slice(5,7))-1;
export function unionMonths(intervals){
  const spans=intervals.filter(([a,b])=>a&&b&&a<b).map(([a,b])=>[monthIndex(a),monthIndex(b)]).sort((a,b)=>a[0]-b[0]);let end=-Infinity,total=0;
  for(const [a,b]of spans){total+=Math.max(0,b-Math.max(a,end));end=Math.max(end,b);}return total;
}
const ZONES=[
 ['ExecutiveSummary_Headline',/^(summary|professional summary|profile|objective|career objective|headline)$/i],
 ['Education',/^(education|educational qualifications|academic qualifications|academic background)$/i],
 ['WorkExperience_Internships',/^(work experience|professional experience|experience|internships?|internships?\s*(?:&|and)\s*(?:work\s*)?experience)$/i],
 ['EngineeringProjects_Competitions',/^(engineering projects|academic projects|projects|projects\s*(?:&|and)\s*competitions|competitions|project experience)$/i],
 ['TechnicalSkills',/^(technical skills|skills|technical competencies|core skills)$/i],
 ['Certifications_Publications',/^(certifications?(?:\s*(?:&|and)\s*achievements)?|publications|awards|achievements|certifications?\s*(?:&|and)\s*publications)$/i]
];
export function zoneDocument(text){
  let section='ContactHeader';const lines=[],creative=[];
  const zones=Object.fromEntries(['ContactHeader',...ZONES.map(z=>z[0]),'Unclassified_Text'].map(k=>[k,[]]));
  text.split(/\r?\n/).forEach((raw,index)=>{
    const line=raw.trim(),heading=line.replace(/[:\s]+$/,'');const found=ZONES.find(([,re])=>re.test(heading));
    const nonstandard=/^(my engineering journey|where i['’]ve built(?: things)?|arsenal|toolbelt|academic pedigree|my toolbox|my story|what i bring)$/i.test(heading);
    if(found)section=found[0];else if(nonstandard){section='Unclassified_Text';creative.push({line:index+1,text:line});}
    const item={line:index+1,text:raw,section,isHeading:!!found||nonstandard};lines.push(item);if(!item.isHeading&&line)zones[section].push(item);
  });
  return {lines,zones,creative};
}
function extractBlocks(document,asOf){
  const blocks=[];
  for(const section of ['WorkExperience_Internships','EngineeringProjects_Competitions']){
    const lines=document.zones[section];let block=null,buffer=[];
    const push=()=>{if(block){blocks.push(block);block=null;}};
    for(let i=0;i<lines.length;i++){
      const item=lines[i],line=item.text.trim(),range=line.match(dateRange),bullet=/^\s*[-•▪●*‣]/.test(item.text);
      const roleLine=!bullet&&(/\s[—–]\s|\s\|\s/.test(line)||/\b(intern|lead|engineer|member|designer)\b/i.test(line));
      if(range||roleLine){
        if(range&&block&&!block.StartDate&&block.BulletPoints.length===0){
          block.Header+=` | ${line}`;
        }else{
          push();const header=[...buffer.slice(-2).map(x=>x.text.trim()),line].join(' | ');buffer=[];
          block={Organization:null,RoleTitle:null,Header:header,StartDate:null,EndDate:null,DurationMonths:0,DateValid:false,DateIssue:null,SourceSection:section,SourceLine:item.line,BulletPoints:[],Evidence:[]};
        }
        if(range){
          block.StartDate=normalizeDate(range[1],asOf);block.EndDate=normalizeDate(range[2],asOf);
          block.DateValid=!!(block.StartDate&&block.EndDate&&block.StartDate<=block.EndDate&&block.EndDate<=asOf.slice(0,7));
          block.DurationMonths=block.DateValid?monthIndex(block.EndDate)-monthIndex(block.StartDate):0;
          if(!block.DateValid)block.DateIssue='Invalid, reversed or future date range.';
        }
        continue;
      }
      if(block&&(bullet||block.BulletPoints.length)){
        if(!bullet&&block.Evidence.length){
          // Preserve the literal newline while treating wrapped lines as one bullet.
          block.BulletPoints[block.BulletPoints.length-1]+='\n'+line;
          block.Evidence[block.Evidence.length-1]={...block.Evidence.at(-1),text:block.Evidence.at(-1).text+'\n'+item.text};
        }else{block.BulletPoints.push(line.replace(/^[-•▪●*‣]\s*/,''));block.Evidence.push({...item});}
      }
      else if(bullet){push();block={Organization:null,RoleTitle:null,Header:buffer.map(x=>x.text).join(' | ')||'Unattributed experience',StartDate:null,EndDate:null,DurationMonths:0,DateValid:false,DateIssue:'No standard date range found.',SourceSection:section,SourceLine:item.line,BulletPoints:[line.replace(/^[-•▪●*‣]\s*/,'')],Evidence:[item]};buffer=[];}
      else buffer.push(item);
    }
    push();
  }
  for(const b of blocks){
    const clean=b.Header.replace(dateRange,'').replace(/[|\s]+$/,'');const parts=clean.split(/\s+[—–-]\s+|\s*\|\s*/).filter(Boolean);
    b.Organization=parts[0]||null;b.RoleTitle=parts[1]||null;if(!b.DateValid&&!b.DateIssue)b.DateIssue='No standard date range found. Use Mmm YYYY – Mmm YYYY.';
  }
  return blocks;
}
const emailRe=/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const phoneRe=/(?<!\d)(?:\+?91[\s.-]?)?[6-9](?:[\s.-]?\d){9}(?!\d)/;
const urlRe=/(?:https?:\/\/|www\.)[^\s<>|]+/gi;
const isPortfolio=u=>/github\.com|grabcad\.com|portfolio|behance\.net|notion\.site|sites\.google\.com|drive\.google\.com/i.test(u)||(!/linkedin\.com/i.test(u));
function contactInfo(text,extraction){
  const blocked=(extraction.marginText||'')+'\n'+(extraction.headerFooterText||'');
  const inMain=pattern=>{const m=text.match(pattern);return m&&!blocked.includes(m[0])?m[0]:null;};
  const urls=[...text.matchAll(urlRe)].map(m=>m[0].replace(/[),.;]+$/,''));
  const links=[...(extraction.hyperlinks||[]),...urls].filter(u=>/^https?:\/\//i.test(u));
  const header=text.split('\n').slice(0,8).join('\n');
  return {FullName:text.split('\n').find(l=>l.trim())?.trim()||'Candidate',Email:inMain(emailRe),Phone:inMain(phoneRe),Location:inMain(/(?:Pune|Bengaluru|Bangalore|Hyderabad|Chennai|Mumbai|Delhi|Noida|Gurugram|Ahmedabad|Kolkata|Nagpur|Nashik|Coimbatore|Indore|Jaipur|Lucknow|Kochi|Thiruvananthapuram|Surat|NCR)\s*,\s*[A-Za-z ]+/i),LinkedIn:links.find(u=>/linkedin\.com/i.test(u)&&!blocked.includes(u))||null,Portfolio:links.find(u=>isPortfolio(u)&&!blocked.includes(u))||null,PortfolioInHeader:links.some(u=>isPortfolio(u)&&(header.includes(u)||(extraction.headerHyperlinks||[]).includes(u))&&!blocked.includes(u)),URLs:[...new Set(links)]};
}
export function auditApplication(input){
  const a={...DEFAULT_APPLICATION,...input},fails=[],warnings=[];
  const allowed=a.allowedYears.split(/[,\s]+/).filter(Boolean);
  if(!allowed.includes(a.graduation))fails.push({field:'Graduation year',reason:`${a.graduation||'Missing'} is outside the configured ${allowed.join(' / ')} cohort.`,id:'year'});
  if(!/^\d+$/.test(a.notice)||Number(a.notice)>Number(a.maxNotice))fails.push({field:'Joining availability',reason:`This scenario requires notice ≤ ${a.maxNotice} days; answer is ${a.notice||'blank'}.`,id:'notice'});
  if(!/^\d+(?:\.\d+)?$/.test(a.duration)||Number(a.duration)<Number(a.minDuration))fails.push({field:'Full-time availability',reason:`Requires at least ${a.minDuration} months.`,id:'duration'});
  if(!a.relocate)fails.push({field:'On-site / relocation',reason:`The configured role requires on-site readiness in ${a.city}.`,id:'relocate'});
  if(!a.authorization)fails.push({field:'Work authorization',reason:'A positive work-authorization answer is required in this scenario.',id:'authorization'});
  if(!a.degree)fails.push({field:'Degree eligibility',reason:'The designated degree question was answered No.',id:'degree'});
  const numeric=/^\d+(?:\.\d+)?$/.test(a.compensation);
  if(!numeric)fails.push({field:'Compensation format',reason:'Enter one numeric value, without currency symbols or ranges.',id:'format'});
  else{
    const min=Number(a.compensationType==='ctc'?a.ctcMin:a.stipendMin),max=Number(a.compensationType==='ctc'?a.ctcMax:a.stipendMax);
    if(Number(a.compensation)<min||Number(a.compensation)>max)warnings.push(`Compensation is outside your configured ${min}–${max} ${a.compensationType==='ctc'?'LPA':'INR/month'} band; employer review required.`);
  }
  const assessmentValid=/^\d+(?:\.\d+)?$/.test(a.assessment)&&Number(a.assessment)>=0&&Number(a.assessment)<=100;
  const assessmentPassed=assessmentValid&&Number(a.assessment)>=Number(a.assessmentThreshold);
  return {answers:a,fails,warnings,passed:fails.length===0,assessmentPassed,assessmentValid};
}
export function extractJD(jd,domain){
  const lines=jd.split('\n').filter(l=>l.trim());let section='required';const required=[],preferred=[];
  for(const line of lines){
    if(/preferred|nice.to.have|desirable/i.test(line)&&line.length<100){section='preferred';continue;}
    if(/minimum qualifications|required qualifications|requirements|must.have/i.test(line)&&line.length<100){section='required';continue;}
    if(/application criteria/i.test(line)){section='other';continue;}
    for(const s of SKILLS){if(matches(line,s).length)(section==='preferred'?preferred:section==='required'?required:[]).push(s.id);}
  }
  const req=[...new Set(required)],pref=[...new Set(preferred)].filter(id=>!req.includes(id));
  return {title:lines[0]?.replace(/\s+[—–].*$/,'').trim()||PRESETS[domain].title,required:req,preferred:pref,all:[...new Set([...req,...pref])],degreeRequired:/\b(B\.?\s?(?:Tech|E)\.?|bachelor|degree)\b/i.test(jd),minimumExperience:Number(jd.match(/(?:minimum|at least|minimum of)\s+(\d+)\+?\s*years?/i)?.[1]||0),graduationYears:[...new Set([...jd.matchAll(/\b(202[0-9])\b/g)].map(m=>m[1]))]};
}
export function generatedQuery(jdInfo){
  const groups=['("Mechanical" OR "Aerospace" OR "Mechatronics" OR "Automotive")'];
  for(const id of jdInfo.required.slice(0,4)){
    const s=SKILLS.find(s=>s.id===id);groups.push('('+[...new Set(s.aliases.slice(0,3))].map(a=>'"'+a+'"').join(' OR ')+')');
  }
  return groups.join(' AND ');
}
export function defaultCriteria(jdInfo){
  const names=jdInfo.required.slice(0,4).map(id=>SKILLS.find(s=>s.id===id)?.name);
  return [names.slice(0,2).join(' and ')+' in hands-on engineering work',names.slice(2,4).join(' and ')+' demonstrated in a project or internship','B.Tech or B.E. in Mechanical, Aerospace, Mechatronics or Automotive Engineering','Quantified physical hardware design or validation impact'].filter(x=>x.length>15);
}
function evaluateCriteria(criteria,document,blocks){
  return criteria.map(criterion=>{
    const concepts=SKILLS.filter(s=>matches(criterion,s).length);
    const education=/B\.?(?:Tech|E)|bachelor|degree|education/i.test(criterion);
    const hardware=/physical hardware|quantified|measurable/i.test(criterion);
    const duration=criterion.match(/\b(?:at least|minimum(?: of)?)\s+(\d+(?:\.\d+)?)\s*(years?|months?)/i);
    const mixedLogic=concepts.length>1&&/\bor\b/i.test(criterion)&&/\band\b/i.test(criterion);
    if((!concepts.length&&!education&&!hardware)||mixedLogic||/\b(?:CGPA|GPA|percentile)\b|[<>]=?/.test(criterion))return {criterion,status:'Manual review',coverage:0,evidence:[],reason:'No reliable local evaluator for this requirement. This app does not run a semantic language model.'};
    const pool=education?document.zones.Education:blocks.flatMap(b=>b.DateValid?b.Evidence:[]);
    const relevant=pool.filter(l=>concepts.length?concepts.some(s=>matches(l.text,s).length&&!negativeEvidence(l.text,s)):hardware?impactElements(l.text).complete:criterion.toLowerCase().split(/\W+/).filter(t=>t.length>4&&!['experience','demonstrated','engineering','hands','with','have'].includes(t)).some(t=>has(l.text,t)));
    const satisfied=concepts.length?concepts.filter(s=>relevant.some(l=>matches(l.text,s).length&&!negativeEvidence(l.text,s))).length:education?Number(relevant.some(l=>/B\.?\s?(Tech|E)\.?|Bachelor/i.test(l.text))):Number(relevant.length>0);
    const alternative=concepts.length>1&&/\bor\b/i.test(criterion),target=alternative?1:concepts.length||1;
    const metCount=alternative?Math.min(1,satisfied):satisfied;
    const requiredMonths=duration?Number(duration[1])*(/^year/i.test(duration[2])?12:1):0;
    const months=unionMonths(blocks.filter(b=>b.DateValid&&b.Evidence.some(l=>concepts.some(skill=>matches(l.text,skill).length&&!negativeEvidence(l.text,skill)))).map(b=>[b.StartDate,b.EndDate]));
    const durationMet=!duration||months>=requiredMonths;
    const status=!durationMet?'Not Met':metCount===target?'Met':metCount>0?'Partially Met':'Not Met';
    return {criterion,status,coverage:durationMet?ratio(metCount,target):0,evidence:relevant.slice(0,3).map(l=>({line:l.line,quote:l.text.trim()})),reason:duration?`Dated evidence: ${months} months; criterion requires at least ${requiredMonths} months.`:'Supported local lexical and scope checks; not a vendor AI evaluation.'};
  });
}
export function impactElements(bullet){
  const action=/\b(designed|modeled|modelled|simulated|fabricated|validated|optimized|optimised|integrated|analysed|analyzed|developed|tested|manufactured|sized)\b/i.test(bullet);
  const tool=SKILLS.filter(s=>/solidworks|catia|nx|creo|ansys|abaqus|nastran|hypermesh|fluent|matlab|simulink|ros|altium|gazebo|xflr|python|cpp|mujoco|isaac|star|lsdyna|hyperworks|dfmea|gdt/.test(s.id)).some(s=>matches(bullet,s).length>0);
  const subsystem=/\b(gearbox|chassis|bracket|monocoque|battery|cold plate|thermal plate|manipulator|nozzle|valve|airframe|gripper|enclosure|actuator|fixture|landing gear|propeller|motor|assembly|frame|feed system|end.of.arm|sensor|controller)\b/i.test(bullet);
  const metric=/(?:\d+(?:\.\d+)?\s*(?:%|kg|kpa|mpa|pa\b|mm|cm|nm\b|n\b|kw|w\b|v\b|g\b|k\b|°c|deg|hz|rpm|seconds?|mins?|minutes?|hours?|m\b)|(?:factor of safety|FOS)\s*(?:of|=|:)?\s*\d+(?:\.\d+)?)/i.test(bullet);
  return {action,tool,subsystem,metric,complete:action&&tool&&subsystem&&metric};
}
export function analyze({text,jd,domain='aero',extraction={},application=DEFAULT_APPLICATION,asOf='2026-10-27',criteria:customCriteria}){
  const rawText=text,security=scanSecurity(text,extraction);
  text=security.scoreText;
  const document=zoneDocument(text),blocks=extractBlocks(document,asOf),contact=contactInfo(text,extraction),jdInfo=extractJD(jd,domain),gate=auditApplication(application);
  const skills=SKILLS.filter(s=>matches(text,s).length).map(s=>{
    const evidence=blocks.flatMap(b=>b.Evidence.filter(l=>matches(l.text,s).length&&!negativeEvidence(l.text,s)).map(l=>({block:b,line:l.line,quote:l.text.trim()})));
    const anchored=evidence.filter(e=>e.block.DateValid&&e.block.DurationMonths>0),months=unionMonths(anchored.map(e=>[e.block.StartDate,e.block.EndDate]));
    return {CanonicalName:s.name,RawMatches:matches(text,s),TaxonomyID:s.id,MonthsOfExperience:months,LastUsedDate:anchored.map(e=>e.block.EndDate).sort().at(-1)||null,IsOrphanSkill:months===0,ContextualWeight:months>0?1:0.25,SourceSection:[...new Set(document.lines.filter(l=>matches(l.text,s).length).map(l=>l.section))],Evidence:evidence.map(e=>({line:e.line,quote:e.quote,Organization:e.block.Organization,StartDate:e.block.StartDate,EndDate:e.block.EndDate})),Required:jdInfo.required.includes(s.id),Preferred:jdInfo.preferred.includes(s.id),full:s.full,acronym:s.acronym,dual:!s.full||(has(text,s.full)&&has(text,s.acronym))};
  });
  const matched=skills.filter(s=>jdInfo.all.includes(s.TaxonomyID)),requiredMatched=skills.filter(s=>s.Required),anchoredMatched=matched.filter(s=>!s.IsOrphanSkill);
  const dualSkills=SKILLS.filter(s=>s.full&&jdInfo.all.includes(s.id));
  const dualAudit=dualSkills.map(s=>({name:s.name,full:s.full,acronym:s.acronym,hasFull:has(text,s.full),hasAcronym:has(text,s.acronym),replacement:`${s.full} (${s.acronym}${s.name==='GD&T'?', ASME Y14.5':''})`}));
  const dualPassed=dualAudit.filter(s=>s.hasFull&&s.hasAcronym).length;
  const bullets=blocks.flatMap(b=>b.Evidence.map(l=>({...l,...impactElements(l.text),Organization:b.Organization}))),impact=ratio(bullets.filter(b=>b.complete).length,bullets.length);
  const educationText=document.zones.Education.map(l=>l.text).join('\n');
  const degreeOK=/B\.?\s*(Tech|E)\.?|Bachelor(?:\s+of)?\s+(?:Technology|Engineering)/i.test(educationText)&&/Mechanical|Aerospace|Mechatronics|Automotive/i.test(educationText);
  const gradYears=[...educationText.matchAll(/\b(20\d{2})\b/g)].map(m=>m[1]);
  const cgpa=educationText.match(/(?:CGPA|GPA)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/i);
  const headerTitle=document.zones.ContactHeader.slice(1,6).filter(l=>!emailRe.test(l.text)&&!phoneRe.test(l.text)&&!/https?:|www\./i.test(l.text)&&!(contact.Location&&l.text.includes(contact.Location))).map(l=>l.text).join('\n');
  const fields={text,skills:skills.map(s=>s.RawMatches.join(' ')).join('\n'),title:blocks.map(b=>b.RoleTitle).join('\n')+'\n'+headerTitle,education:educationText,school:educationText,location:contact.Location||''};
  const query=generatedQuery(jdInfo),search=evaluateQuery(query,fields);
  const headline=document.zones.ContactHeader.slice(1,9).map(l=>l.text).join('\n'),titleMatch=has(headline,jdInfo.title),topTokens=jdInfo.required.slice(0,5).map(id=>SKILLS.find(s=>s.id===id));
  const headlineCoverage=ratio(topTokens.filter(s=>matches(headline,s).length).length,topTokens.length);
  const minCoverage=ratio(requiredMatched.filter(s=>!s.IsOrphanSkill).length,jdInfo.required.length);
  const preferredCoverage=ratio(skills.filter(s=>s.Preferred&&!s.IsOrphanSkill).length,jdInfo.preferred.length);
  const totalMonths=unionMonths(blocks.filter(b=>b.SourceSection==='WorkExperience_Internships'&&b.DateValid).map(b=>[b.StartDate,b.EndDate]));
  const graduationMet=!jdInfo.graduationYears.length||gradYears.some(year=>jdInfo.graduationYears.includes(year));
  const basicMet=jdInfo.required.length>0&&minCoverage===1&&(!jdInfo.degreeRequired||degreeOK)&&graduationMet&&totalMonths>=jdInfo.minimumExperience*12;
  const grade=basicMet?(preferredCoverage>=0.5?'A':'B'):minCoverage>=0.5?'C':'D';
  const criteria=evaluateCriteria(customCriteria?.filter(c=>c.trim()).slice(0,5)||defaultCriteria(jdInfo),document,blocks);
  const rubric=ratio(criteria.reduce((n,c)=>n+c.coverage,0),criteria.length);
  const roleAlignment=ratio(bullets.filter(b=>SKILLS.some(s=>s.domains.includes(domain)&&matches(b.text,s).length)).length,bullets.length);
  const certificationText=document.zones.Certifications_Publications.map(l=>l.text).join('\n');
  const certificationMatch=ratio(SKILLS.filter(s=>jdInfo.all.includes(s.id)&&matches(certificationText,s).length).length,jdInfo.all.length);
  const contextualCoverage=ratio(matched.reduce((n,s)=>n+s.ContextualWeight,0),jdInfo.all.length);
  const zia=rounded(100*(0.45*contextualCoverage+0.25*roleAlignment+0.2*Number(degreeOK)+0.1*Math.max(certificationMatch,ratio(matched.length,jdInfo.all.length))));
  const layoutProblems=[...(extraction.issues||[])];
  const graphicBars=/(?:SOLIDWORKS|CATIA|ANSYS|MATLAB|Python|skills?)\s*[:|\s]+\d{1,3}\s*%|\[[|█.\s]{4,}\]|[★☆]{3,}/i.test(text);
  if(graphicBars)layoutProblems.push({severity:'warning',code:'graphic-bars',message:'Graphic proficiency ratings detected. Replace percentages or stars with project evidence.'});
  for(const c of document.creative)layoutProblems.push({severity:'warning',code:'creative-heading',message:`Line ${c.line}: “${c.text}” is unclassified. Use a canonical section heading.`,line:c.line});
  for(const b of blocks.filter(b=>!b.DateValid))layoutProblems.push({severity:'warning',code:'date',message:`${b.Organization}: ${b.DateIssue}`,line:b.SourceLine});
  const contactCount=['Email','Phone','Location','LinkedIn','Portfolio'].filter(k=>contact[k]).length;
  const zonesCount=['Education','WorkExperience_Internships','EngineeringProjects_Competitions','TechnicalSkills'].filter(k=>document.zones[k].length).length;
  const dateCoverage=ratio(blocks.filter(b=>b.DateValid).length,blocks.length);
  const structuredRisk=!!(extraction.tables||extraction.textboxes||graphicBars);
  const layoutPass=!extraction.collision&&!extraction.headerFooterContact&&!structuredRisk&&!document.creative.length&&dateCoverage===1&&contactCount===5;
  const checklist=[
    {title:'Notepad & layout audit',pass:layoutPass,detail:layoutPass?'The extraction stream, canonical zones and dates pass the configured checks.':'Inspect the raw stream and resolve the structural findings.'},
    {title:'Dual-token technical keywords',pass:dualSkills.length>0&&dualPassed===dualSkills.length,detail:`${dualPassed} of ${dualSkills.length} JD concepts include both the full phrase and acronym.`},
    {title:'Contextual skill anchoring',pass:matched.length>0&&anchoredMatched.length===matched.length&&impact>=0.6,detail:`${anchoredMatched.length} of ${matched.length} matched skills have dated bullet evidence; ${Math.round(impact*100)}% of bullets contain all four impact elements.`},
    {title:'Target headline & top tokens',pass:titleMatch&&headlineCoverage===1,detail:`${titleMatch?'Target title found':'Target title missing'}; ${Math.round(headlineCoverage*100)}% of the top JD tokens appear near the top.`},
    {title:'Portfolio & follow-up readiness',pass:contact.PortfolioInHeader,detail:contact.PortfolioInHeader?'A portfolio URL is present near the top; a draft follow-up kit is ready.':'Add a visual engineering portfolio URL to the main-body contact block.'}
  ];
  const sub=(name,earned,max,explanation)=>({name,earned:rounded(Math.max(0,Math.min(max,earned))),max,explanation});
  const pillars=[
    {name:'Parser & layout integrity',short:'Parser integrity',max:20,items:[sub('Single-column linear flow',extraction.collision?0:6,6,extraction.geometryVerified?(extraction.collision?'Coordinate analysis detected a narrow or interleaved column flow.':'No column collision detected in the extracted coordinates.'):'Provisional: plain text / DOCX does not prove PDF page geometry.'),sub('Contact & link parseability',contactCount,5,`${contactCount}/5: email, Indian mobile, city/state, LinkedIn and portfolio in the main body.`),sub('Canonical section zoning',zonesCount,4,`${zonesCount}/4 canonical sections detected.`),sub('Date & duration parseability',3*dateCoverage,3,`${blocks.filter(b=>b.DateValid).length}/${blocks.length} role/project blocks have valid month ranges.`),sub('Tables, textboxes & skill bars',structuredRisk?0:2,2,structuredRisk?'A table, floating textbox or proficiency meter was detected.':'No supported structure trap detected; visual tables in PDFs remain heuristic.')]},
    {name:'Contextual skill anchoring',short:'Skill anchoring',max:25,items:[sub('Required JD skill coverage',10*ratio(requiredMatched.length,jdInfo.required.length),10,`${requiredMatched.length}/${jdInfo.required.length} required ontology concepts found; unknown JD terms need custom criteria.`),sub('Anchored vs. orphan skill ratio',10*ratio(anchoredMatched.length,matched.length),10,`10 × ${anchoredMatched.length}/${matched.length||0} matched JD skills with >0 months. Orphan mentions carry 0.25 contextual weight in the separate Zia model.`),sub('Quantified engineering impact',5*impact,5,`${bullets.filter(b=>b.complete).length}/${bullets.length} bullets include action + tool + physical subsystem + metric with units.`)]},
    {name:'Recruiter searchability',short:'Searchability',max:25,items:[sub('Generated Boolean query',search.passed?10:0,10,search.passed?'All generated AND clauses pass.':'At least one AND clause fails; use the query lab to inspect.'),sub('Acronym + full phrase',10*ratio(dualPassed,dualSkills.length),10,`${dualPassed}/${dualSkills.length} JD dual-token concepts are complete.`),sub('Headline & domain mirroring',2.5*Number(titleMatch)+2.5*headlineCoverage,5,`Exact target title: ${titleMatch?'yes':'no'}. Top-token coverage: ${Math.round(headlineCoverage*100)}%.`)]},
    {name:'Enterprise & startup rubric',short:'Recruiter rubric',max:15,items:[sub('HiredScore-style simulation',({A:5,B:3.5,C:1.5,D:0})[grade],5,`Simulated grade ${grade}. Basic requirements need dated skill evidence and the configured education/experience floor.`),sub('Ashby-style cited evidence',5*rubric,5,`${criteria.filter(c=>c.status==='Met').length}/${criteria.length} criteria met; only extracted verbatim evidence counts.`),sub('Zia / Kula alignment model',5*zia/100,5,`App-defined 45% skills + 25% project alignment + 20% education + 10% keywords/certifications = ${zia}%.`)]},
    {name:'Action checklist & application gate',short:'Application readiness',max:15,items:checklist.map(c=>sub(c.title,gate.passed&&c.pass?3:0,3,gate.passed?c.detail:'Configured fatal knockout detected. Application-readiness points are withheld until it is resolved.'))}
  ].map(p=>({...p,items:text.trim()?p.items:p.items.map(item=>({...item,earned:0,explanation:'No resume content supplied.'})),earned:text.trim()?rounded(p.items.reduce((n,s)=>n+s.earned,0)):0}));
  const total=rounded(pillars.reduce((n,p)=>n+p.earned,0));
  const warnings=[...gate.warnings];
  if(!jdInfo.required.length)warnings.push('No required engineering concepts were recognized in this JD. Add explicit recruiter criteria and review unfamiliar terms manually.');
  if(!degreeOK)warnings.push('Education lacks an explicit eligible degree and engineering branch.');
  if(!cgpa)warnings.push('CGPA is missing an explicit /10 scale. Include it only if accurate and useful.');
  else if(Number(cgpa[2])!==10)warnings.push('CGPA uses a different scale. Do not invent a conversion; state the actual scale.');
  else if(Number(cgpa[1])<7)warnings.push('CGPA is below the illustrative 7/10 filter. Employer requirements vary.');
  if(gradYears.length&&!gradYears.includes(application.graduation))warnings.push('Application graduation year differs from the extracted education dates. Verify both.');
  const profile={Schema:'Shortlist HR-JSON-inspired candidate profile',SchemaVersion:ENGINE_VERSION,AsOf:asOf,CandidateProfile:{ContactInfo:contact,Education:[{RawText:educationText,DegreeEligible:degreeOK,GraduationYears:gradYears,CGPA:cgpa?Number(cgpa[1]):null,Scale:cgpa?Number(cgpa[2]):null}],ExperienceBlocks:blocks,CalculatedEmploymentMonths:totalMonths,ExtractedSkills:skills.map(({full,acronym,dual,Required,Preferred,...s})=>s)},Diagnostics:{SecurityAudit:{...security,scoreText:undefined},Score:total,Pillars:pillars,GeometryVerified:!!extraction.geometryVerified,Issues:layoutProblems,ApplicationGate:gate,Assumptions:'Deterministic educational simulation. App-owned taxonomy, not vendor-certified HR-JSON. Month duration is end minus start; overlapping intervals are counted once. PDF table/vector inference is heuristic. No OCR or external AI is used.'}};
  return {rawText,scoringText:text,security,total,pillars,document,blocks,contact,skills,matched,anchoredMatched,dualAudit,bullets,degreeOK,gradYears,cgpa,jdInfo,fields,query,search,grade,criteria,zia,roleAlignment,gate,checklist,layoutProblems,warnings,profile,extraction,domain,asOf,topTokens,headlineCoverage,titleMatch,provisional:!extraction.geometryVerified};
}
export function headlineKit(result){
  const found=result.topTokens.filter(s=>result.skills.some(x=>x.TaxonomyID===s.id)).map(s=>s.name);
  return {headline:`${result.jdInfo.title} (Fresher) | ${found.join(' · ')}`,summary:`${result.degreeOK?'Mechanical engineering graduate':'Engineering candidate'} targeting ${PRESETS[result.domain].label}.\n${result.anchoredMatched.length} matched skills supported by dated project or internship evidence. Portfolio: ${result.contact.Portfolio||'[add your real portfolio URL]'}.`,missing:result.topTokens.filter(s=>!found.includes(s.name)).map(s=>s.name)};
}
export function outreachKit(result,company){
  const best=result.bullets.filter(b=>b.complete).sort((a,b)=>a.text.split(/\s+/).length-b.text.split(/\s+/).length)[0];
  const evidence=best?.text.replace(/^[-•]\s*/,'').replace(/\s+/g,' ').trim()||'My resume describes my engineering projects and practical design work.';
  const brief=(value,n)=>value.trim().split(/\s+/).slice(0,n).join(' ');
  const team=brief(company||PRESETS[result.domain].company,5),name=brief(result.contact.FullName,4),title=brief(result.jdInfo.title,8);
  let evidenceText=evidence;
  const compose=()=>`Hi ${team} team, I’m ${name}, applying for your ${title} role. ${evidenceText.replace(/[.!]$/,'')}. My visual portfolio: ${result.contact.Portfolio||'[portfolio URL]'}. I’d appreciate a brief conversation about how my project experience could support your hardware team. If relevant, please find my application by name and consider it for an initial technical discussion. Thank you for your time.`;
  if(compose().split(/\s+/).length>80){
    const metric=evidence.match(/\d+(?:\.\d+)?\s*(?:%|kg|kpa|mpa|mm|cm|nm\b|n\b|kw|w\b|v\b|g\b|k\b|°c|hz|rpm|seconds?|minutes?|hours?|m\b)/i);
    const wordsBefore=metric?evidence.slice(0,metric.index).split(/\s+/).filter(Boolean).slice(-4).join(' '):'';
    evidenceText=metric?`My resume documents “${wordsBefore} ${metric[0]}”`:'My resume describes my engineering projects and practical design work';
  }
  let text=compose();
  if(text.split(/\s+/).length<60)text+=' I would welcome an opportunity to learn more about this role.';
  return {text,wordCount:text.split(/\s+/).length};
}
export function upgradeBullet({action,tool,subsystem,metric}){
  if(!action||!tool||!subsystem||!metric)return null;
  return `${action} ${subsystem.trim()} using ${tool.trim()}, ${metric.trim().replace(/[.!]$/,'')}.`;
}
