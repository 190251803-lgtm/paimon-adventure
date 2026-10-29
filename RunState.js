import { Player } from "./Player.js";
import { STARTER_DECK, PARTNER_STARTER_CARD, CARD_DEFINITIONS } from "../data/cards.js";

export class RunState {
  constructor({ partner, weather, seed }) {
    this.partner = partner;
    this.weather = weather;
    this.seed = seed;
    this.layer = 1;
    this.bossPlan = [];
    this.player = new Player(62);
    this.mora = 40;
    this.relics = [];
    // 留存资格跟随开局卡牌实例，不能由名称或牌库位置推断。
    this.deck = [...STARTER_DECK, PARTNER_STARTER_CARD[partner.id]].map((cardId) => ({ cardId, upgraded: false, starter: true }));
    this.startedAt = Date.now();
    this.stats = {
      nodesCompleted: 0,
      battlesWon: 0,
      reactions: 0,
      cardsGained: 0,
    };
  }

  get maxHealth() { return this.player.maxHealth; }
  get health() { return this.player.health; }
  get inspiration() { return this.player.inspiration; }
  get fullness() { return this.player.fullness; }

  ownsCard(cardId) { return this.deck.some((entry) => entry.cardId === cardId); }
  canGainCard(cardId) {
    const card = CARD_DEFINITIONS[cardId];
    return Boolean(card && (!card.owner || card.owner === "paimon" || card.owner === this.partner.id) && (!card.unique || !this.ownsCard(cardId)));
  }
  addCard(cardId, upgraded = false) {
    if (!this.canGainCard(cardId)) return false;
    this.deck.push({ cardId, upgraded: Boolean(upgraded), starter: false });
    this.stats.cardsGained += 1;
    return true;
  }

  get elapsedMinutes() {
    return Math.max(1, Math.ceil((Date.now() - this.startedAt) / 60000));
  }
}
