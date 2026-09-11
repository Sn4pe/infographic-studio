import { layoutText } from './text.js';

const overlap = (a,b) => a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
const inside = ([x,y],b) => x>=b.x && x<=b.x+b.w && y>=b.y && y<=b.y+b.h;
const box = ({x,y,width,height}) => ({x,y,w:width,h:height});

// Liang–Barsky clipping: unlike segment bounding boxes, diagonals near text do not collide.
export function segmentIntersectsBox(a,b,r,padding=0) {
  const minX=r.x-padding,maxX=r.x+r.w+padding,minY=r.y-padding,maxY=r.y+r.h+padding;
  const dx=b[0]-a[0],dy=b[1]-a[1]; let low=0,high=1;
  for(const [p,q] of [[-dx,a[0]-minX],[dx,maxX-a[0]],[-dy,a[1]-minY],[dy,maxY-a[1]]]) {
    if(p===0) { if(q<0)return false; continue; }
    const t=q/p;
    if(p<0)low=Math.max(low,t);else high=Math.min(high,t);
    if(low>high)return false;
  }
  return true;
}

function textLines(e) {
  const size=e.fontSize??20, layout=layoutText(e.text,e.width,size,e.weight);
  return layout.widths.flatMap((w,i)=> w ? [{x:e.x+(e.align==='center'?(e.width-w)/2:e.align==='right'?e.width-w:0),y:e.y+size*.2+i*size*1.3,w,h:size*.85}] : []);
}

function segments(e) {
  if(e.rotation)return [];
  if(['line','arrow'].includes(e.type))return [[[e.x,e.y],[e.x2,e.y2]]];
  if(e.type!=='path'||/[aAcCqQsStT]/.test(e.d))return [];
  const tokens=e.d.match(/[mMlLhHvVzZ]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g)??[];
  let i=0,command,point=[0,0],start=[0,0];const lines=[];
  while(i<tokens.length) {
    if(/^[a-z]$/i.test(tokens[i]))command=tokens[i++];
    if(!command)return [];
    const upper=command.toUpperCase(),relative=command!==upper;
    if(upper==='Z'){lines.push([point,start]);point=[...start];command=null;continue;}
    const count=['M','L'].includes(upper)?2:1;
    const values=tokens.slice(i,i+count).map(Number);
    if(values.length!==count||values.some(v=>!Number.isFinite(v)))return [];
    i+=count;let next;
    if(upper==='H')next=[values[0]+(relative?point[0]:0),point[1]];
    else if(upper==='V')next=[point[0],values[0]+(relative?point[1]:0)];
    else next=[values[0]+(relative?point[0]:0),values[1]+(relative?point[1]:0)];
    if(upper==='M'){start=[...next];command=relative?'l':'L';}else lines.push([point,next]);
    point=next;
  }
  return lines;
}

function foregroundBox(e) {
  if(['image','icon','rect'].includes(e.type))return box(e);
  if(e.type==='ellipse')return {x:e.x-e.rx,y:e.y-e.ry,w:2*e.rx,h:2*e.ry};
  return null;
}

// Warnings are conservative layout evidence, not proof of pixel-level occlusion.
export function inspectCollisions(panel) {
  const issues=[], seen=new Set(), artwork=new Map(), members=new Set();
  const add=(code,element,other,message,severity='warning')=>{
    const key=`${code}:${element}:${other}`;
    if(!seen.has(key)){seen.add(key);issues.push({severity,code,element,relatedElement:other,message});}
  };
  const labels=[];
  if(panel.title)labels.push({id:`${panel.id}-title`,index:-1,lines:textLines({text:panel.title,x:24,y:36,width:panel.width-48,fontSize:25,weight:'semibold'})});
  if(panel.kicker)labels.push({id:`${panel.id}-kicker`,index:-1,lines:textLines({text:panel.kicker,x:24,y:14,width:panel.width-48,fontSize:16,weight:'semibold'})});
  panel.elements.forEach((e,index)=>{
    if(e.type==='text'&&!e.rotation&&(e.opacity??1)>0&&e.fill!=='none')labels.push({id:e.id,index,lines:textLines(e)});
    if(e.artworkId)members.add(e.artworkId);
    if(e.artworkBounds) {
      if(!e.artworkId||artwork.has(e.artworkId))add('artwork-metadata',e.id,e.artworkId??e.id,'Artwork needs one uniquely identified bounds record.','error');
      else artwork.set(e.artworkId,{...box(e.artworkBounds),id:e.artworkId});
    }
    if(e.type==='icon'&&!e.rotation&&(e.opacity??1)>0&&!e.artworkId)artwork.set(`icon:${e.id}`,{...box(e),id:e.id});
  });
  for(const member of members)if(!artwork.has(member))add('artwork-metadata',member,member,'Artwork group has no bounds record in this panel.','error');
  for(const art of artwork.values()) {
    if(art.x<0||art.y<0||art.x+art.w>panel.width||art.y+art.h>panel.height)add('artwork-bounds',art.id,art.id,'Artwork bounds extend outside the panel.','error');
    for(const label of labels)if(label.lines.some(b=>overlap(b,art)))add('label-artwork-overlap',label.id,art.id,`Text overlaps illustration ${art.id}. Move the illustration or label; reserve separate space for both.`);
  }
  panel.elements.forEach((e,index)=>{
    if(e.rotation||(e.opacity??1)===0)return;
    // Legacy flattened scenes: catch opaque shapes/images painted over earlier labels.
    // Earlier backgrounds behind labels are intentionally excluded.
    if(!e.artworkId&&e.type!=='icon'&&(e.opacity??1)>=.8&&(e.type==='image'||(e.fill&&e.fill!=='none'))) {
      const bounds=foregroundBox(e);
      if(bounds)for(const label of labels)if(label.index<index&&label.lines.some(b=>overlap(b,bounds)))add('label-occluded',label.id,e.id,`Later artwork ${e.id} overlaps text. Check paint order and separate the label from the artwork.`);
    }
    if(e.artworkId||!e.stroke||e.stroke==='none')return;
    const parts=segments(e),padding=(e.strokeWidth??2)/2;
    for(const label of labels)if(parts.some(([a,b])=>label.lines.some(r=>segmentIntersectsBox(a,b,r,padding))))add('connector-label-crossing',e.id,label.id,`Connector crosses text ${label.id}. Route it around the label.`);
    // A physical support or contour may run behind an object. It still must avoid text.
    if(e.geometryRole==='illustration')return;
    for(const art of artwork.values())if(parts.some(([a,b])=>!inside(a,art)&&!inside(b,art)&&segmentIntersectsBox(a,b,art,padding)))add('connector-artwork-crossing',e.id,art.id,`Connector passes through illustration ${art.id} without ending on it. Route around the illustration.`);
  });
  return issues;
}
