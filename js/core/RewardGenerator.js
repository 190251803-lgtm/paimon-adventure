import { CARD_DEFINITIONS, SKILL_CARD_IDS, STRATEGY_CARD_IDS } from "../data/cards.js";
import { RELIC_DEFINITIONS } from "../data/relics.js";
import { EMERGENCY_RULES } from "../data/enemies.js";

export class RewardGenerator {
  constructor(random) { this.random = random; }
  moraReward(isEmergency = false) {
    const [min, max] = isEmergency ? EMERGENCY_RULES.moraRange : [10, 20];
    return this.random.integer(min, max);
  }
  cardChoices(count = 3, runState = null) {
    const eligible = (id) => !runState || runState.canGainCard(id);
    const skills = this.random.shuffle(SKILL_CARD_IDS.filter(eligible));
    const strategies = this.random.shuffle(STRATEGY_CARD_IDS.filter(eligible));
    // 有未收集技能时保证一个技能位，其余位置留给随机策略牌。
    const ids = skills.length && count > 0 ? [skills[0], ...strategies].slice(0, count) : strategies.slice(0, count);
    return this.random.shuffle(ids).map((id) => CARD_DEFINITIONS[id]);
  }
  relicChoices(count = 2, excludedIds = []) { return this.random.shuffle(Object.values(RELIC_DEFINITIONS).filter((relic) => !excludedIds.includes(relic.id))).slice(0, count); }
  startingRelicChoices() {
    return this.relicChoices(3, ["warm_lunchbox"]).map((relic) => relic.id === "adventure_badge"
      ? { ...relic, description: "生命上限提高8点，当前生命同步增加8点。" } : relic);
  }
  applyRelic(runState, relicId) {
    if (runState.relics.includes(relicId)) return;
    runState.relics.push(relicId);
    if (relicId === "adventure_badge") { runState.player.maxHealth += 8; runState.player.heal(8); }
    if (relicId === "treasure_compass") runState.mora += 40;
  }
}
