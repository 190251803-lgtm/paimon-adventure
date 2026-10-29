export class EventEngine {
  constructor(runState, random, definitions) { this.runState = runState; this.random = random; this.event = random.pick(definitions); }
  isOptionAvailable(option) { return !option.requires?.mora || this.runState.mora >= option.requires.mora; }
  applyOption(optionId) {
    const option = this.event.options.find((item) => item.id === optionId);
    if (!option || !this.isOptionAvailable(option)) throw new Error("该事件选项当前不可用");
    const effect = option.effect;
    if (effect.mora) this.runState.mora = Math.max(0, this.runState.mora + effect.mora);
    if (effect.heal) this.runState.player.heal(effect.heal);
    if (effect.damage) this.runState.player.takeDamage(effect.damage);
    if (effect.fullness) this.runState.player.fullness = Math.min(10, this.runState.player.fullness + effect.fullness);
    if (effect.inspiration) this.runState.player.gainInspiration(effect.inspiration);
    if (effect.addCard) this.runState.addCard(effect.addCard);
    if (effect.upgradeRandom) { const candidates = this.runState.deck.filter((card) => !card.upgraded); if (candidates.length) this.random.pick(candidates).upgraded = true; }
    return option;
  }
}
