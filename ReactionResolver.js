const REACTIONS = {
  "hydro+pyro": { name: "蒸发", bonus: (damage) => Math.ceil(damage * 0.5) },
  "cryo+pyro": { name: "融化", bonus: (damage) => Math.ceil(damage * 0.5) },
  "electro+hydro": { name: "感电", bonus: () => 4, splash: 3 },
  "electro+pyro": { name: "超载", bonus: () => 5 },
  "cryo+hydro": { name: "冻结", bonus: () => 0, freeze: true },
};

const normalizePair = (first, second) => [first, second].sort().join("+");

export class ReactionResolver {
  static applyElement(enemy, element, baseDamage) {
    if (!element && enemy.frozen && baseDamage > 0) {
      enemy.frozen = false;
      enemy.element = null;
      return { name: "碎冰", totalDamage: baseDamage + 2, splashDamage: 0, delay: false };
    }
    if (!element) return { name: null, totalDamage: baseDamage, splashDamage: 0, delay: false };
    if (!enemy.element || enemy.element === element) {
      enemy.element = element;
      return { name: null, totalDamage: baseDamage, splashDamage: 0, delay: false };
    }

    if (element === "anemo" || enemy.element === "anemo") {
      const spreadElement = element === "anemo" ? enemy.element : element;
      enemy.element = null;
      return { name: "扩散", totalDamage: baseDamage + 3, splashDamage: 3, spreadElement, delay: false };
    }

    const reaction = REACTIONS[normalizePair(enemy.element, element)];
    if (!reaction) {
      enemy.element = element;
      return { name: null, totalDamage: baseDamage, splashDamage: 0, delay: false };
    }
    enemy.element = null;
    if (reaction.freeze) enemy.frozen = true;
    return {
      name: reaction.name,
      totalDamage: baseDamage + reaction.bonus(baseDamage),
      splashDamage: reaction.splash ?? 0,
      delay: Boolean(reaction.delay),
    };
  }
}
