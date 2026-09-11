// Orthogonal visibility routing around complete illustrated object bounds.
const round = n => Math.round(n * 1000) / 1000;
const key = ([x,y]) => `${round(x)},${round(y)}`;
const hit = (a,b,r) => a[0] === b[0]
  ? a[0] > r.x && a[0] < r.x+r.width && Math.max(a[1],b[1]) > r.y && Math.min(a[1],b[1]) < r.y+r.height
  : a[1] > r.y && a[1] < r.y+r.height && Math.max(a[0],b[0]) > r.x && Math.min(a[0],b[0]) < r.x+r.width;
const ports = r => [[r.x,r.y+r.height/2],[r.x+r.width,r.y+r.height/2],[r.x+r.width/2,r.y],[r.x+r.width/2,r.y+r.height]].map(p=>p.map(round));

export function routeConnections(objects, relations, area) {
  if (!relations.length) return [];
  const boxes = objects.map(r => ({...r,x:round(r.x-6),y:round(r.y-6),width:round(r.width+12),height:round(r.height+12)}));
  const allPorts = boxes.flatMap(ports);
  const xs = [...new Set([area.x,area.x+area.width,...boxes.flatMap(r=>[r.x,r.x+r.width]),...allPorts.map(p=>p[0])].map(round))].sort((a,b)=>a-b);
  const ys = [...new Set([area.y,area.y+area.height,...boxes.flatMap(r=>[r.y,r.y+r.height]),...allPorts.map(p=>p[1])].map(round))].sort((a,b)=>a-b);
  const points = [], index = new Map();
  for (const x of xs) for (const y of ys) if (!boxes.some(r=>x>r.x+.001&&x<r.x+r.width-.001&&y>r.y+.001&&y<r.y+r.height-.001)) { index.set(key([x,y]),points.length); points.push([x,y]); }
  const neighbors = points.map(()=>[]);
  for (let i=0;i<points.length;i++) {
    const a=points[i];
    for (const axis of [0,1]) {
      const coords=axis===0?xs:ys, at=coords.indexOf(a[axis]);
      const b=[...a]; b[axis]=coords[at+1];
      const j=index.get(key(b));
      if (j!==undefined&&!boxes.some(r=>hit(a,b,r))) {
        const distance=Math.abs(b[axis]-a[axis]); neighbors[i].push({to:j,axis,distance}); neighbors[j].push({to:i,axis,distance});
      }
    }
  }
  const used = new Set(), output=[];
  for (const relation of relations) {
    const source=boxes.find(r=>r.id===relation.from), target=boxes.find(r=>r.id===relation.to);
    const starts=ports(source).map(p=>index.get(key(p))).filter(i=>i!==undefined), ends=new Set(ports(target).map(p=>index.get(key(p))));
    const queue=starts.map(i=>({node:i,axis:-1,cost:0,path:[i]})), best=new Map(); let route;
    while(queue.length) {
      queue.sort((a,b)=>b.cost-a.cost); const current=queue.pop(), state=`${current.node}:${current.axis}`;
      if ((best.get(state)??Infinity)<=current.cost) continue;
      best.set(state,current.cost);
      if(ends.has(current.node)){route=current.path.map(i=>points[i]);break;}
      for(const edge of neighbors[current.node]){
        const segment=[current.node,edge.to].sort((a,b)=>a-b).join('-');
        queue.push({node:edge.to,axis:edge.axis,cost:current.cost+edge.distance+(current.axis!==-1&&current.axis!==edge.axis?20:0)+(used.has(segment)?80:0),path:[...current.path,edge.to]});
      }
    }
    if(!route)throw new Error(`${relation.id}: no clear route between ${relation.from} and ${relation.to}.`);
    for(let i=1;i<route.length;i++) used.add([index.get(key(route[i-1])),index.get(key(route[i]))].sort((a,b)=>a-b).join('-'));
    const compact=route.filter((p,i)=>!i||i===route.length-1||(route[i-1][0]!==p[0]||route[i+1][0]!==p[0])&&(route[i-1][1]!==p[1]||route[i+1][1]!==p[1]));
    for(let i=1;i<compact.length;i++)output.push({id:`${relation.id}-segment-${i}`,type:i===compact.length-1?'arrow':'line',x:compact[i-1][0],y:compact[i-1][1],x2:compact[i][0],y2:compact[i][1],stroke:'$secondary',strokeWidth:3});
  }
  return output;
}
