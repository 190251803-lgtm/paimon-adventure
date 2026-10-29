const bossHas = (enemy,name) => enemy.definition.isBoss && enemy.definition.monster.skills.some(s=>s.mode==='七圣召唤' && s.name===name);

export function initializeBoss(enemy) {
  if (!enemy.definition.isBoss) return;
  const state=enemy.monsterState;
  Object.assign(state,{bossTurns:0,energy:0,stacks:0,extraHealth:0,devoured:[],batch:[],virtualHand:[1,2,3,1,2],virtualDraw:0,discarded:0,absorbedElements:[],proliferations:0});
  state.revive=enemy.definition.monster.skills.some(s=>s.mode==='七圣召唤' && /^(水晶核心|冰晶核心|雷晶核心|[水雷火]之新生)$/.test(s.name));
  if (bossHas(enemy,'斑斓的绚影') || bossHas(enemy,'明珠甲胄') || bossHas(enemy,'魔化：岩盔')) state.armor=6;
  if (bossHas(enemy,'帝王甲胄')) state.armor=10;
  if (bossHas(enemy,'亡骸饥渴')) state.energy=2;
  if (bossHas(enemy,'不朽亡骸·风')) state.energy=6;
}

export function bossIncoming(enemy,damage,element) {
  if (!enemy.definition.isBoss) return damage;
  const state=enemy.monsterState;
  if (bossHas(enemy,'磐岩百相') && ['pyro','hydro','cryo','electro'].includes(element)) {
    state.absorbed=element;
    if (!state.absorbedElements.includes(element)) state.absorbedElements.push(element);
  }
  if (bossHas(enemy,'活化激能') && element) state.stacks=Math.min(3,state.stacks+1);
  const phantom=state.summons.find(s=>s.label==='黑色幻影' && s.turns>0);
  if (phantom && damage>0) {damage=Math.max(0,damage-2);phantom.turns=Math.max(0,phantom.turns-2);}
  return damage;
}

export function bossAfterDamage(engine,enemy) {
  if (!enemy.definition.isBoss || !enemy.isDefeated || !enemy.monsterState.revive) return;
  const state=enemy.monsterState;
  state.revive=false;state.revived=true;
  enemy.health=enemy.definition.monster.skills.some(s=>/之新生$/.test(s.name))?8:2;
  const droplet=state.summons.find(s=>s.label==='水滴' && s.turns>0);
  if (droplet) {droplet.turns--;state.revive=true;}
  engine.addLog(`${enemy.name}核心／新生触发，恢复${enemy.health}点生命。`);
}

export function bossIntent(enemy,intent) {
  if (!enemy.definition.isBoss) return intent;
  const state=enemy.monsterState;
  const rule={...intent};
  if (rule.label==='横生厄蔓' && !state.energy) rule.prepared=[];
  if (rule.type==='attack') {
    if (state.revived && bossHas(enemy,'水之新生') && !rule.element) rule.element='hydro';
    if (state.revived && enemy.definition.monster.skills.some(s=>s.type==='被动技能' && /之新生$/.test(s.name)) && rule.element===enemy.definition.monster.element) rule.value+=2;
    if (bossHas(enemy,'魔化：岩盔') && state.armor>0) {rule.element ||= 'geo';rule.value+=2;}
    if (rule.label==='迸落星雨') rule.value+=Math.min(6,Math.floor(state.extraHealth/6)*2);
    if (rule.label==='尾羽豪放') rule.value+=state.stacks*2;
    if (rule.label==='山崩毁阵') rule.value+=state.absorbedElements.length*2;
    if (rule.label==='磅礴之气' && state.absorbed) rule.element=state.absorbed;
    if (rule.label==='烈焰燃绽' && state.armor>=14) rule.value+=2;
    if (rule.label==='炽烈轰破') rule.value+=Math.floor(state.armor/4)*2;
    if (rule.label==='错落风涡') rule.value*=2**Math.min(2,Math.floor(state.energy/2));
    if (rule.label==='潮涌与激流') rule.value+=state.summons.filter(s=>s.turns>0).length*2;
    if (bossHas(enemy,'忿恨') || bossHas(enemy,'攻阵气势')) rule.value+=state.stacks*2;
    if (rule.label==='狂迸骇雷' && (enemy.bossPlayer?.inspiration ?? state.playerInspiration ?? 0)<=1) rule.value+=4;
    if (state.expose) rule.value+=state.expose;
  }
  return rule;
}

function devour(engine,enemy,highest=false) {
  const state=enemy.monsterState;
  const costs=[1,2,1,3,2,0,2,1,3];
  const index=highest?state.virtualHand.indexOf(Math.max(...state.virtualHand)):0;
  const [cost]=state.virtualHand.splice(index,1);
  state.virtualHand.push(costs[state.virtualDraw++%costs.length]);
  state.devoured.push(cost); state.batch.push(cost);
  if (state.batch.length===3) {
    const unique=new Set(state.batch).size;
    const gain=(unique===1?3:unique===2?2:1)*2;
    state.extraHealth+=gain;enemy.maxHealth+=gain;enemy.health+=gain;state.batch=[];
    engine.addLog(`无尽食欲吞噬3张虚拟手牌，吞星之鲸最大生命提高${gain}。`);
  }
}

export function* bossEffect(engine,enemy,effect,hit,triggerSummon) {
  if (!enemy.definition.isBoss) return;
  const state=enemy.monsterState;
  if (effect.type==='bossArmor') state.armor+=effect.value;
  if (effect.type==='bossDraw') {if(bossHas(enemy,'不朽亡骸·风')) state.energy++; else state.charge++;}
  if (effect.type==='bossDrain' && engine.playerAura?.element==='electro') {engine.player.inspiration=Math.max(0,engine.player.inspiration-1);state.charge++;}
  if (effect.type==='bossExpose') state.expose=effect.value;
  if (effect.type==='bossDevour') devour(engine,enemy,true);
  if (effect.type==='bossPhantom') {
    const highest=Math.max(1,...state.devoured);
    const count=Math.max(1,state.devoured.filter(c=>c===highest).length);
    state.summons=state.summons.filter(s=>s.label!=='黑色幻影');
    state.summons.push({label:'黑色幻影',value:highest*2,element:'electro',turns:count});
  }
  if (effect.type==='bossFood') {
    if (engine.random.next()<.5) enemy.attackBonus+=2;
    else {enemy.maxHealth+=2;enemy.health+=2;}
    enemy.health=Math.min(enemy.maxHealth,enemy.health+2);
  }
  if (effect.type==='bossDiscard') {
    state.discarded+=effect.value;
    if (effect.value===3) state.stacks++;
    if (state.discarded>=6) {state.stacks++;state.discarded-=6;}
    // Both sides discard their deck top on the burst; preserve player cards in the discard pile.
    if (effect.value===3) for(let i=0;i<3;i++) {
      const card=engine.deck.drawPile.pop();if(card) engine.deck.discardPile.push(card);
    }
  }
  if (effect.type==='bossEnergy') {
    if (effect.value) state.energy+=effect.value;
    else {
      const limit=bossHas(enemy,'亡骸饥渴')?1:bossHas(enemy,'不朽亡骸·风')?state.energy:3;
      const spent=Math.min(limit,state.energy); state.energy-=spent;
      if (bossHas(enemy,'圣骸感应')) {enemy.maxHealth+=spent*2;enemy.health=Math.min(enemy.maxHealth,enemy.health+spent*4);}
      if (bossHas(enemy,'不朽亡骸·雷') && spent) state.summons.push({label:'雷锥陷阱',value:2,element:'electro',turns:spent});
    }
  }
  if (effect.type==='bossProliferate') {
    state.proliferations++;
    state.summons.push({label:'增殖生命体',value:2,element:'dendro',turns:1});
    if (state.proliferations===4) {enemy.attackBonus+=2;enemy.gainBlock(2);}
  }
  if (effect.type==='bossMimic') {
    const variants=[{label:'纯水幻形·花鼠',value:4,turns:2},{label:'纯水幻形·飞鸢',value:2,turns:3},{label:'纯水幻形·蛙',value:4,turns:1}];
    for(let i=0;i<effect.value;i++) {
      const available=variants.filter(v=>!state.summons.some(s=>s.turns>0&&s.label===v.label));
      const summon=engine.random.pick(available.length?available:variants);
      state.summons.push({...summon,element:'hydro'});
      if(summon.label.endsWith('蛙')) enemy.gainBlock(2);
    }
  }
  if (effect.type==='bossTriggerSummons') for(const summon of (effect.random?engine.random.shuffle(state.summons.filter(s=>s.turns>0)).slice(0,1):state.summons.filter(s=>s.turns>0))) {
    if(engine.player.isDefeated) break;
    yield* triggerSummon(engine,enemy,summon);
  }
  if (effect.type==='bossSplit' && enemy.health>2) {
    enemy.health-=2;
    if(!state.summons.some(s=>s.turns>0)) state.summons.push({label:'半幻人',value:2,element:'hydro',turns:2,healOnExpire:4});
  }
}

export function bossBeforeAction(engine,enemy) {
  if (!enemy.definition.isBoss) return;
  enemy.monsterState.playerInspiration=engine.player.inspiration;
}
export function bossAfterAction(engine,enemy,intent,shieldBefore) {
  if (!enemy.definition.isBoss) return;
  const state=enemy.monsterState;state.bossTurns++;
  if (bossHas(enemy,'无尽食欲')) devour(engine,enemy);
  if (bossHas(enemy,'古老者的血脉') && state.bossTurns%2===0) {
    state.summons.push({label:'金焰形态',value:2,element:'pyro',turns:1},{label:'金焰形态·穿透',value:2,piercing:true,turns:1});
  }
  if (bossHas(enemy,'不朽亡骸·雷')) state.energy+=2;
  if (bossHas(enemy,'前驱气势') && shieldBefore>0 && !engine.player.block) state.charge++;
  if (bossHas(enemy,'攻阵气势') && shieldBefore>0) state.stacks=Math.min(3,state.stacks+1);
  if (bossHas(enemy,'活化激能')) {
    if (intent.label==='尾羽豪放') state.stacks=0;
    else if(intent.element) state.stacks=Math.min(3,state.stacks+1);
    if(state.stacks===3) state.stacks=0;
  }
  if(intent.label==='炽烈轰破') state.armor=0;
}
