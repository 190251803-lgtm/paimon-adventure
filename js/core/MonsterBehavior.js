import { elementChineseLabel } from '../data/chineseText.js';
import { MONSTER_ELEMENTS } from '../data/monsterRules.js';
import { ReactionResolver } from './ReactionResolver.js';
import { increaseEnemyDamage } from '../data/combatRules.js';
import { initializeBoss, bossIncoming, bossAfterDamage, bossEffect, bossBeforeAction, bossAfterAction } from './BossBehavior.js';

export function hasMonsterSkill(enemy, name) { return enemy.definition.monster?.skills.some(s=>s.name === name); }
function monsterSkillPrefix(enemy, prefix) { return enemy.definition.monster?.skills.find(s=>s.name.startsWith(prefix)); }
export function initializeMonster(enemy) {
  if (!enemy.definition.catalogId) return;
  const elementalLife = monsterSkillPrefix(enemy,'元素沉积·');
  if (elementalLife) enemy.element = enemy.definition.permanentElement || enemy.definition.monster.element;
  enemy.monsterState = { charge: hasMonsterSkill(enemy,'战备补给') ? 2 : 0, armor: monsterSkillPrefix(enemy,'原木大盾') || monsterSkillPrefix(enemy,'寒冰大盾') ? 12 : 0,
    ward: enemy.definition.monster.skills.some(s=>s.name.endsWith('元素护罩')), stone: hasMonsterSkill(enemy,'岩石大盾') ? 3 : 0,
    infusionUses: 3, rage: 0, rageUsed: false, devour: 0, absorbed: null, fungus: 'normal', disabled: 0, empowered: false, summons: [], queue: [], fallenCount: 0 };
  if (enemy.monsterState.ward) enemy.monsterState.armor = 16;
  initializeBoss(enemy);
}
export function monsterIncoming(engine, enemy, damage, element, reaction) {
  const state = enemy.monsterState;
  if (!state) return damage;
  damage = bossIncoming(enemy,damage,element);
  if (hasMonsterSkill(enemy,'标准外甲') && !element) damage = Math.ceil(damage / 2);
  if (hasMonsterSkill(enemy,'元素汲取') && element) {
    if (state.absorbed === element) damage = Math.ceil(damage / 2);
    else if (!state.absorbed) state.absorbed = element;
  }
  if (hasMonsterSkill(enemy,'嗜魔') && element === enemy.definition.monster.element) {
    if (state.devour >= 2) damage += 4;
    state.devour = Math.min(2, state.devour + 1);
  }
  const release = monsterSkillPrefix(enemy,'厄灵解放·');
  if (state.rage && release && element === MONSTER_ELEMENTS[release.name.slice(-1)]) damage += 4;
  if (hasMonsterSkill(enemy,'状态转换')) {
    if (state.fungus === 'normal' && enemy.name.includes('有翼')) damage = Math.max(0, damage - 2);
    if (element === 'pyro') state.fungus = 'scorched';
    if (element === 'electro') state.fungus = 'active';
  }
  if (state.stone > 0 && damage > 0) { damage = Math.max(0,damage-4); state.stone -= element === 'geo' ? 2 : 1; }
  if (state.armor > 0) {
    const absorbed = Math.min(state.armor, damage); state.armor -= absorbed; damage -= absorbed;
    if (!state.armor && state.ward) { enemy.delayed = Math.max(1,enemy.delayed); state.ward = false; engine.addLog(`${enemy.name}的护罩破碎，下一次行动被打断。`); }
  }
  if (reaction && monsterSkillPrefix(enemy,'能源特征')) { state.disabled = 2; enemy.delayed = Math.max(1,enemy.delayed); state.queue = []; engine.addLog(`${enemy.name}因元素反应进入失能形态（荒芒冲击的近似实现）。`); }
  if (enemy.definition.immuneElements?.includes('cryo') || hasMonsterSkill(enemy,'浊水变化') || (state.ward && enemy.name.includes('冰'))) enemy.frozen = false;
  return damage;
}
export function monsterAfterDamage(engine, enemy) {
  bossAfterDamage(engine,enemy);
  const state = enemy.monsterState;
  if (!state || enemy.isDefeated) return;
  if (enemy.health <= enemy.maxHealth * .7) {
    if (monsterSkillPrefix(enemy,'厄灵解放·') && !state.rageUsed) { state.rageUsed = true; state.rage = 2; state.charge++; engine.addLog(`${enemy.name}厄灵苏醒，持续2次行动。`); }
    if (hasMonsterSkill(enemy,'厄灵之能') && state.chargedTurn !== engine.turn) { state.chargedTurn = engine.turn; state.charge++; }
  }
}
function monsterInfusion(enemy) {
  if (hasMonsterSkill(enemy,'流焰磨刃') || hasMonsterSkill(enemy,'惟神召符·炎')) return 'pyro';
  if (hasMonsterSkill(enemy,'流煌磨刃') || hasMonsterSkill(enemy,'惟神召符·煌')) return 'electro';
  return null;
}
export function monsterHitPlayer(engine, enemy, value, element, label, { piercing = false, applyWeakness = false } = {}) {
  let damage = increaseEnemyDamage(value);
  if (applyWeakness && enemy.weak > 0) damage = Math.floor(damage * .75);
  if (element && !piercing) {
    engine.playerAura ||= { element: null, frozen: false, delayed: 0 };
    const reaction = ReactionResolver.applyElement(engine.playerAura, element, damage);
    damage = reaction.totalDamage;
    if (reaction.name) engine.addLog(`派蒙受到${reaction.name}，本次伤害${damage}。`);
    if (engine.playerAura.frozen || reaction.delay) { engine.nextEnergyPenalty = Math.max(1,engine.nextEnergyPenalty || 0); engine.playerAura.frozen = false; }
  }
  const before = engine.player.health;
  const result = piercing ? (engine.player.health = Math.max(0, engine.player.health - damage), { absorbed: 0 }) : engine.player.takeDamage(damage);
  const healthDamage = before - engine.player.health;
  engine.addLog(`${enemy.name} · ${label}：${healthDamage}点${piercing?'穿透':elementChineseLabel(element)}伤害。`);
  return { type: 'attack', enemyId: enemy.instanceId, label, element, healthDamage, absorbed: result.absorbed, hits: 1, hit: 1 };
}
export function monsterCardPlayed(engine) {
  engine.monsterCardCount = (engine.monsterCardCount || 0) + 1;
  if (engine.monsterCardCount % 3) return;
  for (const enemy of engine.livingEnemies) {
    const skill = monsterSkillPrefix(enemy,'支援单位');
    if (skill && !enemy.monsterState.disabled) monsterHitPlayer(engine,enemy,2,skill.name.endsWith('芒')?'hydro':'cryo',skill.name);
    if (engine.player.isDefeated) { engine.status = 'defeat'; break; }
  }
}
export function* executeMonsterIntent(engine, enemy) {
  const state = enemy.monsterState;
  bossBeforeAction(engine,enemy);
  const shieldBefore = engine.player.block;
  const fallen = engine.enemies.filter(e=>e.isDefeated && e.name.includes('海乱鬼')).length;
  if (hasMonsterSkill(enemy,'绝境狂乱') && fallen > state.fallenCount) { enemy.health = Math.min(enemy.maxHealth,enemy.health+6); state.infusionUses = 3; state.fallenCount = fallen; engine.addLog(`${enemy.name}绝境狂乱：恢复6点生命与附魔。`); }
  if (hasMonsterSkill(enemy,'精妙伪装') && engine.random.next() < 1/3) { state.charge++; engine.addLog(`${enemy.name}精妙伪装成功，获得1点蓄势。`); }
  let intent = enemy.baseIntent;
  if (state.queue.length) {
    state.executedPrepared = true;
    const next = state.queue[0];
    next.remaining--;
    if (next.remaining > 0) { yield { type:'defend', enemyId:enemy.instanceId, label:`准备 · ${next.label}`, block:0 }; return; }
    state.queue.shift();
    intent = { ...intent, type:'attack', effects:[], prepared:[], block:0 };
  }
  if (intent.block) enemy.gainBlock(intent.block);
  if (intent.value > 0) {
    let value = intent.value + (intent.type === 'attack' ? 0 : enemy.attackBonus);
    let element = state.disabled ? null : intent.element;
    if (!state.disabled && !element && state.infusionUses > 0 && monsterInfusion(enemy)) { element = monsterInfusion(enemy); state.infusionUses--; }
    const release = monsterSkillPrefix(enemy,'厄灵解放·');
    if (state.rage > 0) { value += 2; if (!element && !state.disabled && release) element = MONSTER_ELEMENTS[release.name.slice(-1)]; }
    if (state.devour >= 2) value += 2;
    if (hasMonsterSkill(enemy,'浊水变化') && enemy.health <= enemy.maxHealth/2) value += 4;
    if (hasMonsterSkill(enemy,'状态转换') && state.fungus === 'normal' && enemy.name.includes('陆行')) value += 2;
    if (intent.label === '能量洪流' && state.absorbed) { element = state.absorbed; value += 2; }
    for (const ally of engine.livingEnemies) if (hasMonsterSkill(ally,'机体强化·荒') && !ally.monsterState.disabled) value += ally.monsterState.empowered ? 4 : 2;
    value += state.charge * 2; state.charge = 0;
    yield monsterHitPlayer(engine,enemy,value,element,intent.label,{ applyWeakness: true });
    if (hasMonsterSkill(enemy,'浊水变化') && enemy.health > enemy.maxHealth/2 && !engine.player.isDefeated) yield monsterHitPlayer(engine,enemy,2,null,'浊水变化',{ piercing: true });
  } else yield { type:'defend', enemyId:enemy.instanceId, label:intent.label, block:intent.block || 0 };
  for (const effect of intent.effects || []) {
    yield* bossEffect(engine,enemy,effect,monsterHitPlayer,triggerMonsterSummon);
    if (effect.type === 'summon') {
      const existing = state.summons.find(s=>s.label===effect.label);
      if (existing) existing.turns = effect.label === '侵蚀' ? Math.min(3,existing.turns+effect.turns) : effect.turns;
      else state.summons.push({ ...effect });
    }
    if (effect.type === 'armor') state.armor = Math.max(state.armor,effect.value);
    if (effect.type === 'empower') state.empowered = true;
    if (effect.type === 'restore') state.disabled = 0;
    if (effect.type === 'block') enemy.gainBlock(effect.value);
    if (effect.type === 'disrupt') engine.nextEnergyPenalty = Math.max(effect.value,engine.nextEnergyPenalty || 0);
    if (effect.type === 'heal') engine.livingEnemies.filter(e=>e!==enemy).sort((a,b)=>(b.maxHealth-b.health)-(a.maxHealth-a.health)).slice(0,2).forEach(e=>{e.health=Math.min(e.maxHealth,e.health+effect.value);});
    if (effect.type === 'chargeAll') engine.livingEnemies.filter(e=>e.monsterState).forEach(e=>e.monsterState.charge++);
    if (effect.type === 'pierce' && !engine.player.isDefeated) yield monsterHitPlayer(engine,enemy,effect.value,null,intent.label,{ piercing: true });
  }
  state.queue.push(...(intent.prepared || []).map(p=>({...p,remaining:p.wait})));
  if (hasMonsterSkill(enemy,'躲起来')) enemy.gainBlock(4);
  if (hasMonsterSkill(enemy,'残心') || state.fungus === 'active') state.charge++;
  if (state.rage > 0) state.rage--;
  if (state.disabled > 0) state.disabled--;
  bossAfterAction(engine,enemy,intent,shieldBefore);
  for (const ally of engine.livingEnemies) if (hasMonsterSkill(ally,'机体修复·芒') && !ally.monsterState.disabled) {
    const target = [...engine.livingEnemies].sort((a,b)=>(b.maxHealth-b.health)-(a.maxHealth-a.health))[0];
    target.health = Math.min(target.maxHealth,target.health+(ally.monsterState.empowered?4:2));
  }
}
function* triggerMonsterSummon(engine,enemy,summon) {
    if (summon.turns <= 0 || engine.player.isDefeated) return;
    if (enemy.definition.isBoss && summon.label==='水滴' && !enemy.monsterState.revive) {
      enemy.monsterState.revive=true;
      engine.addLog('水滴重新附属水晶核心。');
    } else if (summon.value) yield monsterHitPlayer(engine,enemy,summon.value,summon.element,summon.label,{ piercing: summon.piercing });
    if (summon.heal) { enemy.health = Math.min(enemy.maxHealth,enemy.health+summon.heal); engine.addLog(`${summon.label}治疗${enemy.name}${summon.heal}点生命。`); }
    if (summon.armor) enemy.monsterState.armor = Math.max(enemy.monsterState.armor,summon.armor);
    if (summon.aura) { enemy.element = summon.aura; engine.playerAura ||= {element:null}; engine.playerAura.element = summon.aura; }
    summon.turns--;
    if (!summon.turns && summon.healOnExpire) enemy.health=Math.min(enemy.maxHealth,enemy.health+summon.healOnExpire);
}
export function* monsterEndPhase(engine) {
  for (const enemy of engine.livingEnemies) for (const summon of enemy.monsterState?.summons || []) yield* triggerMonsterSummon(engine,enemy,summon);
}
