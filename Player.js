export class Player {
  constructor(maxHealth = 62) { this.maxHealth = maxHealth; this.health = maxHealth; this.block = 0; this.energy = 3; this.maxEnergy = 3; this.inspiration = 0; this.fullness = 0; }
  startTurn() { this.block = 0; this.energy = this.maxEnergy; }
  gainInspiration(value) { this.inspiration = Math.min(6, this.inspiration + Math.max(0, value)); }
  spendInspiration(value) { if (this.inspiration < value) return false; this.inspiration -= value; return true; }
  gainBlock(value) { this.block += Math.max(0, value); }
  heal(value) { const before = this.health; this.health = Math.min(this.maxHealth, this.health + Math.max(0, value)); return this.health - before; }
  takeDamage(value) { const incoming = Math.max(0, Math.floor(value)); const absorbed = Math.min(this.block, incoming); this.block -= absorbed; const healthDamage = incoming - absorbed; this.health = Math.max(0, this.health - healthDamage); return { absorbed, healthDamage }; }
  get isDefeated() { return this.health <= 0; }
}
