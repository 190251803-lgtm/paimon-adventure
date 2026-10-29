export const CARD_DEFINITIONS = {
  paimon_bump: { id: "paimon_bump", name: "派蒙冲击", type: "attack", cost: 1, target: "enemy", description: "造成7点伤害。", upgradedDescription: "造成10点伤害。", effect: { damage: 7 }, upgradedEffect: { damage: 10 } },
  quick_dodge: { id: "quick_dodge", name: "急忙闪避", type: "defense", cost: 1, target: "self", description: "获得6点护盾。蓄势：本回合下一张伤害牌伤害+3。", upgradedDescription: "获得9点护盾。蓄势：本回合下一张伤害牌伤害+5。", effect: { block: 6, prepare: 3 }, upgradedEffect: { block: 9, prepare: 5 } },
  look_over_there: { id: "look_over_there", name: "看那边！", type: "idea", cost: 1, target: "enemy", description: "虚弱1回合；本回合标记：下一张伤害牌命中此敌人伤害+4。敌人准备攻击时抽1张牌。", upgradedDescription: "虚弱2回合；本回合标记：下一张伤害牌命中此敌人伤害+6。敌人准备攻击时抽1张牌。", effect: { weak: 1, mark: 4, drawIfAttacking: 1 }, upgradedEffect: { weak: 2, mark: 6, drawIfAttacking: 1 } },
  sweet_madame: { id: "sweet_madame", name: "甜甜花酿鸡", type: "food", cost: 1, target: "self", description: "恢复5点生命，饱腹+3。", upgradedDescription: "恢复8点生命，饱腹+3。", effect: { heal: 5, fullness: 3 }, upgradedEffect: { heal: 8, fullness: 3 } },
  scouting_shot: { id: "scouting_shot", name: "侦察射击", type: "attack", cost: 1, target: "enemy", description: "造成8点火元素伤害。", upgradedDescription: "造成12点火元素伤害。", effect: { damage: 8, element: "pyro" }, upgradedEffect: { damage: 12, element: "pyro" } },
  frostgnaw: { id: "frostgnaw", name: "霜袭", type: "attack", cost: 1, target: "enemy", description: "造成8点冰元素伤害。冰水冻结：敌人跳过下一次行动；物理攻击碎冰额外+2伤害并解冻。", upgradedDescription: "造成12点冰元素伤害。冰水冻结：敌人跳过下一次行动；物理攻击碎冰额外+2伤害并解冻。", effect: { damage: 8, element: "cryo" }, upgradedEffect: { damage: 12, element: "cryo" } },
  guarding_heart: { id: "guarding_heart", name: "守护之心", type: "defense", cost: 1, target: "self", description: "获得8点护盾和1点灵感。", upgradedDescription: "获得12点护盾和1点灵感。", effect: { block: 8, inspiration: 1 }, upgradedEffect: { block: 12, inspiration: 1 } },
  rose_lightning: { id: "rose_lightning", name: "蔷薇雷光", type: "attack", cost: 1, target: "all-enemies", description: "对所有敌人造成5点雷元素伤害。", upgradedDescription: "对所有敌人造成8点雷元素伤害。", effect: { damage: 5, allEnemies: true, element: "electro" }, upgradedEffect: { damage: 8, allEnemies: true, element: "electro" } },
  hydro_flask: { id: "hydro_flask", name: "水元素瓶", type: "element", cost: 1, target: "enemy", description: "造成4点水元素伤害。", upgradedDescription: "造成7点水元素伤害。", effect: { damage: 4, element: "hydro" }, upgradedEffect: { damage: 7, element: "hydro" } },
  gust_bottle: { id: "gust_bottle", name: "捕风瓶", type: "element", cost: 1, target: "enemy", description: "造成4点风元素伤害。", upgradedDescription: "造成7点风元素伤害。", effect: { damage: 4, element: "anemo" }, upgradedEffect: { damage: 7, element: "anemo" } },
  bright_idea: { id: "bright_idea", name: "派蒙的妙计", type: "idea", cost: 0, target: "self", description: "获得2点灵感，抽1张牌。", upgradedDescription: "获得3点灵感，抽1张牌。", effect: { inspiration: 2, draw: 1 }, upgradedEffect: { inspiration: 3, draw: 1 } },
  emergency_snack: { id: "emergency_snack", name: "应急点心", type: "food", cost: 1, target: "self", description: "恢复7点生命，饱腹+4。", upgradedDescription: "恢复11点生命，饱腹+4。", effect: { heal: 7, fullness: 4 }, upgradedEffect: { heal: 11, fullness: 4 } },
  flame_cracker: { id: "flame_cracker", name: "烈焰爆弹", type: "element", cost: 1, target: "enemy", description: "造成6点火元素伤害。", upgradedDescription: "造成9点火元素伤害。", effect: { damage: 6, element: "pyro" }, upgradedEffect: { damage: 9, element: "pyro" } },
  static_orb: { id: "static_orb", name: "雷光球", type: "element", cost: 1, target: "enemy", description: "造成6点雷元素伤害。", upgradedDescription: "造成9点雷元素伤害。", effect: { damage: 6, element: "electro" }, upgradedEffect: { damage: 9, element: "electro" } },
  star_followup: { id: "star_followup", name: "星辉追击", type: "attack", cost: 0, target: "enemy", description: "造成3点伤害。本回合已打出其他伤害牌时，伤害+5。", upgradedDescription: "造成5点伤害。本回合已打出其他伤害牌时，伤害+7。", effect: { damage: 3, followup: 5 }, upgradedEffect: { damage: 5, followup: 7 } },
  shield_counter: { id: "shield_counter", name: "盾光反击", type: "attack", cost: 1, target: "enemy", description: "造成4点伤害，额外造成当前护盾50%的伤害（向下取整）。", upgradedDescription: "造成7点伤害，额外造成当前护盾75%的伤害（向下取整）。", effect: { damage: 4, blockRatio: 0.5 }, upgradedEffect: { damage: 7, blockRatio: 0.75 } },
};

export const CHARACTER_NAMES = { paimon: "派蒙", amber: "安柏", lisa: "丽莎", kaeya: "凯亚" };

// 角色技能每局只收集一次；进入战斗后仍按普通卡牌洗牌、抽取和循环使用。
const characterSkills = [
  ["paimon", "star_guidance", "星光引路", "defense", 1, "self", "获得5点护盾，抽2张牌。", "获得8点护盾，抽2张牌。", { block: 5, draw: 2 }, { block: 8, draw: 2 }],
  ["paimon", "captain_cheer", "向导的鼓劲", "idea", 0, "self", "获得1点灵感，下一张伤害牌伤害+4。消耗。", "获得2点灵感，下一张伤害牌伤害+6。消耗。", { inspiration: 1, prepare: 4, exhaust: true }, { inspiration: 2, prepare: 6, exhaust: true }],
  ["paimon", "star_barrage", "群星出击", "attack", 2, "all-enemies", "对所有敌人造成10点物理伤害；已打出伤害牌时额外+4。", "对所有敌人造成13点物理伤害；已打出伤害牌时额外+6。", { damage: 10, allEnemies: true, followup: 4 }, { damage: 13, allEnemies: true, followup: 6 }],
  ["amber", "baron_bunny", "爆弹玩偶", "defense", 1, "self", "获得9点护盾，使全体敌人虚弱1回合。", "获得13点护盾，使全体敌人虚弱1回合。", { block: 9, weakAll: 1 }, { block: 13, weakAll: 1 }],
  ["amber", "fiery_rain", "箭雨", "attack", 2, "all-enemies", "对所有敌人造成13点火元素伤害。", "对所有敌人造成18点火元素伤害。", { damage: 13, allEnemies: true, element: "pyro" }, { damage: 18, allEnemies: true, element: "pyro" }],
  ["amber", "aimed_shot", "瞄准射击", "attack", 1, "enemy", "造成9点火元素伤害。目标已有元素附着时额外+4。", "造成12点火元素伤害。目标已有元素附着时额外+6。", { damage: 9, element: "pyro", auraBonus: 4 }, { damage: 12, element: "pyro", auraBonus: 6 }],
  ["lisa", "violet_arc", "苍雷", "attack", 1, "enemy", "造成8点雷元素伤害；标记目标，本回合下一击伤害+5。", "造成12点雷元素伤害；标记目标，本回合下一击伤害+7。", { damage: 8, element: "electro", mark: 5 }, { damage: 12, element: "electro", mark: 7 }],
  ["lisa", "lightning_rose", "蔷薇的雷庭", "attack", 2, "all-enemies", "全体7点雷伤；后续2回合开始各对全体追加4点雷伤。刷新持续时间。", "全体11点雷伤；后续3回合开始各对全体追加4点雷伤。刷新持续时间。", { damage: 7, allEnemies: true, element: "electro", lightningTurns: 2 }, { damage: 11, allEnemies: true, element: "electro", lightningTurns: 3 }],
  ["lisa", "conductive_field", "导电结界", "idea", 1, "self", "本场战斗每次直接命中触发元素反应时伤害+3。可与反应催化叠加。消耗。", "本场战斗每次直接命中触发元素反应时伤害+5。可与反应催化叠加。消耗。", { permanentReaction: 3, exhaust: true }, { permanentReaction: 5, exhaust: true }],
  ["kaeya", "cold_blood", "冷血之剑", "attack", 1, "enemy", "造成7点冰元素伤害，恢复3点生命。", "造成11点冰元素伤害，恢复5点生命。", { damage: 7, element: "cryo", heal: 3 }, { damage: 11, element: "cryo", heal: 5 }],
  ["kaeya", "glacial_waltz", "凛冽轮舞", "attack", 2, "all-enemies", "全体6点冰伤；后续2回合开始各追加4点冰伤。与支援共享持续时间，刷新不叠加。", "全体9点冰伤；后续3回合开始各追加4点冰伤。与支援共享持续时间，刷新不叠加。", { damage: 6, allEnemies: true, element: "cryo", icicleTurns: 2 }, { damage: 9, allEnemies: true, element: "cryo", icicleTurns: 3 }],
  ["kaeya", "frost_shield", "寒冰护体", "attack", 1, "enemy", "获得7点护盾，对目标造成5点冰元素伤害。", "获得10点护盾，对目标造成8点冰元素伤害。", { block: 7, damage: 5, element: "cryo" }, { block: 10, damage: 8, element: "cryo" }],
];
for (const [owner, id, name, type, cost, target, description, upgradedDescription, effect, upgradedEffect] of characterSkills) {
  CARD_DEFINITIONS[id] = { id, owner, unique: true, name, type, cost, target, description, upgradedDescription, effect, upgradedEffect };
}
for (const [id, owner] of [["scouting_shot", "amber"], ["rose_lightning", "lisa"], ["frostgnaw", "kaeya"]]) {
  Object.assign(CARD_DEFINITIONS[id], { owner, unique: true });
}

const strategyCards = [
  ["tactical_draw", "战术整备", "idea", 1, "self", "抽3张牌。", "抽4张牌。", { draw: 3 }, { draw: 4 }],
  ["quick_thinking", "临机应变", "idea", 0, "self", "获得1点星能。消耗。", "获得2点星能。消耗。", { energy: 1, exhaust: true }, { energy: 2, exhaust: true }],
  ["elemental_focus", "反应催化", "idea", 1, "self", "抽1张牌，本回合每次直接命中触发元素反应时伤害+4。", "抽2张牌，本回合每次直接命中触发元素反应时伤害+6。", { draw: 1, reactionBoost: 4 }, { draw: 2, reactionBoost: 6 }],
  ["shield_reserve", "固守阵线", "defense", 1, "self", "获得7点护盾。下回合开始保留剩余护盾一次，多次使用不叠加次数。", "获得11点护盾。下回合开始保留剩余护盾一次，多次使用不叠加次数。", { block: 7, retainBlock: true }, { block: 11, retainBlock: true }],
  ["chain_offense", "连携攻势", "idea", 1, "self", "抽1张牌。本回合后续伤害牌，每张获得此前打出的伤害牌数量×2的伤害加成。", "抽1张牌。本回合后续伤害牌，每张获得此前打出的伤害牌数量×3的伤害加成。", { draw: 1, chainPower: 2 }, { draw: 1, chainPower: 3 }],
  ["breaking_strike", "破阵重击", "attack", 1, "enemy", "造成6点物理伤害，目标有护盾时额外+8。", "造成9点物理伤害，目标有护盾时额外+11。", { damage: 6, shieldBonus: 8 }, { damage: 9, shieldBonus: 11 }],
  ["rain_call", "唤雨水雾", "element", 1, "all-enemies", "对全体敌人造成3点水元素伤害，适合衔接冻结、蒸发或感电。", "对全体敌人造成6点水元素伤害，适合衔接冻结、蒸发或感电。", { damage: 3, allEnemies: true, element: "hydro" }, { damage: 6, allEnemies: true, element: "hydro" }],
  ["weakness_exposure", "洞察破绽", "idea", 1, "all-enemies", "全体敌人虚弱1回合并被标记，本回合对其下一击伤害+3。", "全体敌人虚弱2回合并被标记，本回合对其下一击伤害+5。", { weakAll: 1, markAll: 3 }, { weakAll: 2, markAll: 5 }],
];
for (const [id, name, type, cost, target, description, upgradedDescription, effect, upgradedEffect] of strategyCards) {
  CARD_DEFINITIONS[id] = { id, name, type, cost, target, description, upgradedDescription, effect, upgradedEffect };
}

export const SKILL_CARD_IDS = Object.values(CARD_DEFINITIONS).filter((card) => card.unique).map((card) => card.id);
export const STRATEGY_CARD_IDS = Object.keys(CARD_DEFINITIONS).filter((id) => !CARD_DEFINITIONS[id].unique && id !== "paimon_bump" && id !== "quick_dodge" && id !== "look_over_there");

export const STARTER_DECK = ["paimon_bump", "paimon_bump", "star_followup", "quick_dodge", "quick_dodge", "quick_dodge", "look_over_there"];
export const PARTNER_STARTER_CARD = { amber: "scouting_shot", kaeya: "frostgnaw", lisa: "rose_lightning" };
