import { RewardGenerator } from "./RewardGenerator.js";

export class ShopEngine {
  constructor(runState, random) {
    this.run = runState;
    this.rewards = new RewardGenerator(random);
    this.items = this.rewards.cardChoices(4, runState).map((card) => ({
      id: `card_${card.id}`, kind: "card", cardId: card.id, name: card.name, cost: card.cost,
      description: `${card.description} ${card.unique ? "角色技能 · 本局仅收集一次。" : "策略牌。"}购买后加入本局牌库。`, price: random.integer(card.unique ? 28 : 22, card.unique ? 38 : 32), sold: false,
    }));
    const [relic] = this.rewards.relicChoices(1, [...runState.relics, "treasure_compass"]);
    if (relic) this.items.push({
      id: `relic_${relic.id}`, kind: "relic", relicId: relic.id, name: relic.name,
      description: relic.description, price: random.integer(55, 70), sold: false,
    });
    this.items.push(
      { id: "healing_meal", kind: "heal", name: "甜甜花酿鸡便当", description: "立即恢复18点生命，不增加饱腹。", price: 20, value: 18, sold: false },
      { id: "inspiration_tea", kind: "inspiration", name: "灵感花茶", description: "立即获得2点灵感，上限6点。", price: 16, value: 2, sold: false },
    );
  }

  unavailableReason(item) {
    if (!item) return "商品不存在";
    if (item.sold) return "已售罄";
    if (item.kind === "card" && !this.run.canGainCard(item.cardId)) return "已拥有该技能";
    if (item.kind === "heal" && this.run.health >= this.run.maxHealth) return "生命已满";
    if (item.kind === "inspiration" && this.run.inspiration >= 6) return "灵感已满";
    if (item.kind === "relic" && this.run.relics.includes(item.relicId)) return "已拥有";
    if (this.run.mora < item.price) return "摩拉不足";
    return "";
  }

  buy(itemId) {
    const item = this.items.find((entry) => entry.id === itemId);
    if (this.unavailableReason(item)) return false;
    this.run.mora -= item.price;
    item.sold = true;
    if (item.kind === "card") {
      this.run.addCard(item.cardId);
    } else if (item.kind === "relic") this.rewards.applyRelic(this.run, item.relicId);
    else if (item.kind === "heal") this.run.player.heal(item.value);
    else if (item.kind === "inspiration") this.run.player.gainInspiration(item.value);
    return true;
  }
}
