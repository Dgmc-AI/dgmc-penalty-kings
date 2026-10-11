import './style.css';
import * as THREE from 'three';
import {Stadium} from './stadium.js';
import {Shootout,DIFFICULTIES,evaluateShot,readRecords,saveRecord} from './rules.js';
import {StadiumAudio} from './audio.js';
const $=id=>document.getElementById(id);
let stadium;
try { stadium=new Stadium($('scene')); await stadium.loadPlayers(); } catch(error) { $('loading').hidden=true;$('error').hidden=false;$('error-detail').textContent='This browser could not start 3D graphics. Enable WebGL, close other tabs, then reload.';console.error(error);throw error; }
$('loading').hidden=true;$('start').disabled=false;document.body.classList.add('menu-view');
const audio=new StadiumAudio(),match=new Shootout();
let level='pro',phase='menu',shot=null,now=0,nextAt=0,aim={x:1.8,y:1.5},pointer=null,goals=0,shotsTaken=0,resultSaved=false;
let storage;try{storage=localStorage}catch{storage={getItem(){return null},setItem(){}}}
const random=()=>Math.random();
function soundButton(){ $('sound').textContent=audio.enabled?'SOUND ON':'SOUND OFF';$('sound').setAttribute('aria-label',audio.enabled?'Mute sound':'Enable sound'); }
$('sound').onclick=async()=>{await audio.toggle();soundButton()};
document.querySelectorAll('[data-level]').forEach(button=>{button.setAttribute('aria-pressed',String(button.dataset.level===level));button.onclick=()=>{level=button.dataset.level;document.querySelectorAll('[data-level]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button))})}});
function displayMessage(kicker,text,detail=''){ $('message-kicker').textContent=kicker;$('message-text').textContent=text;$('message-detail').textContent=detail;$('shot-message').hidden=false; }
function renderScore(){
  $('player-score').textContent=match.playerScore;$('rival-score').textContent=match.rivalScore;
  for(const team of ['player','rival']){$(`${team}-dots`).innerHTML='';const arr=match[team];const visible=arr.length>5?arr.slice(-5):arr;for(let i=0;i<5;i++){const dot=document.createElement('span');dot.className='dot'+(i<visible.length?(visible[i]?' goal':' miss'):'');dot.setAttribute('aria-label',i<visible.length?(visible[i]?'Goal':'Miss'):'Pending');$(`${team}-dots`).appendChild(dot);}}
  $('round-label').textContent=match.suddenDeath?`SUDDEN DEATH ${match.player.length-4}`:`PENALTY ${Math.min(5,match.rival.length+1)} / 5`;$('difficulty-label').textContent=DIFFICULTIES[level].label.toUpperCase();
}
function updateAim(){const p=stadium.project(aim);$('aim').style.left=`${p.x}px`;$('aim').style.top=`${p.y}px`;}
function ready(){phase='aiming';shot=null;stadium.reset();stadium.striker.kit.color.setHex(0x1e7983);stadium.keeper.kit.color.setHex(0xfbc453);$('play-controls').hidden=false;$('shoot').disabled=false;$('aim').hidden=false;aim={x:1.8,y:1.5};updateAim();displayMessage(match.suddenDeath?'SUDDEN DEATH • YOUR TURN':'YOUR TURN',match.suddenDeath?'Make it count.':'Pick your corner.','Tap the goal, or swipe up to shoot.');}
function start(){match.reset();goals=0;shotsTaken=0;resultSaved=false;shot=null;pointer=null;document.body.classList.remove('menu-view');document.body.classList.add('playing');$('menu').hidden=true;$('results').hidden=true;$('records').hidden=true;$('hud').hidden=false;stadium.setCamera(false);renderScore();ready();audio.whistle();}
$('start').onclick=start;$('restart').onclick=start;$('again').onclick=start;
$('back').onclick=()=>{phase='menu';shot=null;pointer=null;stadium.reset();stadium.setCamera(true);document.body.classList.remove('playing');document.body.classList.add('menu-view');$('menu').hidden=false;for(const id of ['hud','results','aim','play-controls','shot-message'])$(id).hidden=true;};
function makeKeeper(target,isRival){const settings=DIFFICULTIES[level];let accuracy=isRival?.5:settings.accuracy;const predicts=random()<accuracy;return {x:predicts?target.x+(random()-.5)*.9:(random()-.5)*5.5,y:predicts?target.y+(random()-.5)*.7:.5+random()*1.6};}
function shoot(target,isRival=false){if(!isRival&&phase!=='aiming')return;
  const settings=DIFFICULTIES[level];const keeper=makeKeeper(target,isRival);keeper.x=THREE.MathUtils.clamp(keeper.x,-2.85,2.85);keeper.y=THREE.MathUtils.clamp(keeper.y,.3,2.1);
  const result=evaluateShot(target,keeper,isRival?1.15:settings.reach);
  shot={start:now,target:{...target},keeper,result,isRival,reaction:isRival?.23:settings.reaction,resolved:false,kicked:false};phase='shooting';pointer=null;$('aim').hidden=true;$('play-controls').hidden=true;
  displayMessage(isRival?'RIVALS FC':'DGMC • YOUR SHOT',isRival?'Rivals step up…':'Here we go.','');
}
$('shoot').onclick=()=>shoot(aim);
function opponentShot(){stadium.reset();stadium.striker.kit.color.setHex(0xe3a28b);stadium.keeper.kit.color.setHex(0x1e7983);let target={x:(random()-.5)*6.7,y:.25+random()*1.95};if(random()>DIFFICULTIES[level].opponent)target={x:(random()<.5?-1:1)*(3.7+random()*.7),y:.7+random()*2};shoot(target,true);}
function finish(){phase='finished';shot=null;$('play-controls').hidden=true;$('aim').hidden=true;$('shot-message').hidden=true;$('results').hidden=false;const win=match.winner==='player';$('result-title').textContent=win?'CROWN CLAIMED.':'SO CLOSE. GO AGAIN.';$('final-score').textContent=`${match.playerScore} — ${match.rivalScore}`;$('result-description').textContent=win?`You beat Rivals FC on ${DIFFICULTIES[level].label}. DGMC Arena is yours.`:`Rivals FC take this shootout. Pick your corners and come back stronger.`;const accuracy=shotsTaken?Math.round(goals/shotsTaken*100):0;const points=goals*100+(win?500:0)+({rookie:0,pro:100,legend:250}[level]);$('result-stats').innerHTML=`<span><strong>${accuracy}%</strong>CONVERSION</span><span><strong>${points}</strong>POINTS</span><span><strong>${shotsTaken}</strong>PENALTIES</span>`;
  if(!resultSaved){saveRecord(storage,{points,goals,level,win,date:new Date().toISOString().slice(0,10)});resultSaved=true;}audio.whistle();stadium.striker.pose(win?'celebrate':'idle',now);}
function showRecords(){const records=readRecords(storage);$('records-list').innerHTML='';if(!records.length){const p=document.createElement('p');p.textContent='Your crown awaits. Finish a shootout to set your first score.';$('records-list').appendChild(p)}records.forEach((r,i)=>{const row=document.createElement('div');row.className='record';const name=document.createElement('span');name.textContent=`${i+1}. ${r.win?'♛':'•'} ${DIFFICULTIES[r.level]?.label||'Pro'} · ${r.goals} goals`;const value=document.createElement('strong');value.textContent=`${r.points} pts`;row.append(name,value);$('records-list').appendChild(row)});$('records').hidden=false;$('menu').hidden=true;}
$('records-button').onclick=showRecords;$('close-records').onclick=()=>{$('records').hidden=true;$('menu').hidden=false};
// Pointer events cover touch, mouse and pen on Safari; only the playing canvas
// captures gestures, preserving button interaction and eliminating page scrolling.
const surface=stadium.renderer.domElement;
surface.addEventListener('pointerdown',event=>{if(phase!=='aiming'||pointer||!event.isPrimary)return;event.preventDefault();pointer={id:event.pointerId,x:event.clientX,y:event.clientY,time:performance.now()};try{surface.setPointerCapture(event.pointerId)}catch{/* Capture is optional for cancelled or synthetic pointers. */}});
surface.addEventListener('pointermove',event=>{if(phase!=='aiming')return;if(pointer&&event.pointerId===pointer.id){const dx=event.clientX-pointer.x,dy=pointer.y-event.clientY;if(Math.hypot(dx,dy)>15){aim={x:THREE.MathUtils.clamp(dx/innerWidth*15,-4.4,4.4),y:THREE.MathUtils.clamp(.25+dy/innerHeight*10,.15,3.2)};updateAim();}}else if(event.pointerType==='mouse'){aim=stadium.targetFromScreen(event.clientX,event.clientY);updateAim();}});
surface.addEventListener('pointerup',event=>{if(!pointer||pointer.id!==event.pointerId||phase!=='aiming')return;const p=pointer;pointer=null;const dx=event.clientX-p.x,dy=p.y-event.clientY;const distance=Math.hypot(dx,dy);if(distance>20){if(dy<12){displayMessage('SWIPE UP TO SHOOT','Aim for the goal.','Swipe upwards, or tap your chosen corner.');return;}aim={x:THREE.MathUtils.clamp(dx/innerWidth*15,-4.4,4.4),y:THREE.MathUtils.clamp(.25+dy/innerHeight*10,.15,3.2)};}else aim=stadium.targetFromScreen(event.clientX,event.clientY);shoot(aim);});
for(const type of ['pointercancel','lostpointercapture'])surface.addEventListener(type,()=>{pointer=null});
window.addEventListener('resize',updateAim);
window.addEventListener('keydown',event=>{if(phase!=='aiming'||['BUTTON','INPUT'].includes(document.activeElement.tagName))return;const step=.22;if(event.key==='ArrowLeft')aim.x-=step;else if(event.key==='ArrowRight')aim.x+=step;else if(event.key==='ArrowUp')aim.y+=step;else if(event.key==='ArrowDown')aim.y-=step;else if(event.code==='Space'||event.key==='Enter'){event.preventDefault();shoot(aim);return;}else return;event.preventDefault();aim.x=THREE.MathUtils.clamp(aim.x,-4.4,4.4);aim.y=THREE.MathUtils.clamp(aim.y,.15,3.2);updateAim()});
let last=performance.now()/1000;
document.addEventListener('visibilitychange',()=>{last=performance.now()/1000});
function tick(){requestAnimationFrame(tick);const time=performance.now()/1000;const elapsed=document.hidden?0:Math.max(0,time-last);const dt=Math.min(.05,elapsed);last=time;now+=elapsed;
  if(shot){const elapsed=now-shot.start;if(elapsed>=.6&&!shot.kicked){shot.kicked=true;audio.kick();}if(elapsed>=1.4&&!shot.resolved){shot.resolved=true;match.record(shot.result.goal);if(!shot.isRival){shotsTaken++;if(shot.result.goal)goals++;}renderScore();audio.result(shot.result.goal);const text=shot.result.goal?'GOOOAL!':shot.result.saved?'SAVED.':'JUST WIDE.';displayMessage(shot.isRival?'RIVALS FC':'DGMC',text,shot.isRival?'Your keeper reacts automatically.':shot.result.goal?'A moment fit for a king.':shot.result.saved?'Try a different corner.':'Keep your aim inside the posts.');if(shot.result.goal)stadium.celebrate();nextAt=now+1.25;phase='result';}if(phase==='result'&&now>=nextAt){if(match.finished)finish();else if(match.turn==='rival')opponentShot();else ready();}}
  stadium.update(now,dt,shot);if(phase==='finished'&&match.winner==='player')stadium.striker.pose('celebrate',now);
}
tick();
// Read-only diagnostics support real-browser checks without overriding gameplay.
Object.defineProperty(window,'__dgmc',{get:()=>({phase,level,player:[...match.player],rival:[...match.rival],playerScore:match.playerScore,rivalScore:match.rivalScore,finished:match.finished,suddenDeath:match.suddenDeath,ball:stadium.ball.position.toArray(),keeper:stadium.keeper.root.position.toArray(),shot:shot?{target:shot.target,result:shot.result}:null,goalTopLeft:stadium.project({x:-3.45,y:2.2}),goalBottomRight:stadium.project({x:3.45,y:.25}),target:stadium.project({x:2.9,y:2.0}),drawCalls:stadium.renderer.info.render.calls,triangles:stadium.renderer.info.render.triangles})});
