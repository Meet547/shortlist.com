const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function tokenize(query) {
  const tokens=[]; let i=0;
  while(i<query.length){
    if(/\s/.test(query[i])){i++;continue;}
    if('()'.includes(query[i])){tokens.push({type:query[i++]});continue;}
    const field=query.slice(i).match(/^(skills|title|education|location|school):/i);
    if(field){tokens.push({type:'FIELD',value:field[1].toLowerCase()});i+=field[0].length;continue;}
    if(query[i]==='"'){
      const end=query.indexOf('"',i+1);if(end<0)throw new Error('Close the quoted phrase.');
      if(end===i+1)throw new Error('A quoted phrase cannot be empty.');
      tokens.push({type:'TERM',value:query.slice(i+1,end),phrase:true});i=end+1;continue;
    }
    const m=query.slice(i).match(/^[^\s()"]+/);if(!m)throw new Error('Invalid query token.');
    const value=m[0];tokens.push({type:/^(AND|OR|NOT)$/i.test(value)?value.toUpperCase():'TERM',value});i+=value.length;
  }
  return tokens;
}
export function parseQuery(query){
  const tokens=tokenize(query);let at=0;
  if(!tokens.length)throw new Error('Enter a search term or Boolean query.');
  const peek=()=>tokens[at]?.type;
  function primary(){
    if(peek()==='NOT'){at++;return {type:'NOT',child:primary()};}
    if(peek()==='FIELD'){const field=tokens[at++].value;return {type:'FIELD',field,child:primary()};}
    if(peek()==='('){at++;const n=or();if(peek()!==')')throw new Error('Add a closing parenthesis.');at++;return n;}
    if(peek()==='TERM')return tokens[at++];
    throw new Error(`Expected a term${peek()?`, found ${peek()}`:''}.`);
  }
  function and(){let node=primary();while(peek()==='AND'||['TERM','(','NOT','FIELD'].includes(peek())){if(peek()==='AND')at++;node={type:'AND',left:node,right:primary()};}return node;}
  function or(){let node=and();while(peek()==='OR'){at++;node={type:'OR',left:node,right:and()};}return node;}
  const ast=or();if(at!==tokens.length)throw new Error('Unexpected closing parenthesis.');return ast;
}
export function termPattern(term,stemAware=false){
  let parts=term.value.split('*').map(escape);
  let source=parts.join('[\\p{L}\\p{N}_-]*');
  if(stemAware&&!term.phrase&&!term.value.includes('*')&&/^[a-z]{5,}$/i.test(term.value))source=escape(term.value.replace(/(ing|ed|es|s)$/i,''))+'[\\p{L}]*';
  source=source.replace(/\s+/g,'\\s+');
  return new RegExp(`(?<![\\p{L}\\p{N}_])${source}(?![\\p{L}\\p{N}_])`,'iu');
}
export function evaluateQuery(query,fields,options={}){
  try{
    const ast=parseQuery(query),leaves=[];
    const evaluate=(node,scope='text',negated=false)=>{
      if(node.type==='FIELD')return evaluate(node.child,node.field,negated);
      if(node.type==='NOT')return !evaluate(node.child,scope,!negated);
      if(node.type==='AND'||node.type==='OR'){
        const a=evaluate(node.left,scope,negated),b=evaluate(node.right,scope,negated);return node.type==='AND'?a&&b:a||b;
      }
      const matched=termPattern(node,options.stemAware).test(fields[scope]||'');leaves.push({...node,scope,matched,negated});return matched;
    };
    const passed=evaluate(ast);
    const split=n=>n.type==='AND'?[...split(n.left),...split(n.right)]:[n];
    const clauses=split(ast).map(node=>({node,passed:evaluate(node)}));
    return {passed,leaves:leaves.slice(0,leaves.length/2||leaves.length),clauses,error:null};
  }catch(error){return {passed:false,leaves:[],clauses:[],error:error.message};}
}
export function highlightParts(text,leaves){
  const ranges=[];
  for(const leaf of leaves.filter(l=>l.matched&&!l.negated)){
    const re=new RegExp(termPattern(leaf).source,'giu');let m;
    while((m=re.exec(text))!==null){ranges.push([m.index,m.index+m[0].length]);if(m[0].length===0)break;}
  }
  ranges.sort((a,b)=>a[0]-b[0]);const merged=[];
  for(const r of ranges){const prev=merged.at(-1);if(prev&&r[0]<=prev[1])prev[1]=Math.max(prev[1],r[1]);else merged.push([...r]);}
  const out=[];let i=0;
  for(const [s,e]of merged){if(s>i)out.push({text:text.slice(i,s),hit:false});out.push({text:text.slice(s,e),hit:true});i=e;}
  if(i<text.length)out.push({text:text.slice(i),hit:false});return out;
}
