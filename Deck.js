const MAX_HAND_SIZE = 7;

export class Deck {
  constructor(cards, random) {
    this.random = random;
    this.sourceCards = cards;
    this.drawPile = [];
    this.hand = [];
    this.discardPile = [];
    this.exhaustPile = [];
  }
  reset() { this.drawPile = this.random.shuffle(this.sourceCards); this.hand = []; this.discardPile = []; this.exhaustPile = []; }
  draw(count) {
    const drawn = [];
    const drawCount = Math.max(0, Math.min(count, MAX_HAND_SIZE - this.hand.length));
    for (let index = 0; index < drawCount; index += 1) {
      if (this.drawPile.length === 0) this.reshuffleDiscard();
      if (this.drawPile.length === 0) break;
      const card = this.drawPile.pop();
      this.hand.push(card);
      drawn.push(card);
    }
    return drawn;
  }
  reshuffleDiscard() { if (this.discardPile.length) { this.drawPile = this.random.shuffle(this.discardPile); this.discardPile = []; } }
  removeFromHand(instanceId, exhaust = false) {
    const index = this.hand.findIndex((card) => card.instanceId === instanceId);
    if (index < 0) throw new Error("手牌中不存在该卡牌");
    const [card] = this.hand.splice(index, 1);
    (exhaust ? this.exhaustPile : this.discardPile).push(card);
    return card;
  }
  discardHand(shouldRetain = () => false) {
    const retained = [];
    for (const card of this.hand) {
      if (retained.length < MAX_HAND_SIZE && shouldRetain(card)) retained.push(card);
      else this.discardPile.push(card);
    }
    this.hand = retained;
    return retained.length;
  }
}
