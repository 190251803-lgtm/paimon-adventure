export const PARTNERS = [
  {
    id: "amber",
    name: "安柏回响",
    element: "火",
    symbol: "焰",
    color: "#d9604b",
    skill: "侦察射击",
    description: "以火元素触发蒸发、融化与超载。可收集爆弹玩偶防守、箭雨群攻和利用元素附着的瞄准射击。",
    image: "./assets/characters/amber.webp",
  },
  {
    id: "lisa",
    name: "丽莎回响",
    element: "雷",
    symbol: "雷",
    color: "#8f68bd",
    skill: "蔷薇雷光",
    description: "雷元素擅长感电与群体战斗。可收集苍雷标记、蔷薇的雷庭持续攻击和导电结界反应强化。",
    image: "./assets/characters/lisa.webp",
  },
  {
    id: "kaeya",
    name: "凯亚回响",
    element: "冰",
    symbol: "冰",
    color: "#80cbe7",
    skill: "霜袭",
    description: "冰元素遇水冻结并跳过行动，遇火触发融化增伤；物理碎冰额外+2伤害。支援凛冽轮舞：全体6点冰伤，后续两回合各追加4点冰伤。可收集冷血之剑、寒冰护体和凛冽轮舞技能牌。",
    image: "./assets/characters/kaeya.webp",
  },
];

export const getPartner = (partnerId) => PARTNERS.find((partner) => partner.id === partnerId);
