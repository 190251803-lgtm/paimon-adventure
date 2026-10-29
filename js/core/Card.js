let nextCardInstanceId = 1;

export class Card {
  constructor(definition, upgraded = false, starter = false) {
    this.definition = definition;
    this.upgraded = upgraded;
    this.starter = starter === true;
    this.instanceId = `card-${nextCardInstanceId++}`;
  }
  get id() { return this.definition.id; }
  get name() { return `${this.definition.name}${this.upgraded ? "+" : ""}`; }
  get type() { return this.definition.type; }
  get cost() { return this.definition.cost; }
  get target() { return this.definition.target; }
  get description() { return this.upgraded ? this.definition.upgradedDescription : this.definition.description; }
  get effect() { return this.upgraded ? this.definition.upgradedEffect : this.definition.effect; }
  upgrade() { this.upgraded = true; }
}
