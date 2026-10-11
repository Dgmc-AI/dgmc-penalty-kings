import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const smooth=(a,b,x)=>THREE.MathUtils.smoothstep(x,a,b);
function printTexture(text){const c=document.createElement('canvas');c.width=256;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.font='bold 60px Arial';ctx.textAlign='center';ctx.fillText(text,128,88);const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;return tex;}
export async function loadFootballers(){const gltf=await new GLTFLoader().loadAsync('/models/footballer.glb');return {striker:createPlayer(gltf.scene,0x28a5b0,false),keeper:createPlayer(gltf.scene,0xffce59,true)}};
function createPlayer(source,color,keeper){
  const root=new THREE.Group(),rig=new THREE.Group();root.add(rig);
  const bone=(name,x,y,z,parent)=>{const b=new THREE.Bone();b.name=name;b.position.set(x,y,z);parent.add(b);return b};
  const hips=bone('hips',0,.98,0,rig),spine=bone('spine',0,.29,0,hips),head=bone('head',0,.28,0,spine);
  const legs=[-1,1].map(side=>{const thigh=bone(`thigh${side}`,side*.145,-.01,0,hips),calf=bone(`calf${side}`,0,-.44,.012,thigh);return {thigh,calf}});
  const arms=[-1,1].map(side=>{const arm=bone(`arm${side}`,side*.24,.23,.005,spine),fore=bone(`fore${side}`,side*.068,-.30,.01,arm);return {arm,fore}});
  const bones=[hips,spine,head,...legs.flatMap(x=>[x.thigh,x.calf]),...arms.flatMap(x=>[x.arm,x.fore])];rig.updateMatrixWorld(true);const skeleton=new THREE.Skeleton(bones);const kit=new THREE.MeshStandardMaterial({color,roughness:.86});let bodyMesh;
  source.updateMatrixWorld(true);
  source.traverse(object=>{if(!object.isMesh||/Soccer_ball|Soccer_jersey_number|Soccer ball|Soccer jersey number/.test(object.name))return;
    const geometry=object.geometry.clone();geometry.applyMatrix4(object.matrixWorld);
    const pos=geometry.attributes.position,indices=new Uint16Array(pos.count*4),weights=new Float32Array(pos.count*4);
    for(let i=0;i<pos.count;i++){const x=pos.getX(i),y=pos.getY(i),ax=Math.abs(x);let a=1,b=0,w=1;
      if(y>1.5&&ax<.17){a=2;b=1;w=smooth(1.48,1.6,y);}
      else if(ax>.205&&y>.87){const side=x<0?0:1;const upper=7+side*2,lower=upper+1;a=y<1.18?lower:upper;b=y<1.18?upper:1;w=y<1.18?1-smooth(1.10,1.22,y):smooth(.20,.29,ax);}
      else if(y<1.05){const side=x<0?0:1;const thigh=3+side*2,calf=thigh+1;a=y<.55?calf:thigh;b=y<.55?thigh:0;w=y<.55?1-smooth(.48,.60,y):1-smooth(.87,1.06,y);}
      else{a=1;b=0;w=smooth(.98,1.2,y);}
      indices[i*4]=a;indices[i*4+1]=b;weights[i*4]=w;weights[i*4+1]=1-w;
    }
    geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(indices,4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
    let material=object.material.clone();if(/top/.test(material.name)){material=kit;material.normalMap=object.material.normalMap;material.normalScale.set(.5,.5);}
    if(/bottom/.test(material.name)){material.color.setHex(0x314856)}
    const skinned=new THREE.SkinnedMesh(geometry,material);skinned.castShadow=true;skinned.receiveShadow=true;skinned.frustumCulled=false;rig.add(skinned);skinned.bind(skeleton);if(/anatomical_body/.test(object.name))bodyMesh=skinned;
  });
  // DGMC jersey branding and squad numbers move with the torso bone.
  for(const [text,width,height,y,z,rotation] of [['DGMC',.20,.075,.07,.173,0],[keeper?'1':'10',.13,.14,.025,-.112,Math.PI]]){const badge=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshStandardMaterial({map:printTexture(text),transparent:true,depthWrite:false,roughness:.9}));badge.position.set(0,y,z);badge.rotation.y=rotation;spine.add(badge);}
  const gloveMaterial=new THREE.MeshStandardMaterial({color:0xe5efc8,roughness:.7});if(keeper){for(let i=0;i<arms.length;i++){const side=i===0?-1:1;const glove=new THREE.Mesh(new THREE.BoxGeometry(.075,.12,.055),gloveMaterial);glove.position.set(side*.02,-.26,.045);arms[i].fore.add(glove);}}
  return {root,rig,kit,pose(kind,t=0,dir=1){hips.rotation.set(0,0,0);spine.rotation.set(0,0,0);rig.rotation.set(0,0,0);rig.position.set(0,0,0);arms.forEach(({arm,fore})=>{arm.rotation.set(0,0,0);fore.rotation.set(0,0,0)});legs.forEach(({thigh,calf})=>{thigh.rotation.set(0,0,0);calf.rotation.set(0,0,0)});
    if(kind==='idle'){spine.rotation.x=Math.sin(t*2)*.018;}
    if(kind==='ready'){rig.position.y=-.065;legs.forEach(({thigh,calf},i)=>{thigh.rotation.x=-.2;calf.rotation.x=.36;thigh.rotation.z=(i?1:-1)*-.07});arms.forEach(({arm,fore},i)=>{arm.rotation.z=(i?1:-1)*.4;fore.rotation.x=-.6});}
    if(kind==='kick'){const s=Math.sin(t*Math.PI);legs[1].thigh.rotation.x=-s*1.4;legs[1].calf.rotation.x=Math.sin(t*Math.PI*2)*.55;spine.rotation.x=s*.14;arms[0].arm.rotation.z=-.4*s;arms[1].arm.rotation.z=.55*s;rig.position.z=t*.45;}
    if(kind==='dive'){rig.rotation.z=-dir*t*1.28;rig.position.x=-dir*Math.sin(t*1.28)*.98;rig.position.y=Math.sin(t*Math.PI)*.3+t*.05;arms.forEach(({arm,fore},i)=>{arm.rotation.z=(i?1:-1)*(.4+t*2.1);fore.rotation.x=-.2});legs[0].thigh.rotation.x=-t*.3;legs[1].thigh.rotation.x=t*.25;}
    if(kind==='celebrate'){rig.position.y=Math.max(0,Math.sin(t*8))*.14;arms[0].arm.rotation.z=-2.6;arms[1].arm.rotation.z=2.6;spine.rotation.y=Math.sin(t*3)*.14;}
  }};
}
