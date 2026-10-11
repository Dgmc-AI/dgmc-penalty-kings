// Real stereo stadium recordings, CC0 by Philipp Feit / itmightgetloud.
// See ASSET_CREDITS.md. Only kick and referee whistle are original synthesis.
const FILES=['ambience','goal-1','goal-2','save-1','save-2','miss-1','miss-2'];
export class StadiumAudio {
  constructor(){this.enabled=false;this.ctx=null;this.buffers={};this.ambient=[];this.reactions=[];this.lastReaction=null;this.counts={goal:0,save:0,miss:0};this.error=null;this.variation={goal:0,save:0,miss:0};
    document.addEventListener('visibilitychange',()=>{if(!this.ctx)return;if(document.hidden){this.stopAmbience();this.reactions.forEach(s=>{try{s.stop()}catch{}});this.reactions=[];}else if(this.enabled){this.ctx.resume().then(()=>this.startAmbience())}});
  }
  async toggle(){
    this.enabled=!this.enabled;
    if(!this.ctx){this.ctx=new (window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.master.gain.value=0;this.master.connect(this.ctx.destination);
      this.ambienceGain=this.ctx.createGain();this.ambienceGain.gain.value=.25;this.ambienceGain.connect(this.master);
      this.loading=Promise.all(FILES.map(async name=>{const response=await fetch(`/audio/${name}.mp3`);if(!response.ok)throw new Error(`Audio ${name}: HTTP ${response.status}`);this.buffers[name]=await this.ctx.decodeAudioData(await response.arrayBuffer());}));
    }
    // Resume directly inside the gesture, before network/decode awaits (Safari).
    await this.ctx.resume();
    try{await this.loading;this.error=null;}catch(error){this.error=error.message;this.enabled=false;console.warn('Stadium audio could not load:',error.message);}
    this.master.gain.setTargetAtTime(this.enabled?.8:0,this.ctx.currentTime,.08);
    if(this.enabled&&!document.hidden)this.startAmbience();else this.stopAmbience();
  }
  startAmbience(){
    if(this.timer||!this.buffers.ambience||!this.enabled)return;
    this.nextAmbient=this.ctx.currentTime+.04;this.scheduleAmbient();
    this.timer=setInterval(()=>{if(this.ctx.currentTime+5>=this.nextAmbient)this.scheduleAmbient()},1000);
  }
  scheduleAmbient(){
    const src=this.ctx.createBufferSource(),gain=this.ctx.createGain(),buffer=this.buffers.ambience,start=this.nextAmbient,duration=buffer.duration,overlap=4;
    src.buffer=buffer;src.connect(gain);gain.connect(this.ambienceGain);
    gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(1,start+overlap);gain.gain.setValueAtTime(1,start+duration-overlap);gain.gain.linearRampToValueAtTime(0,start+duration);
    src.start(start);this.nextAmbient=start+duration-overlap;this.ambient.push(src);
    src.onended=()=>{src.disconnect();gain.disconnect();this.ambient=this.ambient.filter(s=>s!==src)};
  }
  stopAmbience(){clearInterval(this.timer);this.timer=null;for(const src of this.ambient){try{src.stop()}catch{}}this.ambient=[];}
  tone(from,to,length=.12,type='sine',volume=.2,delay=0){if(!this.enabled||!this.ctx)return;const t=this.ctx.currentTime+delay,o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=type;o.frequency.setValueAtTime(from,t);o.frequency.exponentialRampToValueAtTime(to,t+length);g.gain.setValueAtTime(volume,t);g.gain.exponentialRampToValueAtTime(.001,t+length);o.connect(g);g.connect(this.master);o.start(t);o.stop(t+length);o.onended=()=>{o.disconnect();g.disconnect()};}
  kick(){this.tone(110,35,.13,'triangle',.42)}
  whistle(){this.tone(2400,2800,.14,'sine',.12);this.tone(2800,2400,.19,'sine',.1,.19)}
  result(kind){if(!this.enabled||!this.buffers[`${kind}-1`])return;this.lastReaction=kind;this.counts[kind]++;const variant=(this.variation[kind]++%2)+1,src=this.ctx.createBufferSource(),gain=this.ctx.createGain();src.buffer=this.buffers[`${kind}-${variant}`];src.connect(gain);gain.gain.value=kind==='goal'?.85:.72;gain.connect(this.master);src.start();this.reactions.push(src);src.onended=()=>{src.disconnect();gain.disconnect();this.reactions=this.reactions.filter(s=>s!==src)};
    this.ambienceGain.gain.cancelScheduledValues(this.ctx.currentTime);this.ambienceGain.gain.setTargetAtTime(.12,this.ctx.currentTime,.15);this.ambienceGain.gain.setTargetAtTime(.25,this.ctx.currentTime+2,.8);
  }
  get diagnostics(){return {enabled:this.enabled,state:this.ctx?.state||'uninitialized',loaded:Object.keys(this.buffers),ambientSources:this.ambient.length,lastReaction:this.lastReaction,counts:{...this.counts},error:this.error};}
}
