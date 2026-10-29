import { elementChineseLabel, localizeGameText } from '../data/chineseText.js';
import { Card } from "./Card.js";
import { Deck } from "./Deck.js";
import { Enemy } from "./Enemy.js";
import { CARD_DEFINITIONS } from "../data/cards.js";
import { ENEMY_DEFINITIONS, EMERGENCY_RULES } from "../data/enemies.js";
import { ReactionResolver } from "./ReactionResolver.js";
import { executeMonsterIntent, monsterIncoming, monsterAfterDamage, monsterEndPhase, monsterCardPlayed } from './MonsterBehavior.js';

export class CombatEngine {
  constructor({ runState, random, enemyIds, isBoss = false, isEmergency = false, enemyDefinitions = ENEMY_DEFINITIONS }) {
    this.runState = runState;
    this.random = random;
    this.player = runState.player;
    this.isEmergency = isEmergency;
    this.enemies = enemyIds.map((enemyId) => {
      if(!enemyDefinitions[enemyId]) throw new Error(`未知怪物：${enemyId}`);
      return new Enemy(enemyDefinitions[enemyId], isEmergency ? EMERGENCY_RULES : {});
    });
    this.enemies.filter(enemy=>enemy.definition.isBoss).forEach(enemy=>{enemy.bossPlayer=this.player;});
    this.deck = new Deck(runState.deck.map((entry) => new Card(CARD_DEFINITIONS[entry.cardId], entry.upgraded, entry.starter === true)), random);
    this.isBoss = isBoss;
    this.turn = 0;
    this.status = "active";
    this.phase = "awaiting-start";
    this.log = [];
    this.damageEvents = [];
    this.attacksPlayed = 0;
    this.preparedDamage = 0;
    this.icicleTurns = 0;
    this.lightningTurns = 0;
    this.reactionBoost = 0;
    this.permanentReaction = 0;
    this.chainPower = 0;
    this.retainBlock = false;
    if (runState.relics.includes("wind_feather")) this.player.gainInspiration(1);
    if (runState.weather.id === "rain") this.enemies.forEach((enemy) => { enemy.element = "hydro"; });
    this.deck.reset();
    this.startPlayerTurn();
  }
  startPlayerTurn() {
    if (this.status !== "active" || this.phase !== "awaiting-start") return;
    this.phase = "player";
    this.turn += 1;
    const retainedBlock = this.retainBlock ? this.player.block : 0;
    this.player.startTurn();
    if (this.nextEnergyPenalty) { this.player.energy = Math.max(0,this.player.energy-this.nextEnergyPenalty); this.addLog(`控制效果：本回合少${this.nextEnergyPenalty}点星能。`); this.nextEnergyPenalty = 0; }
    this.player.gainBlock(retainedBlock);
    this.retainBlock = false;
    this.attacksPlayed = 0;
    this.preparedDamage = 0;
    this.reactionBoost = 0;
    this.chainPower = 0;
    this.enemies.forEach((enemy) => { enemy.mark = 0; });
    if (this.icicleTurns > 0) {
      this.icicleTurns -= 1;
      this.addLog("凛冽轮舞的冰棱再次旋转，对所有敌人造成4点冰元素伤害。");
      this.livingEnemies.forEach((enemy) => this.applyElementalDamage(enemy, 4, "cryo", "凛冽轮舞·冰棱"));
      this.checkBattleEnd();
      if (this.status !== "active") return;
    }
    if (this.lightningTurns > 0) {
      this.lightningTurns -= 1;
      this.addLog("蔷薇的雷庭持续放电，对所有敌人造成4点雷元素伤害。");
      this.livingEnemies.forEach((enemy) => this.applyElementalDamage(enemy, 4, "electro", "蔷薇的雷庭"));
      this.checkBattleEnd();
      if (this.status !== "active") return;
    }
    const overfull = this.player.fullness >= 10;
    // Deck.draw 按剩余手牌空位限制数量，并沿用弃牌堆重洗规则。
    this.deck.draw(5);
    if (overfull) { this.player.fullness = Math.max(0, this.player.fullness - 4); this.addLog("派蒙的饱腹值减少4点。"); }
    this.addLog(`第${this.turn}回合开始，派蒙获得3点星能。`);
  }
  get livingEnemies() { return this.enemies.filter((enemy) => !enemy.isDefeated); }
  getCard(instanceId) { return this.deck.hand.find((card) => card.instanceId === instanceId); }
  getCardCombo(card, target = null) {
    if (!card.effect.damage) return { bonus: 0, labels: [] };
    const labels = [];
    let bonus = this.preparedDamage;
    if (this.preparedDamage) labels.push(`蓄势 +${this.preparedDamage}`);
    if (card.effect.followup && this.attacksPlayed > 0) {
      bonus += card.effect.followup;
      labels.push(`追击 +${card.effect.followup}`);
    }
    const blockBonus = Math.floor(this.player.block * (card.effect.blockRatio ?? 0));
    if (blockBonus) { bonus += blockBonus; labels.push(`盾击 +${blockBonus}`); }
    if (target?.mark) { bonus += target.mark; labels.push(`标记 +${target.mark}`); }
    const chainBonus = this.chainPower * this.attacksPlayed;
    if (chainBonus) { bonus += chainBonus; labels.push(`连携 +${chainBonus}`); }
    if (target?.element && card.effect.auraBonus) { bonus += card.effect.auraBonus; labels.push(`附着瞄准 +${card.effect.auraBonus}`); }
    if (target?.block > 0 && card.effect.shieldBonus) { bonus += card.effect.shieldBonus; labels.push(`破阵 +${card.effect.shieldBonus}`); }
    return { bonus, labels };
  }
  playCard(instanceId, targetId = null) {
    if (this.status !== "active") throw new Error("战斗已经结束");
    if (this.phase !== "player") throw new Error("请等待我方回合");
    const card = this.getCard(instanceId);
    if (!card) throw new Error("没有找到所选卡牌");
    if (card.cost > this.player.energy) throw new Error("星能不足");
    const target = targetId ? this.livingEnemies.find((enemy) => enemy.instanceId === targetId) : null;
    if (card.target === "enemy" && !target) throw new Error("请选择一个敌人");
    this.player.energy -= card.cost;
    const effect = card.effect;
    if (effect.energy) { this.player.energy += effect.energy; this.addLog(`获得${effect.energy}点星能，仅本回合有效。`); }
    if (effect.retainBlock) { this.retainBlock = true; this.addLog("固守阵线：下回合开始保留剩余护盾一次。"); }
    if (effect.reactionBoost) { this.reactionBoost += effect.reactionBoost; this.addLog(`本回合反应伤害加成提高至${this.reactionBoost}。`); }
    if (effect.permanentReaction) { this.permanentReaction += effect.permanentReaction; this.addLog(`本场战斗反应伤害加成提高至${this.permanentReaction}。`); }
    if (effect.chainPower) { this.chainPower += effect.chainPower; this.addLog(`连携攻势：本回合每张已打出的伤害牌提供${this.chainPower}点加成。`); }
    if (effect.block) { this.player.gainBlock(effect.block); this.addLog(`派蒙使用${card.name}，获得${effect.block}点护盾。`); }
    if (effect.heal) { const bonus = card.type === "food" && this.runState.relics.includes("warm_lunchbox") ? 2 : 0; const healed = this.player.heal(effect.heal + bonus); this.addLog(`派蒙使用${card.name}，恢复${healed}点生命。`); }
    if (effect.inspiration) { this.player.gainInspiration(effect.inspiration); this.addLog(`派蒙获得${effect.inspiration}点灵感。`); }
    if (effect.fullness) { this.player.fullness = Math.min(10, this.player.fullness + effect.fullness); this.addLog(`派蒙的饱腹值增加${effect.fullness}点。`); }
    if (effect.draw) this.deck.draw(effect.draw);
    if (effect.damage) {
      const targets = effect.allEnemies ? this.livingEnemies : [target];
      targets.forEach((enemy) => {
        if (enemy.isDefeated) return;
        const combo = this.getCardCombo(card, enemy);
        if (combo.labels.length) this.addLog(`${card.name}联动：${combo.labels.join("、")}。`);
        enemy.mark = 0;
        this.applyElementalDamage(enemy, effect.damage + combo.bonus, effect.element, card.name);
      });
      this.preparedDamage = 0;
      this.attacksPlayed += 1;
    }
    if (effect.prepare) { this.preparedDamage += effect.prepare; this.addLog(`蓄势积累：本回合下一张伤害牌伤害+${this.preparedDamage}。`); }
    if (effect.mark && target) { target.mark += effect.mark; this.addLog(`${target.name}被标记，本回合下一张伤害牌命中时伤害+${target.mark}。`); }
    if (effect.weak && target) { target.weak += effect.weak; this.addLog(`${target.name}陷入虚弱${effect.weak}回合。`); }
    if (effect.weakAll) { this.livingEnemies.forEach((enemy) => { enemy.weak += effect.weakAll; }); this.addLog(`全体敌人虚弱${effect.weakAll}回合。`); }
    if (effect.markAll) { this.livingEnemies.forEach((enemy) => { enemy.mark += effect.markAll; }); this.addLog(`全体敌人被标记，下一击伤害+${effect.markAll}。`); }
    if (effect.icicleTurns) { this.icicleTurns = effect.icicleTurns; this.addLog(`凛冽轮舞：后续${this.icicleTurns}回合开始追加冰伤。`); }
    if (effect.lightningTurns) { this.lightningTurns = effect.lightningTurns; this.addLog(`蔷薇的雷庭：后续${this.lightningTurns}回合开始追加雷伤。`); }
    if (effect.drawIfAttacking && target?.intent.type === "attack") { this.deck.draw(effect.drawIfAttacking); this.addLog("派蒙识破攻击意图，额外抽取1张牌。"); }
    this.deck.removeFromHand(instanceId, Boolean(effect.exhaust));
    monsterCardPlayed(this);
    this.checkBattleEnd();
    return card;
  }
  endPlayerTurn() {
    for (const action of this.enemyTurnSteps()) { /* 同步模式供模拟和核心测试使用。 */ }
  }
  *enemyTurnSteps(expectedTurn = this.turn) {
    // 参数在生成器创建时记录回合，防止动画中重入或过期事件再次结算。
    if (this.status !== "active" || this.phase !== "player" || expectedTurn !== this.turn) return;
    this.phase = "enemy";
    const retainedCount = this.deck.discardHand((card) => card.starter);
    if (retainedCount) this.addLog(`派蒙保留了${retainedCount}张初始手牌，下回合最多抽5张，手牌上限7张。`);
    // 敌方护盾保护整个我方回合，到下一次敌方行动开始才到期。
    this.enemies.forEach((enemy) => { enemy.block = 0; });
    for (const enemy of this.livingEnemies) { yield* this.enemyIntentSteps(enemy); if (this.player.isDefeated) break; }
    if (!this.player.isDefeated) yield* monsterEndPhase(this);
    if (this.player.isDefeated) { this.status = "defeat"; this.addLog("派蒙失去了继续冒险的力量。"); return; }
    this.livingEnemies.forEach((enemy) => enemy.advanceIntent());
    this.phase = "awaiting-start";
    this.startPlayerTurn();
  }
  executeEnemyIntent(enemy) {
    for (const action of this.enemyIntentSteps(enemy)) { /* 与动画模式共用同一套结算。 */ }
  }
  *enemyIntentSteps(enemy) {
    if (enemy.frozen) {
      enemy.frozen = false;
      enemy.delayed = Math.max(0, enemy.delayed - 1);
      this.addLog(`${enemy.name}被冻结，本回合无法行动，随后解冻。`);
      yield { type: "frozen", enemyId: enemy.instanceId, label: "冻结 · 跳过行动" };
      return;
    }
    if (enemy.delayed > 0) {
      enemy.delayed -= 1;
      this.addLog(`${enemy.name}受到干扰，本回合行动被打断。`);
      yield { type: "interrupted", enemyId: enemy.instanceId, label: "行动打断" };
      return;
    }
    const intent = enemy.intent;
    if (enemy.monsterState) { yield* executeMonsterIntent(this,enemy); if (enemy.weak > 0) enemy.weak--; return; }
    if (intent.type === "defend") {
      enemy.gainBlock(intent.value);
      this.addLog(`${enemy.name}获得${intent.value}点护盾。`);
      yield { type: "defend", enemyId: enemy.instanceId, label: intent.label, block: intent.value };
    }
    else if (intent.type === "attack") {
      const hits = intent.hits ?? 1;
      for (let hit = 0; hit < hits; hit += 1) {
        const adjusted = enemy.weak > 0 ? Math.floor(intent.value * 0.75) : intent.value;
        const previousHealth = this.player.health;
        const result = this.player.takeDamage(adjusted);
        const healthDamage = previousHealth - this.player.health;
        this.addLog(`${enemy.name}发动${intent.label}，造成${healthDamage}点生命伤害。`);
        yield { type: "attack", enemyId: enemy.instanceId, label: intent.label, healthDamage, absorbed: result.absorbed, hit: hit + 1, hits };
        if (this.player.isDefeated) break;
      }
    }
    if (enemy.weak > 0) enemy.weak -= 1;
  }
  checkBattleEnd() { if (this.livingEnemies.length === 0) { this.status = "victory"; this.deck.discardHand(); this.addLog("战斗胜利。"); } }
  applyElementalDamage(enemy, damage, element, sourceName) {
    if (enemy.definition.immuneElements?.includes(element)) {
      this.damageEnemy(enemy, 0);
      this.addLog(`${enemy.name}免疫${elementChineseLabel(element)}元素伤害，${sourceName}未造成伤害。`);
      return;
    }
    const reaction = ReactionResolver.applyElement(enemy, element, damage);
    const relicBonus = reaction.name && this.runState.relics.includes("reaction_prism") ? 2 : 0;
    const strategyBonus = reaction.name ? this.reactionBoost + this.permanentReaction : 0;
    const result = this.damageEnemy(enemy, reaction.totalDamage + relicBonus + strategyBonus, reaction.name, element);
    if (strategyBonus) this.addLog(`反应强化：${reaction.name}伤害+${strategyBonus}。`);
    this.addLog(`${sourceName}对${enemy.name}造成${result.healthDamage}点生命伤害${result.absorbed ? `，护盾吸收${result.absorbed}点伤害` : ""}。`);
    if (reaction.name) {
      this.player.gainInspiration(1);
      this.runState.stats.reactions += 1;
      this.addLog(`触发${reaction.name}，派蒙获得1点灵感！`);
    }
    if (reaction.delay) enemy.delayed += 1;
    if (reaction.splashDamage) {
      this.livingEnemies.filter((other) => other !== enemy).forEach((other) => {
        if (reaction.spreadElement && other.definition.immuneElements?.includes(reaction.spreadElement)) return;
        this.damageEnemy(other, reaction.splashDamage, reaction.name, reaction.spreadElement || element);
        if (reaction.spreadElement) other.element = reaction.spreadElement;
      });
    }
  }
  damageEnemy(enemy, damage, reaction = null, element = null) {
    const previousHealth = enemy.health;
    const result = enemy.takeDamage(monsterIncoming(this,enemy,damage,element,reaction));
    const healthDamage = previousHealth - enemy.health;
    if (healthDamage > 0) monsterAfterDamage(this,enemy);
    this.damageEvents.push({ enemyId: enemy.instanceId, healthDamage, absorbed: result.absorbed, reaction, defeated: enemy.isDefeated });
    return { absorbed: result.absorbed, healthDamage };
  }
  redrawHand() {
    if (this.status !== "active" || this.phase !== "player") throw new Error("请等待我方回合");
    if (!this.player.spendInspiration(2)) throw new Error("灵感不足");
    const count = this.deck.hand.length;
    this.deck.discardHand();
    this.deck.draw(count);
    this.addLog("派蒙重新整理了手牌。");
  }
  usePartnerSupport() {
    if (this.status !== "active") throw new Error("战斗已经结束");
    if (this.phase !== "player") throw new Error("请等待我方回合");
    if (!this.player.spendInspiration(6)) throw new Error("灵感不足");
    const partnerId = this.runState.partner.id;
    if (partnerId === "kaeya") {
      this.icicleTurns = 2;
      this.addLog("凯亚回响发动凛冽轮舞：全体6点冰伤，后续两回合开始各追加4点冰伤。");
      this.livingEnemies.forEach((enemy) => this.applyElementalDamage(enemy, 6, "cryo", "凛冽轮舞"));
    } else if (partnerId === "lisa") {
      this.livingEnemies.forEach((enemy) => this.applyElementalDamage(enemy, 8, "electro", "蔷薇雷光"));
    } else {
      const target = this.livingEnemies[0];
      if (target) this.applyElementalDamage(target, 14, "pyro", "侦察射击" );
    }
    this.checkBattleEnd();
  }
  addLog(message) { this.log.unshift(localizeGameText(message).trim()); this.log = this.log.slice(0, 10); }
}
