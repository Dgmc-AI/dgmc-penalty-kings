import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import {skinWeights} from '../src/player-model.js';
// Test the shipped asset, including its real UV seams and bent fingers.
const glb=fs.readFileSync(new URL('../public/models/footballer.glb',import.meta.url));
const length=glb.readUInt32LE(12),doc=JSON.parse(glb.subarray(20,20+length)),binary=glb.subarray(28+length);
function accessor(id){const a=doc.accessors[id],v=doc.bufferViews[a.bufferView],size={SCALAR:1,VEC3:3}[a.type],bytes=a.componentType===5126||a.componentType===5125?4:2,read=a.componentType===5126?'readFloatLE':a.componentType===5125?'readUInt32LE':'readUInt16LE';const data=[];for(let i=0;i<a.count;i++)for(let k=0;k<size;k++)data.push(binary[read]((v.byteOffset||0)+(a.byteOffset||0)+i*(v.byteStride||size*bytes)+k*bytes));return data;}
function geometry(primitive){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(accessor(primitive.attributes.POSITION),3));g.setIndex(accessor(primitive.indices));g.scale(1.1597435474395752,1.1597435474395752,1.1597435474395752);g.translate(0,.02748807705938816,0);return g;}
const bodyNode=doc.nodes.find(n=>n.name==='Micah | anatomical body');
test('real fingertips stay entirely on the arm chain, never the thighs',()=>{
  const g=geometry(doc.meshes[bodyNode.mesh].primitives[0]);skinWeights(g,'body');const p=g.attributes.position,indices=g.attributes.skinIndex,weights=g.attributes.skinWeight;let fingers=0;
  for(let i=0;i<p.count;i++){const x=Math.abs(p.getX(i)),y=p.getY(i);if(x>.21&&x<.35&&y>.77&&y<.94){let armWeight=0;for(let k=0;k<4;k++)if(indices.array[i*4+k]>=7)armWeight+=weights.array[i*4+k];assert.ok(armWeight>.98,`finger ${i} at ${x},${y} has arm weight ${armWeight}`);fingers++;}}
  assert.ok(fingers>30);
});
test('shirt hem stays on the torso and pelvis when arms move',()=>{
  const primitive=doc.meshes.flatMap(m=>m.primitives).find(p=>doc.materials[p.material].name==='Micah | top');const g=geometry(primitive);skinWeights(g,'shirt');let hem=0;
  for(let i=0;i<g.attributes.position.count;i++){if(g.attributes.position.getY(i)<1.16){for(let k=0;k<4;k++)if(g.attributes.skinWeight.array[i*4+k]>.0001)assert.ok(g.attributes.skinIndex.array[i*4+k]<=1);hem++;}}
  assert.ok(hem>30);
});
