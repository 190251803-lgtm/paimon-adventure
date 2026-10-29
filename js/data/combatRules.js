// 统一作用于敌方每段非零伤害，包含技能、准备技、召唤物和穿透伤害。
export const ENEMY_HEALTH_MULTIPLIER = 2;

export function enemyMaxHealth(baseHealth, encounterMultiplier = 1) {
  return Math.ceil(baseHealth * encounterMultiplier) * ENEMY_HEALTH_MULTIPLIER;
}

export function increaseEnemyDamage(value) {
  return value > 0 ? Math.ceil(value / 2) : value;
}
