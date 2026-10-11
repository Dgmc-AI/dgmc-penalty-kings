import * as THREE from 'three';
import {loadFootballers} from './player-model.js';
const V=THREE.Vector3;
function texture(draw,w=512,h=512){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
const mat=(color,roughness=.75)=>new THREE.MeshStandardMaterial({color,roughness});
function mesh(g,m,parent,x=0,y=0,z=0){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
function box(parent,m,w,h,d,x,y,z){return mesh(new THREE.BoxGeometry(w,h,d),m,parent,x,y,z)}
function tube(parent,m,a,b,r=.04){const av=new V(...a),bv=new V(...b),dir=bv.clone().sub(av);const o=mesh(new THREE.CylinderGeometry(r,r,dir.length(),10),m,parent);o.position.copy(av.add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new V(0,1,0),dir.normalize());return o;}
function label(text,color='#d5f76b',bg='#08252d',width=1024,height=128){return texture((c,w,h)=>{c.fillStyle=bg;c.fillRect(0,0,w,h);c.fillStyle=color;c.font=`700 ${h*.47}px Arial`;c.textAlign='center';c.textBaseline='middle';c.fillText(text,w/2,h/2)},width,height)}
export class Stadium {
  constructor(container){
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color(0x07151f);this.scene.fog=new THREE.FogExp2(0x0a202b,.012);
    this.camera=new THREE.PerspectiveCamera(43,innerWidth/innerHeight,.1,180);this.renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.setSize(innerWidth,innerHeight);this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;container.appendChild(this.renderer.domElement);
    this.scene.add(new THREE.HemisphereLight(0xa8d4ec,0x2a492b,2.1));const ambient=new THREE.AmbientLight(0xb5cddd,.45);this.scene.add(ambient);
    const key=new THREE.DirectionalLight(0xe8f7ff,3.8);key.position.set(-12,26,15);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-15;key.shadow.camera.right=15;key.shadow.camera.top=20;key.shadow.camera.bottom=-10;key.shadow.normalBias=.04;this.scene.add(key);this.scene.add(key.target);
    const fill=new THREE.DirectionalLight(0xc7e6ff,1.7);fill.position.set(18,18,-10);this.scene.add(fill);
    this.makePitch();this.makeGoal();this.makeArena();this.makeBall();
    
    this.particles=[];this.menu=true;this.resize();window.addEventListener('resize',()=>this.resize());
    this.raycaster=new THREE.Raycaster();this.aimPlane=new THREE.Plane(new V(0,0,1),0);
  }
  async loadPlayers(){const players=await loadFootballers();this.keeper=players.keeper;this.striker=players.striker;this.keeper.root.position.set(0,0,.28);this.striker.root.position.set(.15,0,11.85);this.striker.root.rotation.y=Math.PI;this.scene.add(this.keeper.root,this.striker.root);}
  makePitch(){
    const grass=texture((c,w,h)=>{c.fillStyle='#397044';c.fillRect(0,0,w,h);for(let i=0;i<55000;i++){const shade=60+Math.random()*70;c.fillStyle=`rgba(${shade*.45},${shade},${shade*.42},.4)`;c.fillRect(Math.random()*w,Math.random()*h,.7,2.4)}},1024,1024);grass.wrapS=grass.wrapT=THREE.RepeatWrapping;grass.repeat.set(18,28);grass.anisotropy=4;
    const field=mesh(new THREE.PlaneGeometry(72,108),new THREE.MeshStandardMaterial({map:grass,roughness:1}),this.scene,0,-.018,-22);field.rotation.x=-Math.PI/2;
    const stripe=new THREE.MeshStandardMaterial({color:0x95b96b,transparent:true,opacity:.08,depthWrite:false});for(let i=0;i<14;i++){const s=mesh(new THREE.PlaneGeometry(68,4),stripe,this.scene,0,.001,20-i*8);s.rotation.x=-Math.PI/2;s.receiveShadow=false;s.castShadow=false;}
    const lineMat=new THREE.LineBasicMaterial({color:0xeaf0d5,transparent:true,opacity:.9});const line=pts=>{const g=new THREE.BufferGeometry().setFromPoints(pts.map(([x,z])=>new V(x,.014,z)));this.scene.add(new THREE.Line(g,lineMat));};
    line([[-34,0],[34,0],[34,-74],[-34,-74],[-34,0]]);line([[-20.16,0],[-20.16,16.5],[20.16,16.5],[20.16,0]]);line([[-9.16,0],[-9.16,5.5],[9.16,5.5],[9.16,0]]);
    const spot=mesh(new THREE.CircleGeometry(.12,24),mat(0xf3f1dc),this.scene,0,.015,11);spot.rotation.x=-Math.PI/2;const arc=[];for(let a=.205*Math.PI;a<.795*Math.PI;a+=.015)arc.push([Math.cos(a)*9.15,11+Math.sin(a)*9.15]);line(arc);
    for(const s of [-1,1]){tube(this.scene,mat(0xdedede),[s*34,0,0],[s*34,1.5,0],.025);const flag=box(this.scene,mat(0xd5f76b),.38,.25,.012,s*34+.19,1.36,0)}
  }
  makeGoal(){
    const posts=mat(0xf0f3ee,.35);tube(this.scene,posts,[-3.66,0,0],[-3.66,2.44,0],.06);tube(this.scene,posts,[3.66,0,0],[3.66,2.44,0],.06);tube(this.scene,posts,[-3.66,2.44,0],[3.66,2.44,0],.06);
    for(const s of [-1,1]){tube(this.scene,posts,[s*3.66,2.44,0],[s*3.66,2.44,-1.4],.035);tube(this.scene,posts,[s*3.66,2.44,-1.4],[s*3.66,0,-2.25],.035);tube(this.scene,posts,[s*3.66,0,-2.25],[s*3.66,0,0],.035)}
    const verts=[];const seg=(a,b)=>verts.push(...a,...b);for(let x=-3.66;x<=3.66;x+=.145){seg([x,0,-2.25],[x,2.44,-1.4]);seg([x,2.44,-1.4],[x,2.44,0]);}for(let y=0;y<=2.44;y+=.145){let z=-2.25+y/2.44*.85;seg([-3.66,y,z],[3.66,y,z]);for(const s of [-1,1])seg([s*3.66,y,z],[s*3.66,y,0]);}for(let z=-1.4;z<0;z+=.145)seg([-3.66,2.44,z],[3.66,2.44,z]);for(const s of [-1,1])for(let z=-2.2;z<0;z+=.145)seg([s*3.66,0,z],[s*3.66,2.44,Math.max(z,-1.4)]);
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));this.net=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0xc7e1da,transparent:true,opacity:.55}));this.scene.add(this.net);this.netOriginal=geometry.attributes.position.array.slice();
  }
  makeArena(){
    const concrete=mat(0x182b36),steel=mat(0x435660,.5),seat=mat(0x285665);const banners=['DGMC AI CONSULTANCY','PENALTY KINGS • OWN THE MOMENT','INTELLIGENCE. IMPACT. DGMC.'];
    const crowdCount=7000,geo=new THREE.CylinderGeometry(.11,.15,.38,5,1),crowd=new THREE.InstancedMesh(geo,mat(0xffffff),crowdCount);const heads=new THREE.InstancedMesh(new THREE.SphereGeometry(.09,5,3),mat(0xffffff),crowdCount);const d=new THREE.Object3D(),col=new THREE.Color();let n=0;
    const banks=[{x:0,z:-12,rotation:0,length:66},{x:-39,z:12,rotation:Math.PI/2,length:68},{x:39,z:12,rotation:-Math.PI/2,length:68}];
    for(const bank of banks){const group=new THREE.Group();group.position.set(bank.x,0,bank.z);group.rotation.y=bank.rotation;this.scene.add(group);
      for(let row=0;row<17;row++){box(group,concrete,bank.length,.48,1.25,0,1+row*.53,-row*1.13);box(group,seat,bank.length,.14,.4,0,1.31+row*.53,-row*1.13+.15);
        const people=Math.floor(bank.length/.55);for(let j=0;j<people&&n<crowdCount;j++){const local=new V(-bank.length/2+j*.55+Math.random()*.16,1.62+row*.53,-row*1.13);group.updateMatrixWorld();local.applyMatrix4(group.matrixWorld);d.position.copy(local);d.rotation.set(0,bank.rotation,0);d.scale.setScalar(.9+Math.random()*.25);d.updateMatrix();crowd.setMatrixAt(n,d.matrix);col.setHSL(Math.random(),.25+Math.random()*.5,.18+Math.random()*.35);crowd.setColorAt(n,col);d.position.y+=.29;d.scale.setScalar(.95);d.updateMatrix();heads.setMatrixAt(n,d.matrix);col.setHSL(.065,.3,.35+Math.random()*.35);heads.setColorAt(n,col);n++}
      }
      for(let x=-bank.length/2;x<bank.length/2;x+=11){tube(group,steel,[x,.4,1],[x,11,-19],.08);tube(group,steel,[x,10,-19],[x,10,3],.11);}
      box(group,mat(0x0a171f),bank.length+4,.22,24,0,11,-8);for(let x=-bank.length/2;x<=bank.length/2;x+=5.5)tube(group,steel,[x,11,-20],[x,12.8,-5],.065);
      for(let lx=-bank.length/2+3;lx<bank.length/2;lx+=11){box(group,new THREE.MeshBasicMaterial({color:0xe9f7ff}),1.5,.22,.05,lx,10.4,2.95);}
      const rim=box(group,new THREE.MeshBasicMaterial({color:0x85c9dd}),bank.length,.04,.06,0,10.82,3.6);
      for(let b=0;b<3;b++){const board=mesh(new THREE.PlaneGeometry(bank.length/3-.2,1),new THREE.MeshBasicMaterial({map:label(banners[b])}),group,-bank.length/3+b*bank.length/3,.7,1.2);}
    }
    crowd.count=n;heads.count=n;this.scene.add(crowd,heads);this.crowd=crowd;
    for(const x of [-28,28])for(const z of [-12,25]){tube(this.scene,steel,[x,0,z],[x,24,z],.19);for(let k=0;k<4;k++){tube(this.scene,steel,[x-.4,4+k*5,z],[x+.4,8+k*5,z],.04)}const lights=new THREE.Group();lights.position.set(x,24,z);lights.lookAt(0,0,7);this.scene.add(lights);box(lights,steel,5,2,.25,0,0,0);for(let r=0;r<2;r++)for(let c=0;c<5;c++){const lamp=box(lights,new THREE.MeshBasicMaterial({color:0xe0f4ff}),.7,.5,.06,-1.75+c*.87,-.5+r*.94,.17)}
      const glowTexture=texture((c,w,h)=>{const grad=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);grad.addColorStop(0,'rgba(203,239,255,.65)');grad.addColorStop(.16,'rgba(159,215,255,.22)');grad.addColorStop(1,'rgba(100,185,255,0)');c.fillStyle=grad;c.fillRect(0,0,w,h)},128,128);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTexture,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));sprite.position.set(x,24,z);sprite.scale.set(17,17,1);this.scene.add(sprite);
    }
    const scorePanel=mesh(new THREE.PlaneGeometry(12,4),new THREE.MeshBasicMaterial({map:label('DGMC ARENA','#d5f76b','#071920',1024,256)}),this.scene,0,9,-29);
    // Segmented perimeter LED boards, advertising and goal-side camera detail.
    for(const side of [-1,1]){tube(this.scene,steel,[side*7,0,-3],[side*7,.9,-3],.025);box(this.scene,mat(0x121a20),.35,.24,.45,side*7,1,-3);tube(this.scene,steel,[side*7,0,-3],[side*7+.4,0,-3.5],.025);}
  }
  makeBall(){const tex=texture((c,w,h)=>{c.fillStyle='#f4f1df';c.fillRect(0,0,w,h);for(let row=-1;row<5;row++)for(let col=-1;col<9;col++){const x=col*64+(row%2)*32,y=row*128;c.beginPath();for(let k=0;k<5;k++){const a=k*Math.PI*2/5-Math.PI/2;const px=x+23*Math.cos(a),py=y+23*Math.sin(a);k?c.lineTo(px,py):c.moveTo(px,py)}c.closePath();c.fillStyle='#14252d';c.fill();c.strokeStyle='#a8afa7';c.lineWidth=2;c.stroke()}for(let i=0;i<4000;i++){c.fillStyle='#ffffff32';c.fillRect(Math.random()*w,Math.random()*h,1,1)}},512,512);
    this.ball=mesh(new THREE.SphereGeometry(.115,32,24),new THREE.MeshStandardMaterial({map:tex,roughness:.53}),this.scene,0,.115,11);
    this.ballShadow=mesh(new THREE.PlaneGeometry(.4,.4),new THREE.MeshBasicMaterial({map:texture((c,w,h)=>{const g=c.createRadialGradient(w/2,h/2,0,w/2,h/2,w/2);g.addColorStop(0,'#0009');g.addColorStop(1,'#0000');c.fillStyle=g;c.fillRect(0,0,w,h)},64,64),transparent:true,depthWrite:false}),this.scene,0,.023,11);this.ballShadow.rotation.x=-Math.PI/2;
  }
  resize(){this.camera.aspect=innerWidth/innerHeight;this.camera.updateProjectionMatrix();this.renderer.setSize(innerWidth,innerHeight);this.setCamera(this.menu)}
  setCamera(menu){this.menu=menu;const portrait=innerWidth/innerHeight<.85;if(menu){this.camera.position.set(portrait?8:11,portrait?6:5.6,portrait?23:20);this.camera.lookAt(portrait?0:-1,1.25,2)}else{this.camera.position.set(0,portrait?4.6:3.1,portrait?24:17.5);this.camera.lookAt(0,1.05,1)}this.camera.updateMatrixWorld();}
  targetFromScreen(x,y){this.raycaster.setFromCamera(new THREE.Vector2(x/innerWidth*2-1,-y/innerHeight*2+1),this.camera);const hit=new V();this.raycaster.ray.intersectPlane(this.aimPlane,hit);return {x:THREE.MathUtils.clamp(hit.x,-4.5,4.5),y:THREE.MathUtils.clamp(hit.y,.08,3.3)};}
  project(target){const p=new V(target.x,target.y,0).project(this.camera);return {x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2}}
  reset(){this.ball.position.set(0,.115,11);this.keeper.root.position.set(0,0,.28);this.keeper.pose('ready');this.striker.root.position.set(.15,0,11.85);this.striker.pose('idle');this.net.geometry.attributes.position.array.set(this.netOriginal);this.net.geometry.attributes.position.needsUpdate=true;}
  celebrate(){for(let i=0;i<80;i++){const p=mesh(new THREE.PlaneGeometry(.05,.11),new THREE.MeshBasicMaterial({color:i%2?0xd5f76b:0xf8f8e8,side:THREE.DoubleSide}),this.scene,(Math.random()-.5)*8,2+Math.random()*4,3+Math.random()*6);this.particles.push({mesh:p,v:new V((Math.random()-.5)*2,Math.random()*2,Math.random()-.5),life:3})}}
  update(t,dt,shot){
    if(!shot){this.keeper.pose('ready',t);this.striker.pose('idle',t);}
    else{const elapsed=t-shot.start,wind=.6,flight=.78;
      if(elapsed<wind){this.striker.pose('kick',Math.min(1,elapsed/wind));}
      else{
        const u=Math.min(1,(elapsed-wind)/flight);this.striker.pose(shot.result.goal&&elapsed>1.6?'celebrate':'idle',elapsed);
        const end=new V(shot.target.x,shot.target.y,shot.result.goal?-1.5:shot.result.saved?1.0:-4);
        const fraction=shot.result.saved?Math.min(u,.9):u;
        this.ball.position.lerpVectors(new V(0,.115,11),end,fraction);this.ball.position.y+=Math.sin(fraction*Math.PI)*1.2;
        if(u>=1&&!shot.result.goal){const b=elapsed-wind-flight;this.ball.position.z=shot.result.saved?1+b*3:-4-b*2;this.ball.position.y=Math.max(.115,shot.target.y-b*2+Math.sin(b*5)*.2);}
        this.ball.rotation.x-=dt*20;this.ball.rotation.z+=dt*shot.target.x;
        const dive=THREE.MathUtils.clamp((elapsed-wind-shot.reaction)/.5,0,1);this.keeper.root.position.x=shot.keeper.x*dive;this.keeper.root.position.y=Math.max(0,shot.keeper.y-.95)*Math.sin(dive*Math.PI);this.keeper.pose(dive>0?'dive':'ready',dive,Math.sign(shot.keeper.x)||1);
        if(shot.result.goal&&u>=1){const pos=this.net.geometry.attributes.position;for(let i=0;i<pos.count;i++){const x=this.netOriginal[i*3],y=this.netOriginal[i*3+1],z=this.netOriginal[i*3+2];const dist=Math.hypot(x-shot.target.x,y-shot.target.y);pos.array[i*3+2]=z-Math.exp(-dist*1.8)*Math.sin((elapsed-wind-flight)*13)*.22*Math.exp(-(elapsed-wind-flight)*3);}pos.needsUpdate=true;}
      }
    }
    this.ballShadow.position.x=this.ball.position.x;this.ballShadow.position.z=this.ball.position.z;this.ballShadow.material.opacity=Math.max(.12,.65-this.ball.position.y*.13);this.ballShadow.scale.setScalar(1+this.ball.position.y*.2);
    for(let i=this.particles.length-1;i>=0;i--){const p=this.particles[i];p.life-=dt;p.v.y-=dt*2;p.mesh.position.addScaledVector(p.v,dt);p.mesh.rotation.x+=dt*3;p.mesh.rotation.z+=dt*2;if(p.life<=0){this.scene.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();this.particles.splice(i,1)}}
    this.renderer.render(this.scene,this.camera);
  }
}
