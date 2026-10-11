import {test,expect} from '@playwright/test';
test('tied regulation continues to paired sudden death and finishes correctly',async({page},testInfo)=>{
  const tap=point=>testInfo.project.name==='desktop'?page.mouse.click(point.x,point.y):page.touchscreen.tap(point.x,point.y);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await page.waitForFunction(()=>!!window.__dgmc);await page.locator('#start').click();
  // Deterministic RNG produces wide rival shots. Scores and judging are never
  // overridden: the player takes five actual wide kicks, then a real winning shot.
  await page.evaluate(()=>{Math.random=()=>.999});
  for(let i=0;i<5;i++){
    await page.waitForFunction(()=>window.__dgmc.phase==='aiming');
    const point=await page.evaluate(()=>{const s=window.__dgmc;return {x:s.goalBottomRight.x+(s.goalBottomRight.x-s.goalTopLeft.x)*.12,y:(s.goalTopLeft.y+s.goalBottomRight.y)/2}});
    await tap(point);
    await page.waitForFunction(n=>window.__dgmc.rival.length===n,i+1,{timeout:45000});
    await page.waitForFunction(()=>window.__dgmc.phase==='aiming',{},{timeout:45000});
  }
  const draw=await page.evaluate(()=>window.__dgmc);expect(draw.playerScore).toBe(0);expect(draw.rivalScore).toBe(0);expect(draw.suddenDeath).toBe(true);expect(draw.finished).toBe(false);await expect(page.locator('#round-label')).toContainText('SUDDEN DEATH');
  const corner=await page.evaluate(()=>{const s=window.__dgmc;return {x:s.goalTopLeft.x+(s.goalBottomRight.x-s.goalTopLeft.x)*.09,y:s.goalTopLeft.y+10}});
  await tap(corner);await page.waitForFunction(()=>window.__dgmc.player.length===6);expect(await page.evaluate(()=>window.__dgmc.finished)).toBe(false);
  await expect(page.locator('#results')).toBeVisible({timeout:45000});const final=await page.evaluate(()=>window.__dgmc);expect(final.playerScore).toBe(1);expect(final.rivalScore).toBe(0);expect(final.rival.length).toBe(6);expect(final.finished).toBe(true);expect(errors).toEqual([]);
});
