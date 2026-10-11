import {test,expect} from '@playwright/test';
test('complete playable shootout, touch gestures, restart, replay and records',async({page},testInfo)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.stack||e.message));
  await page.addInitScript(()=>{let s=74321;Math.random=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296}});
  await page.goto('/');await page.waitForFunction(()=>!!window.__dgmc);
  await page.screenshot({path:`test-results/${testInfo.project.name}-menu.png`});
  await page.getByRole('button',{name:'Rookie',exact:false}).click();await page.getByRole('button',{name:'Start Game'}).click();
  await expect(page.locator('#hud')).toBeVisible();expect(await page.evaluate(()=>window.__dgmc.phase)).toBe('aiming');
  const initial=await page.evaluate(()=>window.__dgmc);
  const point=initial.target;
  if(testInfo.project.name==='desktop')await page.mouse.click(point.x,point.y);else await page.touchscreen.tap(point.x,point.y);
  await page.waitForFunction(()=>window.__dgmc.ball[2]<10);
  expect(await page.evaluate(()=>window.__dgmc.phase)).toBe('shooting');
  await page.waitForFunction(()=>Math.abs(window.__dgmc.keeper[0])>.03);
  await page.waitForFunction(()=>window.__dgmc.player.length===1);
  await page.screenshot({path:`test-results/${testInfo.project.name}-shot.png`});
  await page.waitForFunction(()=>window.__dgmc.phase==='aiming');
  // Send browser pointer touch events with a real swipe coordinate sequence.
  const size=page.viewportSize();await page.evaluate(({w,h})=>{const c=document.querySelector('canvas');const opts={pointerId:81,pointerType:'touch',isPrimary:true,bubbles:true};c.dispatchEvent(new PointerEvent('pointerdown',{...opts,clientX:w*.5,clientY:h*.78}));for(let n=1;n<=6;n++)c.dispatchEvent(new PointerEvent('pointermove',{...opts,clientX:w*.5+n*3,clientY:h*.78-n*16}));c.dispatchEvent(new PointerEvent('pointerup',{...opts,clientX:w*.5+18,clientY:h*.78-96}));},{w:size.width,h:size.height});
  await page.waitForFunction(()=>window.__dgmc.phase==='shooting');
  await page.getByRole('button',{name:'Restart'}).click();
  expect(await page.evaluate(()=>window.__dgmc.player.length)).toBe(0);expect(await page.evaluate(()=>window.__dgmc.rival.length)).toBe(0);expect(await page.evaluate(()=>window.__dgmc.ball[2])).toBe(11);
  // Play actual human-input shots through both regulation and any sudden death.
  let attempts=0;while(!(await page.evaluate(()=>window.__dgmc.finished))){
    await page.waitForFunction(()=>window.__dgmc.phase==='aiming'||window.__dgmc.phase==='finished');
    if(await page.evaluate(()=>window.__dgmc.finished))break;
    const point=await page.evaluate(()=>window.__dgmc.target);
    if(testInfo.project.name==='desktop')await page.mouse.click(point.x,point.y);else await page.touchscreen.tap(point.x,point.y);
    attempts++;expect(attempts).toBeLessThan(25);await page.waitForFunction(()=>window.__dgmc.phase==='aiming'||window.__dgmc.phase==='finished',{},{timeout:45000});
  }
  await expect(page.locator('#results')).toBeVisible();const final=await page.evaluate(()=>window.__dgmc);expect(final.player.length).toBeGreaterThanOrEqual(5);expect(final.player.length).toBe(final.rival.length);expect(final.playerScore).not.toBe(final.rivalScore);expect(final.playerScore).toBe(final.player.filter(Boolean).length);
  await page.screenshot({path:`test-results/${testInfo.project.name}-results.png`});
  await page.getByRole('button',{name:'Play Again'}).click();expect(await page.evaluate(()=>window.__dgmc.phase)).toBe('aiming');expect(await page.evaluate(()=>window.__dgmc.playerScore)).toBe(0);
  // Working explicit Shoot button and audio controls.
  await page.getByRole('button',{name:'Shoot',exact:false}).click();await page.waitForFunction(()=>window.__dgmc.phase==='shooting');
  await page.locator('#sound').click();await expect(page.locator('#sound')).toHaveText('SOUND ON');await page.locator('#sound').click();await expect(page.locator('#sound')).toHaveText('SOUND OFF');
  expect(errors).toEqual([]);
  await page.reload();await page.waitForFunction(()=>!!window.__dgmc);await page.getByRole('button',{name:'High scores'}).click();await expect(page.locator('.record').first()).toBeVisible();await page.locator('#close-records').click();await expect(page.locator('#start')).toBeVisible();
  if(testInfo.project.name!=='desktop'){await page.setViewportSize({width:844,height:390});await page.locator('#start').click();const corner=await page.evaluate(()=>window.__dgmc.target);await page.touchscreen.tap(corner.x,corner.y);await page.waitForFunction(()=>window.__dgmc.player.length===1);await page.screenshot({path:`test-results/${testInfo.project.name}-landscape.png`});}
  expect(errors).toEqual([]);
});
