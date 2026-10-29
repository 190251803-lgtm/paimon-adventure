import { initializeMonster } from './MonsterBehavior.js';
import { bossIntent } from './BossBehavior.js';
import { increaseEnemyDamage, enemyMaxHealth } from '../data/combatRules.js';

let nextEnemyInstanceId = 1;

export class Enemy {
  constructor(definition, modifiers = {}) {
    this.definition = definition;
    this.instanceId = `enemy-${nextEnemyInstanceId++}`;
    this.name = definition.name;
    this.maxHealth = enemyMaxHealth(definition.maxHealth, modifiers.healthMultiplier ?? 1);
    this.health = this.maxHealth;
    this.block = modifiers.startingBlock ?? 0;
    this.attackBonus = modifiers.attackBonus ?? 0;
    this.weak = 0;
    this.mark = 0;
    this.element = null;
    this.delayed = 0;
    this.frozen = false;
    this.intentIndex = 0;
    initializeMonster(this);
  }
  get element() { return this._element; }
  set element(value) { this._element = this.definition.permanentElement ?? value; }
  get intent() {
    const intent = this.baseIntent;
    return intent.type === 'attack' ? { ...intent, value: increaseEnemyDamage(intent.value) } : intent;
  }
  // 技能结算读取基础意图，统一在命中入口加伤，避免预览和结算重复叠加。
  get baseIntent() {
    if (this.monsterState?.queue.length) {
      const next = this.monsterState.queue[0];
      return bossIntent(this,{ ...next, type: next.remaining > 1 ? 'defend' : 'attack', value: next.remaining > 1 ? 0 : next.value, label: next.remaining > 1 ? `准备 · ${next.label}` : next.label });
    }
    const intent = this.definition.intents[this.intentIndex % this.definition.intents.length];
    return bossIntent(this,intent.type === "attack" ? { ...intent, value: intent.value + this.attackBonus } : intent);
  }
  advanceIntent() { if (this.monsterState?.executedPrepared) { this.monsterState.executedPrepared = false; return; } this.intentIndex = (this.intentIndex + 1) % this.definition.intents.length; }
  gainBlock(value) { this.block += Math.max(0, value); }
  takeDamage(value) { const incoming = Math.max(0, Math.floor(value)); const absorbed = Math.min(this.block, incoming); this.block -= absorbed; const healthDamage = incoming - absorbed; this.health = Math.max(0, this.health - healthDamage); return { absorbed, healthDamage }; }
  get isDefeated() { return this.health <= 0; }
}
