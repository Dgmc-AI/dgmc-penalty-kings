export const DIFFICULTIES = {
  rookie: {label:'Rookie', reaction:0.32, accuracy:0.38, reach:1.05, opponent:0.6},
  pro: {label:'Pro', reaction:0.21, accuracy:0.61, reach:1.3, opponent:0.73},
  legend: {label:'Legend', reaction:0.12, accuracy:0.82, reach:1.55, opponent:0.85},
};
export class Shootout {
  constructor(){this.reset()}
  reset(){this.player=[];this.rival=[];this.turn='player';this.finished=false;this.winner=null;}
  get suddenDeath(){return this.player.length>=5 && this.rival.length>=5 && !this.finished}
  get playerScore(){return this.player.filter(Boolean).length}
  get rivalScore(){return this.rival.filter(Boolean).length}
  record(goal){
    if(this.finished)throw Error('Match already finished');
    this[this.turn].push(Boolean(goal));
    if(this.turn==='player'){this.turn='rival';return;}
    this.turn='player';
    if(this.rival.length>=5 && this.playerScore!==this.rivalScore){this.finished=true;this.winner=this.playerScore>this.rivalScore?'player':'rival';}
  }
}
export function evaluateShot(target, keeper, reach) {
  const onTarget=Math.abs(target.x)<3.55 && target.y>0.12 && target.y<2.33;
  const saved=onTarget && Math.hypot(target.x-keeper.x,(target.y-keeper.y)*0.86)<reach;
  return {goal:onTarget&&!saved,saved,onTarget};
}
export function readRecords(storage){try{const v=JSON.parse(storage.getItem('dgmc-kings-records')||'[]');return Array.isArray(v)?v.filter(r=>r&&Number.isFinite(r.points)&&Number.isFinite(r.goals)&&typeof r.level==='string').slice(0,5):[]}catch{return []}}
export function saveRecord(storage,record){const records=[...readRecords(storage),record].sort((a,b)=>b.points-a.points).slice(0,5);try{storage.setItem('dgmc-kings-records',JSON.stringify(records))}catch{}return records;}
