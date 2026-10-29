import { CATALOG_ENEMY_DEFINITIONS } from './monsterRules.js';
import { BOSS_ENEMY_DEFINITIONS } from './bossRules.js';

export const ENEMY_DEFINITIONS = {
  ...CATALOG_ENEMY_DEFINITIONS,
  ...BOSS_ENEMY_DEFINITIONS,

};

export const NORMAL_ENCOUNTERS = Object.keys(CATALOG_ENEMY_DEFINITIONS).map(id=>[id]);

export const EMERGENCY_ENCOUNTERS = NORMAL_ENCOUNTERS.flatMap(([id], i)=>[1, 7, 19].map(offset=>[id,NORMAL_ENCOUNTERS[(i+offset)%NORMAL_ENCOUNTERS.length][0]]));
export const EMERGENCY_RULES = { healthMultiplier: 1.3, attackBonus: 2, startingBlock: 4, moraRange: [35, 55], cardChoices: 3, duplicateRelicMora: 30 };
