import { Random } from "./Random.js";
import { RunState } from "./RunState.js";
import { MapEngine } from "./MapEngine.js";
import { WEATHER_OPTIONS } from "../data/map.js";
import { getPartner } from "../data/partners.js";
import { CombatEngine } from "./CombatEngine.js";
import { EMERGENCY_RULES, ENEMY_DEFINITIONS } from "../data/enemies.js";
import { EncounterDirector } from "./EncounterDirector.js";
import { EVENT_DEFINITIONS } from "../data/events.js";
import { EventEngine } from "./EventEngine.js";
import { RewardGenerator } from "./RewardGenerator.js";
import { ShopEngine } from "./ShopEngine.js";
import { increaseEnemyDamage, enemyMaxHealth } from "../data/combatRules.js";

export class Game {
  constructor(ui) {
    this.ui = ui;
    this.screen = "home";
    this.run = null;
    this.map = null;
    this.encounter = null;
    this.combat = null;
    this.selectedCardId = null;
    this.random = null;
    this.eventEngine = null;
    this.rewardGenerator = null;
    this.pendingReward = null;
    this.shop = null;
    this.resultOutcome = null;
    this.enemyTurnInProgress = false;
    this.enemyDefinitions = ENEMY_DEFINITIONS;
    this.monsterPreview = null;
  }

  showHome() {
    this.screen = "home";
    this.render();
  }

  get battleInfoRestricted() {
    return Boolean(this.run) || this.screen === 'combat' || (this.screen === 'monsters' && this.libraryReturn === 'combat');
  }

  get canStartMonsterTrial() {
    return !this.run && !this.trialSnapshot && !this.battleInfoRestricted;
  }

  get currentMonsterIds() {
    const sourceScreen = this.screen === 'monsters' ? this.libraryReturn : this.screen;
    if (sourceScreen === 'combat') {
      return [...new Set((this.combat?.enemies ?? []).map(enemy => enemy.definition.catalogId).filter(Boolean))];
    }
    const preview = this.monsterPreview;
    if (sourceScreen !== 'map' || preview?.map !== this.map || !this.map.canMoveTo(preview.nodeId)) return [];
    const node = this.map.getNode(preview.nodeId);
    if (!["battle", "emergency", "boss"].includes(node?.kind)) return [];
    return [...new Set(this.getCombatSetup(node).enemyIds.map(id => this.enemyDefinitions[id]?.catalogId).filter(Boolean))];
  }

  previewMonsterNode(nodeId) {
    const preview = this.previewNextNode(nodeId);
    this.monsterPreview = preview?.enemies.length ? { map: this.map, nodeId } : null;
    return preview;
  }

  openMonsterLibrary(id = null) {
    if (this.trialSnapshot) this.endMonsterTrial(false);
    if (this.screen !== 'monsters') this.libraryReturn = this.screen;
    this.screen = 'monsters'; this.monsterId = id; this.render();
  }

  closeMonsterLibrary(updateHistory = true) {
    if (this.trialSnapshot) this.endMonsterTrial(false);
    if (updateHistory) history.pushState(null,'',location.pathname+location.search);
    this.screen = this.libraryReturn || 'home'; this.monsterId=null; this.render();
    if (this.screen === 'map' && this.currentMonsterIds.length) this.ui.showNodePreview?.(this, this.monsterPreview.nodeId);
  }

  startMonsterTrial(id) {
    if (!this.canStartMonsterTrial || !ENEMY_DEFINITIONS[id]?.catalogId) return;
    this.trialSnapshot = { run:this.run, combat:this.combat, random:this.random, encounter:this.encounter, selectedCardId:this.selectedCardId, enemyTurnInProgress:this.enemyTurnInProgress };
    this.monsterId=id;
    this.random=new Random(235);
    this.run=new RunState({partner:getPartner('amber'),weather:WEATHER_OPTIONS[0],seed:235});
    this.run.player.inspiration=6;
    this.combat=new CombatEngine({runState:this.run,random:this.random,enemyIds:[id]});
    this.encounter={kind:'battle',name:'怪物试战'};
    this.selectedCardId=null; this.enemyTurnInProgress=false; this.screen='combat'; this.render();
  }

  endMonsterTrial(render = true) {
    if (!this.trialSnapshot) return;
    this.ui.cancelEnemyAction?.();
    const saved=this.trialSnapshot; this.trialSnapshot=null; Object.assign(this,saved);
    this.screen='monsters'; if (render) this.render();
  }

  showPartnerSelection() {
    this.screen = "partner";
    this.render();
  }

  startNewRun(partnerId, seed = Date.now()) {
    const partner = getPartner(partnerId);
    if (!partner) throw new Error("请选择有效的伙伴回响");
    this.enemyTurnInProgress = false;
    const random = new Random(seed);
    this.random = random;
    const weather = random.pick(WEATHER_OPTIONS);
    this.run = new RunState({ partner, weather, seed });
    this.map = new MapEngine(random);
    this.encounterDirector = new EncounterDirector(seed);
    this.run.bossPlan = [...this.encounterDirector.bossPlan];
    this.map.getNode('boss').name = ENEMY_DEFINITIONS[this.run.bossPlan[0]].name;
    this.encounter = null;
    this.combat = null;
    this.monsterPreview = null;
    this.selectedCardId = null;
    this.eventEngine = null;
    this.rewardGenerator = new RewardGenerator(random);
    this.pendingReward = { type: "relic", starting: true, choices: this.rewardGenerator.startingRelicChoices(), title: "起始宝藏 · 启程的馈赠" };
    this.shop = null;
    this.resultOutcome = null;
    this.screen = "reward";
    this.render();
  }

  selectNode(nodeId) {
    if (this.screen !== "map") return;
    const node = this.map.moveTo(nodeId);
    this.monsterPreview = null;
    this.encounter = node;
    if (["battle", "emergency", "boss"].includes(node.kind)) {
      this.startCombat(node);
      return;
    }
    if (node.kind === "event") {
      this.eventEngine = new EventEngine(this.run, this.random, EVENT_DEFINITIONS);
      this.screen = "event";
    } else if (node.kind === "treasure") {
      this.pendingReward = { type: "relic", choices: this.rewardGenerator.relicChoices(2), title: "发现珍贵宝箱" };
      this.screen = "reward";
    } else if (node.kind === "anchor") {
      this.screen = "anchor";
    } else if (node.kind === "shop") {
      this.shop = new ShopEngine(this.run, this.random);
      this.screen = "shop";
    } else {
      this.screen = "encounter-placeholder";
    }
    this.render();
  }

  getCombatSetup(node) {
    return this.encounterDirector.preview(node);
  }

  previewNextNodes() {
    if (this.screen !== "map") return [];
    return this.map.getReachableNodeIds().map((id) => this.previewNextNode(id));
  }

  previewNextNode(nodeId = this.map?.getReachableNodeIds()[0]) {
    if (this.screen !== "map") return null;
    if (!this.map.canMoveTo(nodeId)) return null;
    const node = this.map.getNode(nodeId);
    if (!node) return null;
    let details;
    let enemies = [];
    let event = null;
    if (["battle", "emergency", "boss"].includes(node.kind)) {
      enemies = this.getCombatSetup(node).enemyIds.map((id) => {
        const enemy = this.enemyDefinitions[id];
        const health = enemyMaxHealth(enemy.maxHealth, node.kind === "emergency" ? EMERGENCY_RULES.healthMultiplier : 1);
        const intent = enemy.intents[0];
        return { id, name: enemy.name, image: enemy.image, health,
          block: node.kind === "emergency" ? EMERGENCY_RULES.startingBlock : 0,
          intent: { ...intent, value: intent.type === "attack" ? increaseEnemyDamage(intent.value + (node.kind === "emergency" ? EMERGENCY_RULES.attackBonus : 0)) : intent.value },
          element: enemy.permanentElement ?? (this.run.weather.id === "rain" ? "hydro" : null), permanentElement: enemy.permanentElement ?? null };
      });
      details = `敌人：${enemies.map((enemy) => `${enemy.name}（${enemy.health}生命）`).join("、")}。`;
      if (node.kind === "emergency") details += `每段攻击 +${EMERGENCY_RULES.attackBonus}，开场护盾 ${EMERGENCY_RULES.startingBlock}。`;
      else if (node.kind === "boss") details += this.run.layer === 3 ? "击败最终首领即可完成冒险。" : `击败首领后进入第${this.run.layer + 1}层。`;
    } else if (node.kind === "event") {
      event = new Random(this.random.seed).pick(EVENT_DEFINITIONS);
      details = `${event.title}：${event.text}`;
    } else if (node.kind === "anchor") details = "可选择恢复18点生命，或升级一张卡牌。";
    else if (node.kind === "shop") details = "行商在此歇脚，可以使用摩拉购买卡牌、秘宝和补给。进店后查看本次商品与价格，也可以直接离开。";
    else details = "到达后可以调查这个地点。";
    return { node, details, enemies, event };
  }

  startCombat(node) {
    if (this.pendingReward?.starting) return;
    this.monsterPreview = null;
    this.encounter = node;
    const { random, enemyIds } = this.encounterDirector.enter(node);
    this.combat = new CombatEngine({ runState: this.run, random, enemyIds, isBoss: node.kind === "boss", isEmergency: node.kind === "emergency", enemyDefinitions:this.enemyDefinitions });
    this.selectedCardId = null;
    this.screen = "combat";
    this.render();
  }

  selectCard(cardId) {
    if (this.enemyTurnInProgress) return;
    if (this.screen !== "combat" || this.combat?.status !== "active") return;
    const card = this.combat.getCard(cardId);
    if (!card || card.cost > this.run.player.energy) return;
    if (card.target === "enemy") this.selectedCardId = this.selectedCardId === cardId ? null : cardId;
    else { this.combat.playCard(cardId); this.selectedCardId = null; }
    this.render();
    if (card.target === "self" && card.effect.block) this.ui.showShieldGain?.(card.effect.block);
  }

  selectEnemy(enemyId) {
    if (this.enemyTurnInProgress) return;
    if (!this.selectedCardId) return;
    this.combat.playCard(this.selectedCardId, enemyId);
    this.selectedCardId = null;
    this.render();
  }

  playCardOnEnemy(cardId, enemyId) {
    if (this.enemyTurnInProgress) return false;
    if (this.screen !== "combat" || this.combat?.status !== "active") return false;
    const card = this.combat.getCard(cardId);
    const target = this.combat.livingEnemies.find((enemy) => enemy.instanceId === enemyId);
    if (!card || !target || !["enemy", "all-enemies"].includes(card.target) || card.cost > this.run.player.energy) return false;
    this.combat.playCard(cardId, enemyId);
    this.selectedCardId = null;
    this.render();
    return true;
  }

  playCardOnAlly(cardId, allyId) {
    if (this.enemyTurnInProgress || this.screen !== "combat" || this.combat?.status !== "active") return false;
    const card = this.combat.getCard(cardId);
    if (!["paimon", "partner"].includes(allyId) || !card || card.target !== "self" || card.cost > this.run.player.energy) return false;
    this.selectCard(cardId);
    return true;
  }

  async endTurn() {
    if (this.enemyTurnInProgress || this.screen !== "combat" || this.combat.status !== "active") return;
    const combat = this.combat;
    this.selectedCardId = null;
    this.enemyTurnInProgress = true;
    this.render();
    try {
      for (const action of combat.enemyTurnSteps()) {
        if (this.ui.animateEnemyAction) await this.ui.animateEnemyAction(this, action);
        if (this.combat !== combat || this.screen !== "combat") return;
      }
    } finally {
      if (this.combat === combat) {
        this.enemyTurnInProgress = false;
        this.render();
      }
    }
  }

  useInspiration(action) {
    if (this.enemyTurnInProgress) return;
    if (action === "redraw") this.combat.redrawHand();
    if (action === "partner") this.combat.usePartnerSupport();
    this.selectedCardId = null;
    this.render();
  }

  continueAfterCombat() {
    if (this.screen !== "combat" || !this.combat || this.enemyTurnInProgress || this.combat.status === "active") return;
    if (this.trialSnapshot) { this.endMonsterTrial(); return; }
    this.run.player.block = 0;
    if (this.combat.status === "defeat") {
      this.resultOutcome = "defeat";
      this.screen = "result";
      this.render();
      return;
    }
    this.run.stats.battlesWon += 1;
    if (this.encounter.kind === "boss") {
      this.run.stats.nodesCompleted += 1;
      this.map.completeCurrentNode();
      if (this.run.layer === 3) {
        this.resultOutcome = "victory";
        this.screen = "result";
      } else this.screen = 'layer-clear';
      this.render();
      return;
    }
    const isEmergency = this.encounter.kind === "emergency";
    let moraGranted = this.rewardGenerator.moraReward(isEmergency);
    let grantedRelic = null;
    let relicCompensation = 0;
    if (isEmergency) {
      [grantedRelic] = this.rewardGenerator.relicChoices(1, this.run.relics);
      if (grantedRelic) this.rewardGenerator.applyRelic(this.run, grantedRelic.id);
      else if (isEmergency) { relicCompensation = EMERGENCY_RULES.duplicateRelicMora; moraGranted += relicCompensation; }
    }
    this.run.mora += moraGranted;
    this.pendingReward = { type: "card", choices: this.rewardGenerator.cardChoices(isEmergency ? EMERGENCY_RULES.cardChoices : 3, this.run), title: isEmergency ? "紧急战斗 · 丰厚战果" : "战斗奖励", grantedRelic, moraGranted, upgraded: isEmergency, relicCompensation };
    this.combat = null;
    this.screen = "reward";
    this.render();
  }

  advanceLayer() {
    if (this.screen !== 'layer-clear' || this.run.layer >= 3) return false;
    this.monsterPreview = null;
    this.run.layer += 1;
    this.encounterDirector.layer = this.run.layer;
    this.map = new MapEngine(this.random);
    this.map.getNode('boss').name = ENEMY_DEFINITIONS[this.run.bossPlan[this.run.layer - 1]].name;
    this.run.player.heal(20);
    this.run.mora += 40;
    this.encounter = null;
    this.combat = null;
    this.selectedCardId = null;
    this.screen = 'map';
    this.render();
    return true;
  }

  chooseReward(choiceId) {
    if (this.screen !== "reward" || !this.pendingReward) return;
    if (choiceId && !this.pendingReward.choices.some((choice) => choice.id === choiceId)) return;
    if (this.pendingReward.type === "card") {
      if (choiceId && !this.run.addCard(choiceId, this.pendingReward.upgraded)) return;
    } else if (choiceId) {
      this.rewardGenerator.applyRelic(this.run, choiceId);
    }
    const starting = this.pendingReward.starting;
    this.pendingReward = null;
    if (starting) { this.screen = "map"; this.render(); }
    else this.finishCurrentNode();
  }

  chooseEventOption(optionId) {
    this.eventEngine.applyOption(optionId);
    if (this.run.player.isDefeated) {
      this.resultOutcome = "defeat";
      this.screen = "result";
      this.render();
      return;
    }
    this.eventEngine = null;
    this.finishCurrentNode();
  }

  buyShopItem(itemId) {
    if (this.screen !== "shop" || !this.shop) return false;
    const bought = this.shop.buy(itemId);
    this.render();
    return bought;
  }

  leaveShop() {
    if (this.screen !== "shop" || !this.shop) return;
    this.shop = null;
    this.finishCurrentNode();
  }

  useAnchor(action, deckIndex = null) {
    if (action === "heal") this.run.player.heal(18);
    if (action === "upgrade") {
      const card = this.run.deck[Number(deckIndex)];
      if (!card || card.upgraded) throw new Error("请选择一张尚未升级的卡牌");
      card.upgraded = true;
    }
    this.finishCurrentNode();
  }

  finishCurrentNode() {
    this.monsterPreview = null;
    this.map.completeCurrentNode();
    this.run.stats.nodesCompleted += 1;
    this.encounter = null;
    this.screen = "map";
    this.render();
  }

  resolvePlaceholderEncounter() {
    this.finishCurrentNode();
  }

  render() {
    this.ui.render(this);
  }
}
