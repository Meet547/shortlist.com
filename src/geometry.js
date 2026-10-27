const contact=/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|(?:\+91[\s-]?)?[6-9](?:[\s-]?\d){9}|linkedin\.com|github\.com|grabcad\.com|https?:\/\/|(?:graduat|20\d{2})/i;
export function inspectGeometry(pages){
  const issues=[];let collision=false,multiColumn=false,marginText='',interleaved=false;
  const diagnostics=pages.map(page=>{
    const segments=page.segments.filter(s=>s.text.trim()),rows=[];
    for(const s of [...segments].sort((a,b)=>a.y-b.y||a.x-b.x)){
      let row=rows.find(r=>Math.abs(r.y-s.y)<3);if(!row){row={y:s.y,items:[]};rows.push(row);}row.items.push(s);
    }
    const margin=segments.filter(s=>s.y<36||s.y+s.height>page.height-36);marginText+=margin.map(s=>s.text).join('\n')+'\n';
    const splits=[];
    for(const row of rows){
      const sorted=row.items.sort((a,b)=>a.x-b.x);
      for(let i=1;i<sorted.length;i++){
        const left=sorted[i-1],right=sorted[i],gap=right.x-(left.x+left.width);
        if(left.x<page.width*.5&&right.x>page.width*.35&&right.x<page.width*.8&&gap>=8){splits.push({y:row.y,gap,center:(right.x+left.x+left.width)/2,rightX:right.x,leftEnd:left.x+left.width});}
      }
    }
    const clusters=[];
    for(const split of splits){let group=clusters.find(g=>Math.abs(g.center-split.center)<32);if(!group){group={center:split.center,items:[]};clusters.push(group);}group.items.push(split);}
    const dominant=clusters.sort((a,b)=>b.items.length-a.items.length)[0];
    const column=dominant&&dominant.items.length>=4&&dominant.items.length/Math.max(rows.length,1)>.16;
    let gutter=null,pageCollision=false;
    if(column){
      multiColumn=true;gutter=Math.min(...dominant.items.map(s=>s.gap));
      const native=segments.sort((a,b)=>a.order-b.order),sides=native.filter(s=>s.y>55&&s.y<page.height-40).map(s=>s.x+s.width/2<dominant.center?'L':'R');
      const switches=sides.filter((side,i)=>i>0&&side!==sides[i-1]).length;
      interleaved=interleaved||switches>=6;pageCollision=gutter<=25||switches>=6;collision=collision||pageCollision;
      issues.push({code:pageCollision?'column-collision':'multi-column',severity:pageCollision?'error':'warning',page:page.number,message:`Page ${page.number}: repeated column split; minimum observed gutter ${Math.round(gutter)} pt.${pageCollision?' Narrow gutter or alternating text-stream order can interleave content.':' A clean gutter was observed; verify the raw extraction order.'}`});
    }
    if(margin.some(s=>contact.test(s.text)))issues.push({code:'margin-contact',severity:'warning',page:page.number,message:`Page ${page.number}: contact, URL or date text falls within the top/bottom 36 pt margin. Some parsers may strip it.`});
    const glyphs=segments.filter(s=>/[\uFFFD\uE000-\uF8FF]|[★☆]/.test(s.text));
    if(glyphs.length)issues.push({code:'glyphs',severity:'warning',page:page.number,message:`Page ${page.number}: ${glyphs.length} text runs contain replacement, private-use or rating glyphs.`});
    if(segments.length===0)issues.push({code:'no-text',severity:'error',page:page.number,message:`Page ${page.number}: no selectable text. Scanned images or outlined vector glyphs require OCR or a text-based export.`});
    return {page:page.number,width:page.width,height:page.height,textRuns:segments.length,columnDetected:!!column,gutter,collision:pageCollision,fonts:[...new Set(segments.map(s=>Math.round(s.height)))].sort((a,b)=>a-b)};
  });
  return {geometryVerified:true,collision,multiColumn,interleaved,marginText,headerFooterContact:issues.some(i=>i.code==='margin-contact'),issues,pages:diagnostics};
}
