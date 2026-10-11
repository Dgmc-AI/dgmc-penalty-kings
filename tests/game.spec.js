import {test,expect} from '@playwright/test';
const press=async(page,selector)=>{const box=await page.locator(selector).boundingBox();expect(box).not.toBeNull();const p={x:box.x+box.width/2,y:box.y+box.height/2};if(await page.evaluate(()=>navigator.maxTouchPoints>0))await page.touchscreen.tap(p.x,p.y);else await page.mouse.click(p.x,p.y);};
const tap=(page,info,p)=>info.project.name==='desktop'?page.mouse.click(p.x,p.y):page.touchscreen.tap(p.x,p.y);
async function defend(page,info){
  await page.waitForFunction(()=>window.__dgmc.phase==='defending');
  const target=await page.evaluate(()=>window.__dgmc.shot.target);const direction=target.x>1?-1:target.x<-1?1:0;
  await press(page,`[data-dive="${direction}"]`);
  await page.waitForFunction(()=>window.__dgmc.phase==='result');
  const state=await page.evaluate(()=>window.__dgmc);expect(state.shot.isRival).toBe(true);expect(state.shot.diveDirection).toBe(direction);
}
test('complete shootout: shooting, keeper turns, audio, replay and records',async({page},info)=>{
  const errors=[],failed=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push(r.url()));
  await page.addInitScript(()=>{let s=74321;Math.random=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}});
  await page.goto('/');await page.waitForFunction(()=>!!window.__dgmc);await page.screenshot({path:`test-results/${info.project.name}-menu.png`});
  await page.locator('[data-level="rookie"]').click();await page.locator('#sound').click();await page.waitForFunction(()=>window.__dgmc.audio.loaded.length===7);
  const audio=await page.evaluate(()=>window.__dgmc.audio);expect(audio.state).toBe('running');expect(audio.ambientSources).toBeGreaterThan(0);expect(audio.error).toBeNull();
  await page.locator('#start').click();const point=await page.evaluate(()=>window.__dgmc.target);await tap(page,info,point);
  await page.waitForFunction(()=>window.__dgmc.ball[2]<10);await page.waitForFunction(()=>Math.abs(window.__dgmc.keeper[0])>.03);await page.waitForFunction(()=>window.__dgmc.player.length===1);
  await defend(page,info);await page.waitForFunction(()=>window.__dgmc.phase==='aiming');
  const size=page.viewportSize();await page.evaluate(({w,h})=>{const c=document.querySelector('canvas'),o={pointerId:81,pointerType:'touch',isPrimary:true,bubbles:true};c.dispatchEvent(new PointerEvent('pointerdown',{...o,clientX:w*.5,clientY:h*.78}));for(let n=1;n<=6;n++)c.dispatchEvent(new PointerEvent('pointermove',{...o,clientX:w*.5+n*3,clientY:h*.78-n*16}));c.dispatchEvent(new PointerEvent('pointerup',{...o,clientX:w*.5+18,clientY:h*.78-96}));},{w:size.width,h:size.height});
  expect(await page.evaluate(()=>window.__dgmc.phase)).toBe('shooting');await page.locator('#restart').click();expect(await page.evaluate(()=>window.__dgmc.player.length)).toBe(0);expect(await page.evaluate(()=>window.__dgmc.rival.length)).toBe(0);
  let attempts=0;
  while(!(await page.evaluate(()=>window.__dgmc.finished))){
    await page.waitForFunction(()=>window.__dgmc.phase==='aiming'||window.__dgmc.phase==='finished');if(await page.evaluate(()=>window.__dgmc.finished))break;
    await tap(page,info,await page.evaluate(()=>window.__dgmc.target));attempts++;expect(attempts).toBeLessThan(25);
    await page.waitForFunction(()=>window.__dgmc.phase==='defending');await defend(page,info);
    await page.waitForFunction(()=>window.__dgmc.phase==='aiming'||window.__dgmc.phase==='finished');
  }
  await expect(page.locator('#results')).toBeVisible();const final=await page.evaluate(()=>window.__dgmc);expect(final.player.length).toBeGreaterThanOrEqual(5);expect(final.player.length).toBe(final.rival.length);expect(final.playerScore).not.toBe(final.rivalScore);expect(final.playerScore).toBe(final.player.filter(Boolean).length);expect(final.rivalScore).toBe(final.rival.filter(Boolean).length);
  expect(final.audio.counts.goal).toBeGreaterThan(0);expect(final.audio.counts.save+final.audio.counts.miss).toBeGreaterThan(0);await page.screenshot({path:`test-results/${info.project.name}-results.png`});
  await page.locator('#again').click();expect(await page.evaluate(()=>window.__dgmc.phase)).toBe('aiming');expect(await page.evaluate(()=>window.__dgmc.playerScore)).toBe(0);await page.locator('#shoot').click();await page.waitForFunction(()=>window.__dgmc.phase==='shooting');
  await page.locator('#sound').click();await expect(page.locator('#sound')).toHaveText('SOUND OFF');expect(await page.evaluate(()=>window.__dgmc.audio.ambientSources)).toBe(0);
  await page.reload();await page.waitForFunction(()=>!!window.__dgmc);await page.locator('#records-button').click();await expect(page.locator('.record').first()).toBeVisible();await page.locator('#close-records').click();
  if(info.project.name!=='desktop'){await page.setViewportSize({width:844,height:390});await page.locator('#start').click();await tap(page,info,await page.evaluate(()=>window.__dgmc.target));await defend(page,info);await page.waitForFunction(()=>window.__dgmc.phase==='aiming');await page.screenshot({path:`test-results/${info.project.name}-landscape.png`});}
  expect(errors).toEqual([]);expect(failed.filter(u=>!u.includes('fonts.googleapis')&&!u.includes('fonts.gstatic'))).toEqual([]);
});

test('responsive keeper left, right and centre, saves and restart during defence',async({page},info)=>{
  await page.goto('/');await page.waitForFunction(()=>!!window.__dgmc);
  // Fix randomness, not game state: the rival really kicks to each side and the
  // player makes the corresponding save with real controls. Legend permits
  // each deterministic target to stay on goal.
  const cases=[{rng:.8,direction:-1},{rng:.2,direction:1},{rng:.5,direction:0}];
  await page.locator('[data-level="legend"]').click();await page.locator('#sound').click();await page.waitForFunction(()=>window.__dgmc.audio.loaded.length===7);await page.locator('#start').click();
  for(const {rng,direction} of cases){
    const n=await page.evaluate(()=>window.__dgmc.rival.length);await page.evaluate(value=>{Math.random=()=>value},rng);await page.locator('#shoot').click();await page.waitForFunction(()=>window.__dgmc.phase==='defending');
    if(info.project.name==='desktop'){await page.keyboard.press(direction<0?'ArrowLeft':direction>0?'ArrowRight':'ArrowDown');}
    else if(direction!==0){const size=page.viewportSize();await page.evaluate(({w,h,direction})=>{const c=document.querySelector('canvas'),o={pointerId:90,pointerType:'touch',isPrimary:true,bubbles:true};c.dispatchEvent(new PointerEvent('pointerdown',{...o,clientX:w*.5,clientY:h*.55}));c.dispatchEvent(new PointerEvent('pointermove',{...o,clientX:w*.5+direction*110,clientY:h*.55}));c.dispatchEvent(new PointerEvent('pointerup',{...o,clientX:w*.5+direction*110,clientY:h*.55}));},{w:size.width,h:size.height,direction});}
    else await press(page,'[data-dive="0"]');
    await page.waitForFunction(()=>Math.abs(window.__dgmc.keeper[0])>1.8||window.__dgmc.shot.diveDirection===0);
    await page.waitForFunction(n=>window.__dgmc.rival.length===n+1,n);const state=await page.evaluate(()=>window.__dgmc);expect(state.shot.diveDirection).toBe(direction);expect(state.shot.result.saved).toBe(true);expect(state.rival[n]).toBe(false);expect(state.audio.lastReaction).toBe('save');if(n===0)await page.screenshot({path:`test-results/${info.project.name}-keeper.png`});await page.waitForFunction(()=>window.__dgmc.phase==='aiming');
  }
  // Wrong-side choice concedes; no automatic keeper replaces user input.
  await page.evaluate(()=>{Math.random=()=>.8});await page.locator('#shoot').click();await page.waitForFunction(()=>window.__dgmc.phase==='defending');await press(page,'[data-dive="1"]');await page.waitForFunction(()=>window.__dgmc.rival.length===4);expect(await page.evaluate(()=>window.__dgmc.rival[3])).toBe(true);expect(await page.evaluate(()=>window.__dgmc.audio.lastReaction)).toBe('goal');
  await page.waitForFunction(()=>window.__dgmc.phase==='aiming');await page.locator('#shoot').click();await page.waitForFunction(()=>window.__dgmc.phase==='defending');await page.locator('#restart').click();const state=await page.evaluate(()=>window.__dgmc);expect(state.phase).toBe('aiming');expect(state.playerScore).toBe(0);expect(state.rivalScore).toBe(0);await expect(page.locator('#keeper-controls')).toBeHidden();
});
