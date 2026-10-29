import { Random } from "./Random.js";
import { NORMAL_ENCOUNTERS, EMERGENCY_ENCOUNTERS } from "../data/enemies.js";
import { MAP_ROUTES } from "../data/map.js";
import { MONSTER_CATALOG } from "../data/monsterCatalog.js";
import { FINAL_BOSS_ID, RANDOM_BOSS_CANDIDATES } from '../data/bossCatalog.js';

export function createBossPlan(seed) {
  return [...new Random(seed).shuffle(RANDOM_BOSS_CANDIDATES.map(b => b.id)).slice(0, 2), FINAL_BOSS_ID];
}

export class EncounterDirector {
  constructor(seed) {
    this.seed = seed;
    this.plans = new Map();
    this.history = [];
    this.bossPlan = createBossPlan(seed);
    this.layer = 1;
  }

  preview(node) {
    const key = this.layer === 1 ? node.id : `${this.layer}:${node.id}`;
    if (!this.plans.has(key)) {
      // Use the whole node ID: similarly sized names must not share a random seed.
      let hash = (Number(this.seed) + (this.layer - 1) * 100003) | 0;
      for (const char of node.id) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
      const random = new Random(hash >>> 0);
      const entranceIndex = MAP_ROUTES.findIndex((route) => route.nodes[0].id === node.id);
      let enemyIds;
      if (node.kind === "boss") enemyIds = [this.bossPlan[this.layer - 1]];
      else if (entranceIndex >= 0) {
        enemyIds = [new Random(this.seed + this.layer * 97).shuffle(MONSTER_CATALOG.map(m=>m.id))[entranceIndex]];
      }
      else {
        let pool = node.kind === "emergency"
          ? EMERGENCY_ENCOUNTERS : NORMAL_ENCOUNTERS;
        const recent = this.history.slice(-2);
        const signature = (ids) => [...ids].sort().join("|");
        const repeatedSpecies = recent.length === 2
          ? recent[0].enemyIds.filter((id) => recent[1].enemyIds.includes(id)) : [];
        const varied = pool.filter((ids) => !recent.some((entry) => signature(entry.enemyIds) === signature(ids))
          && !ids.some((id) => repeatedSpecies.includes(id)));
        if (varied.length) pool = varied;
        enemyIds = random.pick(pool);
      }
      this.plans.set(key, { enemyIds: [...enemyIds], seed: random.seed });
    }
    const plan = this.plans.get(key);
    return { enemyIds: [...plan.enemyIds], random: new Random(plan.seed) };
  }

  enter(node) {
    const setup = this.preview(node);
    if (!this.history.some((entry) => entry.nodeId === node.id && entry.layer === this.layer)) {
      this.history.push({ nodeId: node.id, layer: this.layer, enemyIds: [...setup.enemyIds] });
    }
    return setup;
  }
}
