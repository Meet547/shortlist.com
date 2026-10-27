import {readFile,readdir,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const excluded=new Set(['.git','node_modules','dist','.venv','coverage']);
async function markdownFiles(dir){
  const entries=await readdir(dir,{withFileTypes:true});
  return (await Promise.all(entries.filter(e=>!excluded.has(e.name)).map(e=>e.isDirectory()?markdownFiles(path.join(dir,e.name)):e.name.endsWith('.md')?[path.join(dir,e.name)]:[]))).flat();
}
const stripFences=text=>text.replace(/^```[^\n]*\n[\s\S]*?^```\s*$/gm,'');
function headings(text){
  const counts=new Map();
  return new Set([...stripFences(text).matchAll(/^#{1,6}\s+(.+)$/gm)].map(([,title])=>{
    const base=title.toLowerCase().replace(/<[^>]*>/g,'').replace(/[^\p{L}\p{N}_\-\s]/gu,'').trim().replace(/\s/g,'-');
    const count=counts.get(base)||0;counts.set(base,count+1);return count?`${base}-${count}`:base;
  }));
}
const files=await markdownFiles(root),errors=[];let links=0;
for(const file of files){
  const content=stripFences(await readFile(file,'utf8'));
  const destinations=[...content.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)].map(m=>m[1]).concat([...content.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/g)].map(m=>m[1]));
  for(let target of destinations){
    target=target.trim().replace(/^<|>$/g,'');
    if(/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(target))continue;
    links++;
    const [relative,anchor]=target.split('#'),destination=relative?path.resolve(path.dirname(file),decodeURIComponent(relative)):file;
    const entry=await stat(destination).catch(()=>null);
    if(!entry){errors.push(`${path.relative(root,file)}: missing ${target}`);continue;}
    if(anchor&&destination.endsWith('.md')&&!headings(await readFile(destination,'utf8')).has(decodeURIComponent(anchor)))errors.push(`${path.relative(root,file)}: missing heading ${target}`);
  }
}
if(errors.length){process.stderr.write(errors.join('\n')+'\n');process.exitCode=1;}
else process.stdout.write(`Verified ${links} local documentation links/assets across ${files.length} Markdown files.\n`);
