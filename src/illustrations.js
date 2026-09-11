import { markArtwork } from './artwork.js';
// Original frontal illustrations. Geometry, colours and stroke rules form one reusable family.
export const illustrationProfile = Object.freeze({
  name: 'Editorial flat', family: 'studio-editorial-flat', perspective: 'front',
  outlineWidth: 3, detailWidth: 1.5,
  palette: Object.freeze({ ink: '#243752', teal: '#197C78', light: '#E6F3EE', warm: '#E9C399', paper: '#FFFEFA', muted: '#B6C8CB' }),
});

const sizes = { person:[80,112], shield:[60,65], key:[53,53], credential:[108,74], bank:[130,121], wallet:[148,123], robot:[164,170], scales:[96,96], ledger:[76,96], contract:[123,132], oracle:[99,92], money:[89,51], calendar:[38,43], rates:[57,43] };
export function listIllustrations() { return Object.entries(sizes).map(([name,[width,height]])=>({name,width,height,family:illustrationProfile.family})); }

export function createIllustration(name, { id, x=0, y=0, scale=1, variant='teal' }={}) {
  if(!Object.hasOwn(sizes,name))throw new Error(`Unknown illustration: ${name}.`);
  if(!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(id??''))throw new Error('An illustration needs a stable, valid id.');
  if(![x,y,scale].every(Number.isFinite)||scale<=0||scale>20)throw new Error('Invalid illustration placement.');
  if(!['teal','warm','elder'].includes(variant))throw new Error('Illustration variant must be teal, warm or elder.');
  const c=illustrationProfile.palette, out=[];let seq=0;
  const add=(type,props)=>out.push({id:`${id}-${++seq}`,type,...props});
  const R=(a,b,w,h,fill=c.paper,rx=5,stroke=c.ink)=>add('rect',{x:x+a*scale,y:y+b*scale,width:w*scale,height:h*scale,rx:rx*scale,fill,stroke,strokeWidth:3});
  const E=(a,b,rx,ry,fill=c.paper,stroke=c.ink)=>add('ellipse',{x:x+a*scale,y:y+b*scale,rx:rx*scale,ry:ry*scale,fill,stroke,strokeWidth:3});
  const L=(a,b,d,e,stroke=c.ink,detail=false)=>add('line',{x:x+a*scale,y:y+b*scale,x2:x+d*scale,y2:y+e*scale,stroke,strokeWidth:detail?1.5:3});
  const P=(d,fill='none',stroke=c.ink,detail=false)=>{
    let command,index=0;
    const transformed=d.replace(/[MLCQHVZ]|-?\d*\.?\d+/g,token=>{
      if(/^[A-Z]$/.test(token)){command=token;index=0;return token;}
      return String((command==='H'||(command!=='V'&&index++%2===0)?x:y)+Number(token)*scale);
    });
    add('path',{d:transformed,fill,stroke,strokeWidth:detail?1.5:3});
  };
  const dot=(a,b,r=2,fill=c.ink)=>E(a,b,r,r,fill,'none');
  switch(name){
    case 'person': {
      const shirt=variant==='warm'?c.warm:c.teal, hair=variant==='elder'?c.muted:c.ink;
      P('M8 105 L9 83 Q10 69 31 64 L49 64 Q70 69 71 83 L72 105 Q41 115 8 105 Z',shirt);
      R(33,51,14,19,c.warm,4);
      P('M27 66 L40 77 L53 66 L49 88 L40 78 L31 88 Z',c.paper,c.ink,true);
      E(18,37,4,6,c.warm);E(62,37,4,6,c.warm);
      P('M18 28 Q18 6 40 6 Q62 6 62 28 L61 41 Q60 63 40 64 Q20 63 19 41 Z',c.warm);
      P(variant==='elder'?'M19 29 Q14 4 40 4 Q66 4 61 29 L55 18 Q40 13 24 22 Z':'M18 31 Q13 5 34 4 Q59 0 63 27 Q45 26 38 15 Q34 28 18 31 Z',hair);
      dot(32,36,1.4);dot(48,36,1.4);
      P('M35 49 Q40 54 46 48','none',c.ink,true);
      if(variant==='elder'){R(23,31,13,10,'none',3);R(44,31,13,10,'none',3);L(36,35,44,35,c.ink,true);}
      break;
    }
    case 'shield':
      P('M30 4 L54 13 L52 38 Q48 55 30 63 Q12 55 8 38 L6 13 Z',c.light);
      P('M18 31 L27 41 L43 23','none',c.teal);break;
    case 'key':
      P('M23 18 L49 44 L49 50 L41 50 L41 43 L34 43 L34 36 L20 23 Z',c.warm);
      E(14,14,12,12,c.warm);E(14,14,4,4,c.paper,'none');break;
    case 'credential':
      R(1,1,106,72,c.paper,8);R(1,1,106,13,c.teal,6);
      E(26,33,8,9,c.warm);P('M12 61 L13 55 Q16 46 26 46 Q38 46 40 55 L40 61 Z',c.light);
      for(let i=0;i<3;i++)L(54,29+i*12,92-i%2*10,29+i*12,c.muted,true);
      break;
    case 'bank':
      R(10,37,110,73,c.paper,3);P('M2 31 L65 2 L128 31 Z',c.warm);
      R(5,32,120,10,c.light,2);for(let i=0;i<4;i++)R(17+i*27,43,15,61,c.paper,2);
      R(4,106,122,12,c.light,2);E(65,20,5,5,c.paper,'none');break;
    case 'wallet':
      R(7,17,128,94,c.light,12);R(19,2,111,74,c.paper,6);
      L(32,17,115,17,c.muted,true);L(32,28,91,28,c.muted,true);
      R(1,39,139,82,c.teal,12);R(99,62,47,30,c.light,6);dot(114,77,4,c.teal);
      E(33,73,8,8,c.warm,c.paper);L(40,79,60,99,c.paper);L(49,87,55,81,c.paper);break;
    case 'robot':
      P('M27 165 L30 147 Q37 127 68 122 L96 122 Q129 128 135 147 L138 165 Z',c.teal);
      R(5,67,20,37,c.warm,7);R(140,67,19,37,c.warm,7);
      R(24,38,116,94,c.light,31);
      P('M25 63 L25 44 Q24 15 82 15 Q140 15 140 44 L140 63 Q118 46 102 56 Q82 43 62 56 Q43 46 25 63 Z',c.teal);
      for(let i=0;i<4;i++){L(51+i*21,29,51+i*21,47,c.paper,true);dot(51+i*21,27,3,c.warm);}
      R(43,73,27,17,c.paper,7);R(96,73,27,17,c.paper,7);dot(57,81,3);dot(110,81,3);
      P('M72 108 Q83 119 96 107','none',c.teal);
      P('M83 144 C70 132 64 146 83 157 C103 145 94 132 83 144 Z',c.warm,c.ink,true);break;
    case 'scales':
      L(48,14,48,84);L(17,29,79,29);R(25,84,46,7,c.light,3);dot(48,14,5,c.warm);
      for(const a of [18,78]){L(a,30,a-14,59,c.ink,true);L(a,30,a+14,59,c.ink,true);P(`M${a-16} 60 Q${a} 82 ${a+16} 60 Z`,c.warm);}break;
    case 'ledger':
      R(5,31,66,59,c.light,8);R(5,31,66,13,c.teal,5);
      L(19,58,55,58,c.teal,true);L(19,70,44,70,c.teal,true);
      L(38,31,38,7,c.teal);P('M38 21 Q17 21 21 6 Q40 4 38 21 Z',c.light);P('M38 15 Q59 14 54 0 Q37 1 38 15 Z',c.teal);break;
    case 'contract':
      P('M9 1 L85 1 L108 24 L108 130 L9 130 Z',c.paper);P('M85 1 L85 24 L108 24 Z',c.light);
      for(let i=0;i<4;i++)L(25,39+i*16,87-i%2*12,39+i*16,c.muted,true);
      P('M24 111 Q40 96 40 111 Q54 104 56 112 Q69 104 79 108','none',c.teal,true);
      P('M78 114 L115 73 L121 79 L84 121 L75 124 Z',c.warm);break;
    case 'oracle': {
      const nodes=[[13,24],[52,8],[86,31],[25,78],[72,82],[51,48]];
      for(const[a,b]of[[0,1],[1,2],[0,3],[2,4],[3,4],[0,5],[1,5],[2,5],[3,5],[4,5]])L(...nodes[a],...nodes[b],c.teal,true);
      nodes.forEach(([a,b],i)=>E(a,b,i===5?10:6,i===5?10:6,i===5?c.teal:c.warm));break;
    }
    case 'money':
      R(1,10,76,39,c.light,3);R(11,1,76,39,c.teal,3);R(19,8,60,25,c.light,4);E(49,20,9,9,c.warm);break;
    case 'calendar':
      R(1,5,36,36,c.paper,4);R(1,5,36,10,c.teal,3);L(10,1,10,10);L(28,1,28,10);
      for(let i=0;i<3;i++)for(let j=0;j<2;j++)R(7+i*10,22+j*9,4,4,c.warm,0,'none');break;
    case 'rates':
      R(1,1,55,41,c.light,5);P('M10 32 L19 22 L29 27 L47 12','none',c.teal);break;
  }
  return markArtwork(out, id, { x, y, width:sizes[name][0]*scale, height:sizes[name][1]*scale });
}
