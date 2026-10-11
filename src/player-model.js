import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
export const KICK_CONTACT=.55;
const smooth=(a,b,x)=>THREE.MathUtils.smoothstep(x,a,b);
function printTexture(text){const c=document.createElement('canvas');c.width=512;c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.font='bold 150px Arial';ctx.textAlign='center';ctx.fillText(text,256,190);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;}
export async function loadFootballers(){const gltf=await new GLTFLoader().loadAsync('/models/footballer.glb');return {striker:createPlayer(gltf.scene,0x168d9d,false),keeper:createPlayer(gltf.scene,0xffc64b,true)}};
// Skin each garment according to its anatomy. In particular, the shirt hem must
// stay attached to the pelvis, even when it extends farther out than an arm.
// Weld coincident vertices for diffusion across UV seams, then smooth joint
// weights along mesh edges. This keeps adjacent triangles moving together.
export function skinWeights(geometry,part){
  const pos=geometry.attributes.position,idx=geometry.index;
  const groups=[],lookup=new Map(),vertexGroup=[];
  for(let i=0;i<pos.count;i++){const key=[pos.getX(i),pos.getY(i),pos.getZ(i)].map(v=>Math.round(v*100000)).join(',');let g=lookup.get(key);if(g===undefined){g=groups.length;lookup.set(key,g);groups.push({neighbors:new Set(),weights:new Float64Array(11),position:[pos.getX(i),pos.getY(i),pos.getZ(i)]});}vertexGroup[i]=g;}
  const add=(a,b)=>{a=vertexGroup[a];b=vertexGroup[b];if(a!==b){groups[a].neighbors.add(b);groups[b].neighbors.add(a)}};
  for(let i=0;i<(idx?.count||pos.count);i+=3){const a=idx?idx.getX(i):i,b=idx?idx.getX(i+1):i+1,c=idx?idx.getX(i+2):i+2;add(a,b);add(b,c);add(c,a);}
  const armGroups=new Set();
  if(part==='body'){
    const visited=new Set();
    // Below the upper arm, hands and hips overlap in height but are separate
    // surface components. Follow actual mesh connectivity to the fingertips.
    const eligible=g=>{const [x,y]=g.position;return Math.abs(x)>.14&&y>.70&&y<1.34};
    for(let n=0;n<groups.length;n++){
      if(visited.has(n)||!eligible(groups[n]))continue;
      const component=[n];visited.add(n);
      for(let k=0;k<component.length;k++)for(const next of groups[component[k]].neighbors){if(!visited.has(next)&&eligible(groups[next])){visited.add(next);component.push(next)}}
      const meanX=component.reduce((sum,k)=>sum+Math.abs(groups[k].position[0]),0)/component.length;
      const elbow=component.some(k=>{const [x,y]=groups[k].position;return Math.abs(x)>.285&&y>1.15&&y<1.3});
      if(elbow||meanX>.235)component.forEach(k=>armGroups.add(k));
    }
  }
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),y=pos.getY(i),ax=Math.abs(x),side=x<0?0:1,w=groups[vertexGroup[i]].weights;w.fill(0);
    const pair=(a,b,t)=>{w[a]=t;w[b]=1-t};
    if(part==='head'){w[2]=1;}
    else if(part==='shirt'){
      const sleeve=smooth(.18,.27,ax)*smooth(1.31,1.43,y);
      const torso=smooth(1.02,1.18,y);w[7+side*2]=sleeve;w[1]=(1-sleeve)*torso;w[0]=(1-sleeve)*(1-torso);
    }else if(part==='body'&&y>1.51){pair(2,1,smooth(1.51,1.59,y));}
    else if(part==='body'&&(armGroups.has(vertexGroup[i])||(y>=1.34&&ax>THREE.MathUtils.lerp(.225,.155,smooth(1.32,1.48,y))))){
      // The bent forearms sit alongside the waist. They belong to the arm,
      // while the body's actual hip surface remains on the pelvic chain.
      const upper=7+side*2,lower=upper+1;
      if(y<1.30)pair(lower,upper,1-smooth(1.19,1.31,y));
      else pair(upper,1,1-smooth(1.40,1.49,y));
    }else if(y<1.08){const thigh=3+side*2,calf=thigh+1;if(y<.65)pair(calf,thigh,1-smooth(.54,.65,y));else pair(thigh,0,1-smooth(.93,1.07,y));}
    else pair(1,0,smooth(1.02,1.19,y));
  }
  // Local diffusion, rather than independent positional cutoffs, removes sharp
  // weight discontinuities at elbows, armpits, knees and garment seams.
  for(let pass=0;pass<8;pass++){
    const next=groups.map(g=>{const a=g.weights.slice();if(g.neighbors.size){for(let k=0;k<11;k++){let sum=0;for(const n of g.neighbors)sum+=groups[n].weights[k];a[k]=g.weights[k]*.6+sum/g.neighbors.size*.4;}}return a;});next.forEach((w,i)=>groups[i].weights=w);
  }
  const indices=new Uint16Array(pos.count*4),weights=new Float32Array(pos.count*4);
  for(let i=0;i<pos.count;i++){const w=groups[vertexGroup[i]].weights.slice();if(part==='shirt'){const sleeve=smooth(1.25,1.40,pos.getY(i));for(let k=7;k<11;k++){w[1]+=w[k]*(1-sleeve);w[k]*=sleeve;}}const ordered=Array.from(w,(v,k)=>({v,k})).sort((a,b)=>b.v-a.v).slice(0,4);const total=ordered.reduce((s,a)=>s+a.v,0);ordered.forEach((a,k)=>{indices[i*4+k]=a.k;weights[i*4+k]=a.v/total});}
  geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
}
function createPlayer(source,color,keeper){
  const root=new THREE.Group(),rig=new THREE.Group();root.add(rig);
  const bone=(name,x,y,z,parent)=>{const b=new THREE.Bone();b.name=name;b.position.set(x,y,z);parent.add(b);return b};
  const hips=bone('hips',0,1.02,0,rig),spine=bone('spine',0,.27,0,hips),head=bone('head',0,.27,0,spine);
  const legs=[-1,1].map(side=>{const thigh=bone(`thigh${side}`,side*.155,-.02,0,hips),calf=bone(`calf${side}`,0,-.41,.015,thigh);return {thigh,calf}});
  const arms=[-1,1].map(side=>{const arm=bone(`arm${side}`,side*.205,.155,-.01,spine),fore=bone(`fore${side}`,side*.12,-.19,-.015,arm);return {arm,fore}});
  const bones=[hips,spine,head,...legs.flatMap(x=>[x.thigh,x.calf]),...arms.flatMap(x=>[x.arm,x.fore])];rig.updateMatrixWorld(true);const skeleton=new THREE.Skeleton(bones);const kit=new THREE.MeshStandardMaterial({color,roughness:.8});const meshes=[];
  source.updateMatrixWorld(true);
  source.traverse(object=>{if(!object.isMesh||/Soccer.ball|Soccer.jersey.number/.test(object.name))return;
    const geometry=object.geometry.clone();geometry.applyMatrix4(object.matrixWorld);
    const name=object.material.name;
    const part=/top/.test(name)?'shirt':/eyebrow|eyelashes|hair|short01|low-poly|teeth/i.test(name)?'head':/body\.body/.test(name)?'body':'legs';
    skinWeights(geometry,part);
    let material=object.material.clone();if(part==='shirt'){material=kit;material.normalMap=object.material.normalMap;material.normalScale.set(.65,.65);}
    if(/bottom/.test(name))material.color.setHex(0x19313d);
    const skinned=new THREE.SkinnedMesh(geometry,material);skinned.name=object.name;skinned.castShadow=true;skinned.receiveShadow=true;skinned.frustumCulled=false;rig.add(skinned);skinned.bind(skeleton);meshes.push(skinned);
  });
  for(const [text,width,height,y,z,rotation] of [['DGMC',.23,.08,.085,.165,0],[keeper?'1':'10',.18,.21,.055,-.115,Math.PI]]){const badge=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshStandardMaterial({map:printTexture(text),transparent:true,depthWrite:false,roughness:.9}));badge.position.set(0,y,z);badge.rotation.y=rotation;spine.add(badge);}
  // Fitted, rounded goalkeeper gloves follow the wrists, rather than floating
  // boxes. The textured fingers and palms of the original hands remain visible.
  if(keeper){const m=new THREE.MeshStandardMaterial({color:0xecf2dd,roughness:.64});arms.forEach(({fore},i)=>{const side=i?1:-1;const glove=new THREE.Mesh(new THREE.CapsuleGeometry(.033,.055,4,8),m);glove.position.set(-side*.028,-.205,.065);glove.rotation.z=-side*.2;glove.castShadow=true;fore.add(glove);});}
  return {root,rig,kit,meshes,skeleton,deformationStats(){
    rig.updateMatrixWorld(true);skeleton.update();return meshes.map(m=>{
      const p=m.geometry.attributes.position,idx=m.geometry.index,points=[];
      for(let i=0;i<p.count;i++){const v=new THREE.Vector3().fromBufferAttribute(p,i);m.applyBoneTransform(i,v);points.push(v);}
      let maxEdge=0,maxRatio=0;const a=new THREE.Vector3(),b=new THREE.Vector3();
      for(let i=0;i<(idx?.count||p.count);i+=3)for(let j=0;j<3;j++){const u=idx?idx.getX(i+j):i+j,v=idx?idx.getX(i+(j+1)%3):i+(j+1)%3;const rest=a.fromBufferAttribute(p,u).distanceTo(b.fromBufferAttribute(p,v)),edge=points[u].distanceTo(points[v]);maxEdge=Math.max(maxEdge,edge);if(rest>.003)maxRatio=Math.max(maxRatio,edge/rest);}
      return {name:m.name,maxEdge,maxRatio};
    });
  },pose(kind,t=0,dir=1){hips.rotation.set(0,0,0);spine.rotation.set(0,0,0);head.rotation.set(0,0,0);rig.rotation.set(0,0,0);rig.position.set(0,0,0);arms.forEach(({arm,fore})=>{arm.rotation.set(0,0,0);fore.rotation.set(0,0,0)});legs.forEach(({thigh,calf})=>{thigh.rotation.set(0,0,0);calf.rotation.set(0,0,0)});
    const openArms=(angle)=>arms.forEach(({arm,fore},i)=>{arm.rotation.z=(i?1:-1)*angle;fore.rotation.z=(i?1:-1)*.35;});
    if(kind==='idle'){spine.rotation.x=Math.sin(t*2)*.015;openArms(-.1);}
    if(kind==='ready'){rig.position.y=-.05;legs.forEach(({thigh,calf},i)=>{thigh.rotation.x=-.16;calf.rotation.x=.3;thigh.rotation.z=(i?1:-1)*-.09});openArms(.18);arms.forEach(({fore})=>fore.rotation.x=-.35);spine.rotation.x=.04;}
    if(kind==='kick'){
      // Approach, plant, backswing, strike, follow-through. Contact is at t=.55.
      const approach=smooth(0,.45,t),strike=smooth(.38,.70,t),recover=smooth(.78,1,t);
      rig.position.z=approach*.55;rig.position.x=-.13*approach*(1-recover);
      legs[1].thigh.rotation.x=THREE.MathUtils.lerp(.55,-1.05,strike)*(1-recover);legs[1].calf.rotation.x=.8*(1-strike)*Math.sin(t*Math.PI);
      legs[0].thigh.rotation.x=-.08-Math.sin(approach*Math.PI)*.18;legs[0].calf.rotation.x=.15;
      spine.rotation.x=.12*strike*(1-recover);spine.rotation.y=-.18*Math.sin(t*Math.PI);openArms(.28*Math.sin(t*Math.PI));
    }
    if(kind==='dive'){
      if(dir===0){rig.position.y=-.1*t;openArms(.7*t);arms.forEach(({fore})=>fore.rotation.x=-.8*t);}
      else{rig.rotation.z=-dir*t*1.20;rig.position.x=-dir*Math.sin(t*1.20)*1.02;rig.position.y=Math.sin(t*Math.PI)*.22+t*.08;openArms(.3+t*2.4);arms.forEach(({fore},i)=>{fore.rotation.x=-.15;fore.rotation.z=(i?1:-1)*.8*t});legs[0].thigh.rotation.x=-t*.22;legs[1].thigh.rotation.x=t*.3;}
    }
    if(kind==='celebrate'){rig.position.y=Math.max(0,Math.sin(t*8))*.12;openArms(2.75);arms.forEach(({fore},i)=>fore.rotation.z=(i?1:-1)*.8);spine.rotation.y=Math.sin(t*3)*.1;}
  }};
}
