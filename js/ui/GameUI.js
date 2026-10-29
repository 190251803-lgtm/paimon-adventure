import { elementChineseLabel, localizeGameText } from '../data/chineseText.js';
import { PARTNERS } from "../data/partners.js";
import { NODE_LABELS } from "../data/map.js";
import { CARD_DEFINITIONS, CHARACTER_NAMES } from "../data/cards.js";
import { nodeArtwork } from "./NodeArtwork.js";
import { MonsterLibrary } from './MonsterLibrary.js';
import { BOSS_BY_ID } from '../data/bossCatalog.js';

const iconForKind = {
  start: "⚓",
  battle: "⚔️",
  emergency: "🔥",
  event: "🌸",
  treasure: "🎁",
  shop: "🏪",
  anchor: "🌀",
  boss: "⚡",
};

const iconForNode = {
  start: "⚓",
  meadow: "🦊",
  camp: "🏠",
  lake: "🌲",
  ruins: "🗿",
  ridge: "🗻",
  riverbank: "🏯",
  old_tower: "⛩️",
  seelie: "🌸",
  windfield: "⚡",
  anchor: "🌀",
  elite: "⚔️",
  core_guard: "💎",
  boss: "👁️",
};

const PAIMON_IMAGE = "./assets/characters/paimon.webp";

const TERM_DEFINITIONS = {
  energy: {
    title: "星能",
    description: "使用卡牌需要消耗星能。每个回合开始时，星能会恢复至3点；没有使用的星能不会累积到下个回合。",
  },
  inspiration: {
    title: "灵感",
    description: "灵感上限为6点。消耗2点可以重抽当前手牌，积满6点可以发动伙伴支援；部分卡牌和元素反应能够提供灵感。",
  },
  fullness: {
    title: "饱腹",
    description: "料理会增加饱腹值，上限为10点。达到10点时，下个回合开始减少4点饱腹；不影响抽牌数量。",
  },
  block: {
    title: "护盾",
    description: "伤害会先扣除护盾，超过护盾的部分才扣除生命。我方护盾在下一次我方回合开始时清空；敌方护盾会保留整个我方回合，在下一次敌方行动开始时清空。例如7点伤害命中5点护盾，只扣除2点生命。",
  },
  combo: {
    title: "手牌联动",
    description: "同一回合按顺序出牌可以叠加收益：急忙闪避积累蓄势，下一张伤害牌使用后清空；看那边！给指定敌人施加标记，下一张伤害牌直接命中该敌人时消耗；星辉追击在本回合打过其他伤害牌后获得加成；盾光反击按当前护盾增加伤害。蓄势、标记和追击条件在下回合开始时重置。加成先计入伤害，再结算元素反应和敌方护盾。",
  },
  freeze: {
    title: "冻结与碎冰",
    description: "冰与水相遇触发冻结（先冰后水也可）。被冻结的敌人跳过下一次行动，随后解冻；重复冻结不叠加跳过次数。无元素的物理攻击（派蒙冲击、星辉追击、盾光反击等）命中冻结目标时触发碎冰，额外造成2点伤害并立即解冻，敌人因此可以正常行动。反应后普通敌人的元素附着会清除；水史莱姆始终保留固有水附着。伤害照常先扣护盾；单独的冰附着不会阻止行动。",
  },
  icicles: {
    title: "凛冽轮舞",
    description: "凯亚消耗6点灵感发动支援，对全体敌人造成6点冰元素伤害；接下来两个我方回合开始时，冰棱各对全体造成4点冰元素伤害，可触发冻结。收集同名技能牌也可发动，升级后延长至3回合。技能与支援共享冰棱，再次发动刷新持续时间，不叠加冰棱层数。",
  },
  cards: {
    title: "技能收集与策略卡牌",
    description: "每轮开始抽取5张与手牌剩余空位数中的较小值，手牌上限7张。仅开局卡牌实例（含伙伴初始技能）可跨回合留存；后续获得的牌未使用时在回合末进入弃牌堆，可以再次抽到。每次战斗胜利从三张随机卡牌中选一张；尚有未收集技能时，保证出现一张派蒙或当前伙伴的技能牌。技能每局只需获得一次，奖励和商店会避开已拥有的技能。获得后自动加入本局牌库，后续战斗参与洗牌与抽取，不保证立即上手。策略牌可以收集多张。消耗表示打出后移出本场战斗的循环，下一场仍会恢复。连携攻势按此前打出的伤害牌数量加伤；反应催化只持续本回合，导电结界持续整场；固守阵线让未被击破的护盾保留到下一回合一次。每场战斗的增益重新计算。新冒险重新构筑牌库。",
  },
};

export class GameUI {
  constructor(root) {
    this.root = root;
    this.monsterLibrary = new MonsterLibrary(root);
  }

  render(game) {
    this.game = game;
    if (this.enemyActionCombat && (game.screen !== "combat" || game.combat !== this.enemyActionCombat)) this.cancelEnemyAction?.();
    this.cancelCardDrag?.();
    if (game.screen !== "combat") this.clearEnemyHitFeedback();
    if (game.screen === "home") this.renderHome(game);
    if (game.screen === "partner") this.renderPartnerSelection(game);
    if (game.screen === "map") this.renderMap(game);
    if (game.screen === "combat") this.renderCombat(game);
    if (game.screen === "event") this.renderEvent(game);
    if (game.screen === "reward") this.renderReward(game);
    if (game.screen === "anchor") this.renderAnchor(game);
    if (game.screen === "shop") this.renderShop(game);
    if (game.screen === "encounter-placeholder") this.renderEncounterPlaceholder(game);
    if (game.screen === "result") this.renderResult(game);
    if (game.screen === 'layer-clear') this.renderLayerClear(game);
    if (game.screen === "monsters") this.monsterLibrary.render(game);
    this.root.querySelectorAll('[data-monster-library]').forEach(button=>{ button.disabled=game.enemyTurnInProgress; button.addEventListener('click',()=>{location.hash='monsters';}); });
    this.root.querySelectorAll('[data-monster-detail]').forEach(button=>{
      if (game.battleInfoRestricted && !game.currentMonsterIds.includes(button.dataset.monsterDetail)) {
        button.hidden = true;
        return;
      }
      button.disabled=game.enemyTurnInProgress;
      button.addEventListener('click',()=>{location.hash=`monsters/${button.dataset.monsterDetail}`;});
    });
    this.bindMonsterImages(this.root);
    if (game.trialSnapshot && game.screen === 'combat') {
      const exit=document.createElement('button'); exit.className='text-button'; exit.textContent='退出试战 · 返回怪物详情'; exit.dataset.exitTrial='';
      exit.addEventListener('click',()=>game.endMonsterTrial()); this.root.querySelector('.status-bar').append(exit);
    }
    this.root.querySelectorAll("[data-deck]").forEach((button) => button.addEventListener("click", () => this.showDeckDialog(game.run)));
    this.root.querySelectorAll("[data-term]").forEach((button) => button.addEventListener("click", () => this.showTermDialog(button.dataset.term)));
  }

  renderHome(game) {
    this.root.innerHTML = `
      <main class="title-screen">
        <section class="title-content" aria-labelledby="game-title">
          <img class="paimon-emblem" src="${PAIMON_IMAGE}" alt="派蒙" />
          <h1 id="game-title">派蒙大冒险</h1>
          <p class="title-copy">旅行者被异常地脉卷走了。选择伙伴留下的记忆回响，穿过星落地脉岛，把旅行者带回来。</p>
          <div class="title-actions">
            <button class="primary-button" id="start-button" type="button">开始冒险</button>
            <button class="text-button" id="rules-button" type="button">查看规则</button>
            <button class="text-button" data-monster-library type="button">怪物图鉴</button>
          </div>
        </section>
      </main>`;

    this.root.querySelector("#start-button").addEventListener("click", () => game.showPartnerSelection());
    this.root.querySelector("#rules-button").addEventListener("click", () => this.showRulesDialog());
  }

  showRulesDialog() {
    const dialog = document.createElement("dialog");
    dialog.className = "rules-dialog";
    dialog.innerHTML = `
      <h2>冒险规则</h2>
      <ol>
        <li>沿发光连线选择下一站，每层可继续前进或转入相邻分支；经过商店后仍可换路。</li>
        <li>战斗中使用卡牌攻击、防御并触发元素反应。</li>
        <li>通过事件、宝箱和锚点调整卡组与状态。</li>
        <li>战斗奖励与商店提供角色技能和策略牌；技能获得一次后加入本局牌库，可在后续战斗反复抽取。</li>
        <li>冒险共三层，每层一位首领。前两层从观测枢魔物角色牌中随机选出不同首领，第三层固定挑战吞星之鲸。击败最终首领即可完成一局。</li>
      </ol>
      <button class="primary-button" type="button">明白了</button>`;
    document.body.append(dialog);
    dialog.querySelector("button").addEventListener("click", () => dialog.close());
    dialog.addEventListener("close", () => dialog.remove());
    dialog.showModal();
  }

  termButton(id, label) {
    return `<button class="term-help" data-term="${id}" type="button" aria-label="解释${label}">${label}</button>`;
  }

  showTermDialog(termId) {
    const term = TERM_DEFINITIONS[termId];
    if (!term) return;
    const dialog = document.createElement("dialog");
    dialog.className = "term-dialog";
    dialog.innerHTML = `
      <button class="dialog-close" type="button" aria-label="关闭">×</button>
      <p class="eyebrow">战斗名词</p>
      <h2>${term.title}</h2>
      <p>${term.description}</p>
      <button class="primary-button" type="button" data-close-dialog>明白了</button>`;
    document.body.append(dialog);
    dialog.querySelectorAll(".dialog-close, [data-close-dialog]").forEach((button) => button.addEventListener("click", () => dialog.close()));
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener("close", () => dialog.remove());
    dialog.showModal();
  }

  renderPartnerSelection(game) {
    this.root.innerHTML = `
      <main class="selection-screen">
        <button class="back-button" id="back-button" type="button" aria-label="返回首页">←</button>
        <header class="screen-heading">
          <p class="eyebrow">冒险准备</p>
          <h1>选择伙伴回响</h1>
          <p>伙伴决定初始元素与支援能力；冒险途中可收集派蒙及该伙伴的专属技能。</p>
        </header>
        <section class="captain-row" aria-label="固定队长">
          <article class="character-card captain-card" aria-label="派蒙，固定队长">
            <div class="character-art character-art--paimon"><img src="${PAIMON_IMAGE}" alt="派蒙" /></div>
            <div class="character-copy">
              <span class="character-role">固定队长</span>
              <strong class="partner-name">派蒙</strong>
              <span class="partner-element">旅行向导 · 星能指挥</span>
              <span class="partner-description">本局始终出战。可收集星光引路、向导的鼓劲和群星出击，强化抽牌与连击。</span>
              <span class="partner-command">已加入队伍</span>
            </div>
          </article>
        </section>
        <section class="partner-grid character-roster" aria-label="可选伙伴回响列表">
          ${PARTNERS.map(
            (partner) => `
              <button class="character-card partner-option" data-partner-id="${partner.id}" type="button" style="--partner-color:${partner.color}">
                <span class="character-art"><img src="${partner.image}" alt="${partner.name.replace("回响", "")}" /></span>
                <span class="character-copy">
                  <span class="character-role">可选伙伴</span>
                  <span class="partner-name">${partner.name}</span>
                  <span class="partner-element">${partner.element}元素 · ${partner.skill}</span>
                  <span class="partner-description">${partner.description}</span>
                  <span class="partner-command">选择回响</span>
                </span>
              </button>`,
          ).join("")}
        </section>
      </main>`;

    this.root.querySelector("#back-button").addEventListener("click", () => game.showHome());
    this.root.querySelectorAll("[data-partner-id]").forEach((button) => {
      button.addEventListener("click", () => game.startNewRun(button.dataset.partnerId));
    });
  }

  statusBar(run) {
    return `
      <header class="status-bar">
        <div class="status-brand"><img src="${PAIMON_IMAGE}" alt="派蒙" /><strong>派蒙大冒险</strong></div>
        <div class="status-items">
          ${run.bossPlan?.length?`<span class="layer-indicator"><b>第 ${run.layer} / 3 层</b></span><button class="deck-button current-boss" data-monster-detail="${run.bossPlan[run.layer-1]}" type="button">本层首领 · ${BOSS_BY_ID[run.bossPlan[run.layer-1]].name} ↗</button>`:''}
          <span><b>生命</b> ${run.health}/${run.maxHealth}</span>
          <span><b>摩拉</b> ${run.mora}</span>
          <span><b>伙伴</b> ${run.partner.name}</span>
          <span><b>天气</b> ${run.weather.name}</span>
          <span><b>秘宝</b> ${run.relics.length}</span>
          <button class="deck-button" data-deck type="button">牌库 ${run.deck.length}</button>
          <button class="deck-button" data-monster-library type="button">${this.game?.battleInfoRestricted ? "本关怪物" : "怪物图鉴"}</button>
        </div>
      </header>`;
  }

  cardLabel(definition) {
    return definition.owner ? `${CHARACTER_NAMES[definition.owner]} · 技能` : this.cardTypeLabel(definition.type);
  }

  showDeckDialog(run) {
    const dialog = document.createElement("dialog");
    dialog.className = "term-dialog deck-dialog";
    const groups = new Map();
    run.deck.forEach((entry) => {
      const key = `${entry.cardId}:${entry.upgraded}`;
      const group = groups.get(key) ?? { ...entry, count: 0 };
      group.count += 1;
      groups.set(key, group);
    });
    dialog.innerHTML = `<button class="dialog-close" type="button" aria-label="关闭牌库">×</button>
      <p class="eyebrow">本局构筑 · ${run.deck.length} 张牌</p><h2>冒险牌库</h2>
      <p>获得后自动入库，后续战斗会洗入抽牌堆。角色技能只需收集一次；消耗牌下场战斗恢复。</p>
      <div class="deck-library">${[...groups.values()].map((entry) => {
        const card = CARD_DEFINITIONS[entry.cardId];
        return `<article class="library-card card-${card.type}"><small>${this.cardLabel(card)} · ${card.cost} 星能</small>
          <h3>${card.name}${entry.upgraded ? "+" : ""}<span> ×${entry.count}</span></h3>
          <p>${entry.upgraded ? card.upgradedDescription : card.description}</p>
          ${card.unique ? '<b class="skill-badge">技能已收集</b>' : ""}</article>`;
      }).join("")}</div><button class="primary-button" data-close-dialog type="button">返回冒险</button>`;
    document.body.append(dialog);
    dialog.querySelectorAll(".dialog-close, [data-close-dialog]").forEach((button) => button.addEventListener("click", () => dialog.close()));
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener("close", () => dialog.remove());
    dialog.showModal();
  }

  renderMap(game) {
    const { run, map } = game;
    const travelledEdges = new Set(map.visitedNodeIds.slice(1).map((id, index) => `${map.visitedNodeIds[index]}:${id}`));
    const connectionLines = map.nodes.flatMap((node) =>
      node.links.map((targetId) => {
        const target = map.getNode(targetId);
        const available = node.id === map.currentNodeId && map.canMoveTo(targetId);
        return `<line class="route-line${node.route && target.route && node.route !== target.route ? " is-crossing" : ""}${available ? " is-reachable" : ""}${travelledEdges.has(`${node.id}:${targetId}`) ? " is-travelled" : ""}" data-route-from="${node.id}" data-route-to="${targetId}" x1="${node.x}" y1="${node.y}" x2="${target.x}" y2="${target.y}" />`;
      }),
    ).join("");

    this.root.innerHTML = `
      <main class="game-shell map-screen">
        ${this.statusBar(run)}
        <section class="map-header">
          <div><p class="eyebrow">第 ${run.layer} / 3 层 · ${run.layer===3?'最终层':'探索与挑战'}</p><h1>提瓦特之旅</h1></div>
          <p><strong>${run.weather.name}</strong><br>${run.weather.description}</p>
        </section>
        <div class="map-scroll map-scroll--branching" tabindex="0" role="region" aria-label="可左右拖动或使用方向键浏览的路线地图">
          <section class="map-frame map-frame--branching" aria-label="蒙德、璃月与稻妻三条交错分支地图，可中途换路">
            <div class="map-panorama" aria-hidden="true">
              <img src="./assets/map-mondstadt.png" alt="" draggable="false" />
              <img src="./assets/map-liyue.png" alt="" draggable="false" />
              <img src="./assets/map-scene-background.jpg" alt="" draggable="false" />
            </div>
            <svg class="route-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${connectionLines}</svg>
            ${map.nodes.map((node) => {
              const displayKind = node.kind === "emergency" ? "battle" : node.kind;
              return `
              <button
                class="map-node map-node--${displayKind} is-${node.status}"
                data-node-id="${node.id}"
                ${node.status === "available" ? 'aria-haspopup="dialog"' : ""}
                type="button"
                style="left:${node.x}%; top:${node.y}%"
                ${node.status !== "available" ? "disabled" : ""}
                aria-label="${node.status === "locked" ? "未探索地点" : node.name}，${NODE_LABELS[displayKind]}，${node.status === "available" ? "点击查看详情" : node.status === "locked" ? "详情未揭晓" : node.status === "current" ? "当前位置" : "已完成"}"
              >
                <span class="node-icon node-icon--${displayKind}" data-cartoon-icon="${node.id}" aria-hidden="true">${displayKind === "treasure" ? nodeArtwork("treasure") : node.status === "locked" || displayKind === "battle" ? iconForKind[displayKind] : iconForNode[node.id] ?? iconForKind[displayKind]}</span>
                <span class="node-label">
                  ${node.status !== "locked" ? `<strong>${node.name}</strong>` : ""}
                  <small class="node-kind node-kind--${displayKind}">${NODE_LABELS[displayKind]}</small>
                </span>
              </button>`; }).join("")}
            <div class="map-legend" aria-label="地图图例">
              <span><i class="legend-dot legend-dot--current"></i>当前位置</span>
              <span><i class="legend-dot legend-dot--available"></i>可前往</span>
              <span><i class="legend-dot legend-dot--completed"></i>已完成</span>
            </div>
          </section>
        </div>
      </main>`;

    const scroller = this.root.querySelector(".map-scroll");
    const availablePositions = [...this.root.querySelectorAll(".map-node.is-available")].map((node) => node.offsetLeft);
    const focusX = availablePositions.length ? (Math.min(...availablePositions) + Math.max(...availablePositions)) / 2 : this.root.querySelector(".map-node.is-current").offsetLeft;
    scroller.scrollLeft = Math.max(0, focusX - scroller.clientWidth * .5);
    this.bindMapDrag(scroller);
    this.root.querySelectorAll("[data-node-id]:not(:disabled)").forEach((button) => {
      button.addEventListener("click", () => {
        this.showNodePreview(game, button.dataset.nodeId);
      });
    });
  }

  bindMapDrag(scroller) {
    // The virtual landscape canvas rotates the map, so a physical vertical swipe
    // must be converted into the map's horizontal scroll axis.
    let gesture = null;
    let suppressClick = false;
    scroller.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (event.pointerType !== "mouse" && event.pointerType !== "touch") return;
      suppressClick = false;
      const rotated = document.documentElement.classList.contains("virtual-landscape");
      gesture = { id: event.pointerId, axis: rotated ? "y" : "x", start: rotated ? event.clientY : event.clientX, scrollLeft: scroller.scrollLeft, dragging: false };
    });
    scroller.addEventListener("pointermove", (event) => {
      if (!gesture || event.pointerId !== gesture.id) return;
      const distance = (gesture.axis === "y" ? event.clientY : event.clientX) - gesture.start;
      if (!gesture.dragging && Math.abs(distance) < 6) return;
      if (!gesture.dragging) {
        gesture.dragging = true;
        suppressClick = true;
        scroller.setPointerCapture(event.pointerId);
        scroller.classList.add("is-dragging");
      }
      event.preventDefault();
      scroller.scrollLeft = gesture.scrollLeft - distance;
    });
    const finish = (event) => {
      if (!gesture || event.pointerId !== gesture.id) return;
      if (scroller.hasPointerCapture(event.pointerId)) scroller.releasePointerCapture(event.pointerId);
      gesture = null;
      scroller.classList.remove("is-dragging");
    };
    scroller.addEventListener("pointerup", finish);
    scroller.addEventListener("pointercancel", finish);
    scroller.addEventListener("lostpointercapture", finish);
    scroller.addEventListener("pointerleave", (event) => { if (!gesture?.dragging) finish(event); });
    scroller.addEventListener("click", (event) => {
      if (!suppressClick || event.detail === 0) return;
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    }, true);
  }

  bindMonsterImages(scope) {
    scope.querySelectorAll('.enemy-avatar img, .preview-enemy-portrait img, .layer-boss-art').forEach(img=>{
      const failed=()=>{img.hidden=true; img.parentElement.classList.add('art-unavailable');};
      img.addEventListener('error',failed,{once:true});
      if(img.complete && !img.naturalWidth) failed();
    });
  }

  showNodePreview(game, nodeId) {
    if (document.querySelector(".node-preview")) return;
    const preview = game.previewMonsterNode(nodeId);
    if (!preview) return;
    const previewContext = game.monsterPreview;
    let browsingDetails = false;
    const { node, enemies, event: eventPreview } = preview;
    const map = game.map;
    const isBattle = ["battle", "emergency", "boss"].includes(node.kind);
    const enterLabel = isBattle ? "进入战斗" : node.kind === "event" ? "进入事件" : node.kind === "anchor" ? "前往锚点" : node.kind === "shop" ? "进入商店" : "进入关卡";
    const dialog = document.createElement("dialog");
    dialog.className = `term-dialog node-preview${node.kind === "emergency" ? " emergency-preview" : ""}`;
    dialog.setAttribute("aria-labelledby", "node-preview-title");
    dialog.setAttribute("aria-describedby", "node-preview-visual");
    const visual = isBattle ? `<div class="preview-enemy-grid">${enemies.map((enemy) => `
      <figure class="preview-enemy" data-preview-enemy="${enemy.id}">
        <div class="preview-enemy-portrait"><img src="${enemy.image}" alt="${enemy.name}" />${node.kind === "emergency" ? '<span class="preview-rank">强化 ×1.3</span>' : ""}</div>
        <figcaption><strong>${enemy.name}</strong><div class="preview-stats">
          <span aria-label="生命 ${enemy.health}">♥ ${enemy.health}</span>
          <span aria-label="${localizeGameText(enemy.intent.label)} ${enemy.intent.value}">${enemy.intent.type === "attack" ? "⚔" : "⛨"} ${enemy.intent.value}${enemy.intent.hits ? ` ×${enemy.intent.hits}` : ""}</span>
          ${enemy.block ? `<span aria-label="开场护盾 ${enemy.block}">⛨ ${enemy.block}</span>` : ""}
          ${enemy.element ? `<span aria-label="${enemy.permanentElement ? "固有水元素附着，反应后保留" : "水元素附着"}">💧${enemy.permanentElement ? " 固有" : ""}</span>` : ""}
          ${enemy.immuneElements?.includes("hydro") ? '<span aria-label="免疫水元素伤害">水免疫</span>' : ""}
        </div><small>${localizeGameText(enemy.intent.label)}</small>${!game.battleInfoRestricted || game.currentMonsterIds.includes(enemy.id) ? `<button class="text-button" data-preview-detail="${enemy.id}" type="button">技能详情 ↗</button>` : ''}</figcaption>
      </figure>`).join("")}</div>` : `
      <figure class="preview-scene">${nodeArtwork(node.kind, eventPreview?.id)}
        <figcaption>${eventPreview?.title ?? (node.kind === "shop" ? "行商小铺" : node.kind === "anchor" ? "传送锚点" : "探索地点")}</figcaption>
      </figure>
      ${node.kind === "anchor" ? '<div class="preview-service-icons"><span>♥ +18</span><span>↑ 卡牌</span></div>' : node.kind === "shop" ? '<div class="preview-service-icons"><span>🃏 卡牌</span><span>💎 秘宝</span><span>🍗 补给</span></div>' : ""}`;
    dialog.innerHTML = `<button class="dialog-close" data-cancel-node type="button" aria-label="关闭详情">×</button>
      <p class="eyebrow">${iconForKind[node.kind]} ${NODE_LABELS[node.kind]} · 关卡详情</p>
      <h2 id="node-preview-title">${node.name}</h2>
      <div id="node-preview-visual" class="node-preview-visual">${visual}</div>
      <div class="node-preview-actions"><button class="primary-button" data-enter-node type="button">${enterLabel}</button><button class="text-button" data-cancel-node type="button" autofocus>返回地图</button></div>`;
    document.body.append(dialog);
    this.bindMonsterImages(dialog);
    dialog.addEventListener("close", () => {
      dialog.remove();
      if (!browsingDetails && game.monsterPreview === previewContext) game.monsterPreview = null;
    });
    dialog.querySelectorAll('[data-preview-detail]').forEach(button=>button.addEventListener('click',()=>{
      browsingDetails = true;
      dialog.close();
      location.hash=`monsters/${button.dataset.previewDetail}`;
    }));
    dialog.querySelectorAll("[data-cancel-node]").forEach((button) => button.addEventListener("click", () => dialog.close()));
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    dialog.querySelector("[data-enter-node]").addEventListener("click", (event) => {
      event.currentTarget.disabled = true;
      dialog.close();
      if (game.screen === "map" && game.map === map && map.canMoveTo(node.id)) game.selectNode(node.id);
    });
    dialog.showModal();
  }

  renderEncounterPlaceholder(game) {
    const node = game.encounter;
    this.root.innerHTML = `
      <main class="game-shell encounter-screen">
        ${this.statusBar(game.run)}
        <section class="encounter-panel">
          <span class="encounter-icon" aria-hidden="true">${iconForKind[node.kind]}</span>
          <p class="eyebrow">${NODE_LABELS[node.kind]}</p>
          <h1>${node.name}</h1>
          <p>${this.placeholderText(node.kind)}</p>
          <button class="primary-button" id="resolve-button" type="button">完成本次节点</button>
          <small>迭代1仅验证地图流程；该节点将在后续迭代替换为正式玩法。</small>
        </section>
      </main>`;
    this.root.querySelector("#resolve-button").addEventListener("click", () => game.resolvePlaceholderEncounter());
  }

  cardComboHint(combat, card) {
    const combo = combat.getCardCombo(card);
    const marked = card.effect.damage && combat.livingEnemies.some((enemy) => enemy.mark > 0);
    const hints = [...combo.labels];
    if (marked) hints.push("命中标记额外增伤");
    if (card.effect.followup && !combat.attacksPlayed) hints.push("先打伤害牌可追击");
    if (card.effect.blockRatio && !combat.player.block) hints.push("先叠护盾可增伤");
    if (card.effect.prepare) hints.push(`为下一击蓄势 +${card.effect.prepare}`);
    if (card.effect.mark) hints.push(`为下一击标记 +${card.effect.mark}`);
    return { ready: combo.bonus > 0 || marked, text: hints.join(" · ") };
  }

  renderCombat(game) {
    const { combat, run } = game;
    const selectedCard = game.selectedCardId ? combat.getCard(game.selectedCardId) : null;
    const battleEnded = combat.status !== "active";
    this.root.innerHTML = `
      <main class="game-shell combat-screen">
        ${this.statusBar(run)}
        <section class="combat-stage${combat.isEmergency ? " combat-stage--emergency" : ""}">
          <div class="combat-round-banner" aria-label="当前回合">
            <span>${combat.isEmergency ? "紧急战斗 · 回合" : "当前回合"}</span><strong>${combat.turn}</strong>
          </div>
          <section class="player-field" aria-label="玩家队伍">
            <div class="combat-summary">
              <div class="combat-summary-heading"><strong>我方队伍</strong><span>第 ${combat.turn} 回合</span></div>
              <div class="health-meter"><span style="width:${(run.health / run.maxHealth) * 100}%"></span></div>
              <p class="combat-vitals">生命 ${run.health}/${run.maxHealth} · ${this.termButton("block", "护盾")} ${run.player.block}</p>
              <dl class="resource-list">
                <div><dt>${this.termButton("energy", "星能")}</dt><dd>${run.player.energy}/3</dd></div>
                <div><dt>${this.termButton("inspiration", "灵感")}</dt><dd>${run.inspiration}/6</dd></div>
                <div><dt>${this.termButton("fullness", "饱腹")}</dt><dd>${run.fullness}/10</dd></div>
              </dl>
            </div>
            <div class="combat-team-portraits">
              <figure class="team-character team-character--paimon" data-ally-id="paimon">
                <img src="${PAIMON_IMAGE}" alt="派蒙" />
                <figcaption><strong>派蒙</strong><span>队长</span></figcaption>
              </figure>
              <figure class="team-character team-character--partner" data-ally-id="partner" style="--partner-color:${run.partner.color}">
                <img src="${run.partner.image}" alt="${run.partner.name.replace("回响", "")}" />
                <figcaption><strong>${run.partner.name.replace("回响", "")}</strong><span>${run.partner.element}元素伙伴</span></figcaption>
              </figure>
            </div>
          </section>
          <div class="battle-versus" aria-hidden="true">对战</div>
          <section class="enemy-side" aria-label="敌人区域">
            <div class="enemy-side-heading"><strong>${combat.isEmergency ? "🔥 强化敌人" : "敌方单位"}</strong><span>${combat.enemies.filter((enemy) => !enemy.isDefeated).length} 个目标</span></div>
            <div class="enemy-field">
              ${combat.enemies.map((enemy) => `
                <button class="enemy-unit ${enemy.isDefeated ? "is-defeated" : ""} ${selectedCard && !enemy.isDefeated ? "is-targetable" : ""}"
                  data-enemy-id="${enemy.instanceId}" type="button" ${!selectedCard || enemy.isDefeated ? "disabled" : ""}>
                  <span class="enemy-avatar enemy-avatar--${enemy.definition.id}${enemy.frozen && !enemy.isDefeated ? " is-frozen" : ""}" aria-hidden="true"><img src="${enemy.definition.image}" alt="" /></span>
                  <span class="enemy-intent intent-${enemy.intent.type}"><b>${enemy.frozen && !enemy.isDefeated ? "❄ 冻结 · 跳过行动" : `${enemy.intent.type === "attack" ? "⚔" : "盾"} ${enemy.intent.value}${enemy.intent.hits ? ` × ${enemy.intent.hits}` : ""}`}</b><small>${enemy.intent.type === "attack" ? "攻击手段" : "防御手段"}：${localizeGameText(enemy.intent.label)}</small></span>
                  <strong>${enemy.name}</strong>
                  <span class="enemy-health">${enemy.health}/${enemy.maxHealth}生命 · ${enemy.block}护盾${enemy.element ? ` · ${this.elementLabel(enemy.element)}附着${enemy.definition.permanentElement ? "（固有）" : ""}` : ""}${enemy.definition.immuneElements?.map(e=>` · ${this.elementLabel(e)}免疫`).join('') || ''}${enemy.weak ? ` · 虚弱${enemy.weak}` : ""}${enemy.mark ? ` · 标记+${enemy.mark}` : ""}</span>
                  ${enemy.monsterState ? `<span class="monster-combat-state">${[enemy.monsterState.armor ? `独立护甲 ${enemy.monsterState.armor}` : '', enemy.monsterState.charge ? `蓄势 ${enemy.monsterState.charge}` : '', enemy.monsterState.disabled ? `失能 ${enemy.monsterState.disabled}轮` : '', ...enemy.monsterState.summons.filter(s=>s.turns>0).map(s=>`${s.label} · ${s.turns}次`)].filter(Boolean).join(' / ')}</span>` : ''}
                  ${selectedCard?.effect.damage && !enemy.isDefeated && combat.getCardCombo(selectedCard, enemy).bonus ? `<span class="enemy-combo-hint">联动增伤 +${combat.getCardCombo(selectedCard, enemy).bonus}</span>` : ""}
                </button>`).join("")}
            </div>
            <div class="enemy-detail-links">${combat.enemies.filter(e=>e.definition.catalogId).map(e=>`<button class="text-button" data-monster-detail="${e.definition.catalogId}" type="button">${e.name} · 技能详情 ↗</button>`).join('')}</div>
          </section>
          <aside class="battle-log" aria-label="战斗日志">
            <strong>战斗记录</strong>
            <div>${combat.log.slice(0, 4).map((entry) => `<p>${entry}</p>`).join("")}</div>
          </aside>
          <section class="hand-area">
            <div class="turn-controls">
              <span>抽牌堆 ${combat.deck.drawPile.length}</span>
              <span>弃牌堆 ${combat.deck.discardPile.length}</span>
              <span>消耗区 ${combat.deck.exhaustPile.length}</span>
              ${selectedCard ? `<strong>请选择攻击目标</strong>` : ""}
              ${!battleEnded ? `<button class="inspiration-button" id="redraw-hand" type="button" ${run.inspiration < 2 ? "disabled" : ""}>灵感重抽 2</button>` : ""}
              ${!battleEnded ? `<button class="inspiration-button" id="partner-support" type="button" ${run.inspiration < 6 ? "disabled" : ""}>伙伴支援 6${run.partner.id === "kaeya" ? " · 凛冽轮舞" : ""}</button>` : ""}
              ${battleEnded
                ? `<button class="primary-button" id="continue-combat" type="button">${combat.status === "victory" ? combat.isBoss ? run.layer===3?'完成冒险':'首领已击败 · 前往下一层':'领取战果' : "查看结算"}</button>`
                : `<button class="end-turn-button" id="end-turn" type="button">结束回合</button>`}
            </div>
            <div class="combo-strip" aria-live="polite">${this.termButton("combo", "手牌联动")}<span>本回合伤害牌 ${combat.attacksPlayed} 张</span><span>${combat.preparedDamage ? `蓄势 +${combat.preparedDamage} · 下一击生效` : "防御蓄势 → 标记目标 → 攻击 → 零费追击"}</span></div>
            <div class="combo-strip frost-rules">${this.termButton("freeze", "冻结 / 碎冰")}<span>冰 + 水 → 跳过行动；物理碎冰 +2并解冻</span>${run.partner.id === "kaeya" ? this.termButton("icicles", `凛冽轮舞${combat.icicleTurns ? ` · 剩余${combat.icicleTurns}回合` : ""}`) : ""}</div>
            <div class="combo-strip strategy-state">${this.termButton("cards", "技能 / 策略规则")}<span>${[
              combat.chainPower ? `连携系数 +${combat.chainPower}` : "",
              combat.reactionBoost ? `本回合反应 +${combat.reactionBoost}` : "",
              combat.permanentReaction ? `本场反应 +${combat.permanentReaction}` : "",
              combat.retainBlock ? "下回合保留护盾" : "",
              combat.lightningTurns ? `雷庭剩余 ${combat.lightningTurns} 回合` : "",
            ].filter(Boolean).join(" · ") || "每轮最多抽5张 · 手牌上限7张 · 仅开局牌可留存"}</span></div>
            <div class="card-hand" aria-label="手牌">
              ${combat.deck.hand.map((card) => {
                const hint = this.cardComboHint(combat, card);
                return `
                <button class="game-card card-${card.type} ${game.selectedCardId === card.instanceId ? "is-selected" : ""} ${hint.ready ? "is-combo-ready" : ""}"
                  data-card-id="${card.instanceId}" data-card-target="${card.target}" data-drag-side="${card.target === "self" ? "ally" : "enemy"}" type="button" ${battleEnded || card.cost > run.player.energy ? "disabled" : ""}>
                  <span class="card-cost">${card.cost}</span>
                  <span class="card-type">${this.cardLabel(card.definition)}</span>
                  <strong>${card.name}</strong>
                  <span class="card-art" aria-hidden="true">${this.cardIcon(card.type)}</span>
                  <span class="card-description">${card.description}</span>
                  ${hint.text ? `<span class="card-combo-hint">${hint.text}</span>` : ""}
                </button>`; }).join("")}
            </div>
            <p class="card-drag-hint" role="status">每张手牌均可拖动：料理、护盾及自身增益拖向我方角色，对敌卡牌拖向敌人；也可点击出牌</p>
          </section>
        </section>
      </main>`;

    if (game.enemyTurnInProgress) {
      this.root.querySelectorAll(".hand-area button, .enemy-unit").forEach((button) => { button.disabled = true; });
      this.root.querySelector("#end-turn")?.replaceChildren("敌方行动中…");
      this.root.querySelector(".card-drag-hint").textContent = "敌方行动中，请等待攻击结算";
    }
    this.root.querySelectorAll("[data-card-id]:not(:disabled)").forEach((button) => {
      button.addEventListener("click", () => {
        if (performance.now() < (this.suppressCardClickUntil ?? 0)) return;
        game.selectCard(button.dataset.cardId);
      });
      this.bindCardDrag(button, game);
    });
    this.root.querySelectorAll("[data-enemy-id]:not(:disabled)").forEach((button) => {
      button.addEventListener("click", () => game.selectEnemy(button.dataset.enemyId));
    });
    this.root.querySelector("#end-turn")?.addEventListener("click", () => game.endTurn());
    this.root.querySelector("#redraw-hand")?.addEventListener("click", () => game.useInspiration("redraw"));
    this.root.querySelector("#partner-support")?.addEventListener("click", () => game.useInspiration("partner"));
    this.root.querySelector("#continue-combat")?.addEventListener("click", () => game.continueAfterCombat());
    this.showEnemyHitFeedback(combat);
  }

  async animateEnemyAction(game, action) {
    const combat = game.combat;
    this.enemyActionCombat = combat;
    let cancelled = false;
    let timer;
    let resume;
    const cleanup = () => {
      this.root.querySelectorAll(".enemy-action-label, .enemy-attack-trail, .player-hit-feedback").forEach((element) => element.remove());
      this.root.querySelectorAll(".is-attacking, .player-is-hit, .player-is-blocking").forEach((element) => element.classList.remove("is-attacking", "player-is-hit", "player-is-blocking"));
    };
    const cancel = () => { cancelled = true; clearTimeout(timer); cleanup(); resume?.(); };
    this.cancelEnemyAction = cancel;
    const wait = (duration) => new Promise((resolve) => { resume = resolve; timer = setTimeout(resolve, duration); });
    const current = () => !cancelled && game.combat === combat && game.screen === "combat";
    const label = (phase) => {
      const element = document.createElement("div");
      element.className = "enemy-action-label";
      element.dataset.phase = phase;
      element.dataset.enemyId = action.enemyId;
      element.setAttribute("role", "status");
      const enemy = combat.enemies.find((entry) => entry.instanceId === action.enemyId);
      element.textContent = `${enemy.name} · ${localizeGameText(action.label)}${action.hits > 1 ? `（第 ${action.hit}/${action.hits} 段）` : ""}`;
      this.root.querySelector(".combat-stage").append(element);
    };
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    try {
      cleanup();
      label("windup");
      const attacker = this.root.querySelector(`[data-enemy-id="${action.enemyId}"]`);
      if (action.type === "attack") {
        attacker.classList.add("is-attacking");
        const stage = this.root.querySelector(".combat-stage");
        const source = attacker.querySelector(".enemy-avatar").getBoundingClientRect();
        const target = this.root.querySelector(".combat-team-portraits").getBoundingClientRect();
        const origin = stage.getBoundingClientRect();
        const trail = document.createElement("span");
        trail.className = "enemy-attack-trail";
        trail.setAttribute("aria-hidden", "true");
        trail.style.left = `${source.x + source.width / 2 - origin.x}px`;
        trail.style.top = `${source.y + source.height / 2 - origin.y}px`;
        trail.style.setProperty("--attack-x", `${target.x + target.width / 2 - source.x - source.width / 2}px`);
        trail.style.setProperty("--attack-y", `${target.y + target.height / 2 - source.y - source.height / 2}px`);
        stage.append(trail);
      }
      await wait(reducedMotion ? 100 : 320);
      if (!current()) return;
      game.render();
      label("impact");
      if (action.type === "attack") {
        const team = this.root.querySelector(".combat-team-portraits");
        team.classList.add(action.healthDamage ? "player-is-hit" : "player-is-blocking");
        const feedback = document.createElement("span");
        feedback.className = `player-hit-feedback${action.healthDamage === 0 ? " is-blocked" : ""}`;
        feedback.setAttribute("role", "status");
        feedback.innerHTML = `<small>我方队伍受击</small><b>${action.healthDamage ? `−${action.healthDamage} 生命` : "护盾抵挡"}</b>${action.absorbed ? `<small>护盾吸收 ${action.absorbed}</small>` : ""}${combat.player.isDefeated ? "<small>队伍倒下了</small>" : ""}`;
        team.append(feedback);
      } else {
        const unit = this.root.querySelector(`[data-enemy-id="${action.enemyId}"]`);
        const feedback = document.createElement("span");
        feedback.className = "player-hit-feedback is-blocked";
        feedback.textContent = action.type === "defend" ? `护盾 +${action.block}` : action.type === "frozen" ? "❄ 冻结，跳过行动" : "行动被打断";
        unit.append(feedback);
      }
      await wait(950);
    } finally {
      if (this.cancelEnemyAction === cancel) {
        cleanup();
        this.cancelEnemyAction = null;
        this.enemyActionCombat = null;
      }
    }
  }

  clearEnemyHitFeedback() {
    clearTimeout(this.enemyHitTimer);
    this.enemyHits = new Map();
    this.hitCombat = null;
  }

  showEnemyHitFeedback(combat) {
    if (this.hitCombat !== combat) {
      this.clearEnemyHitFeedback();
      this.hitCombat = combat;
    }
    clearTimeout(this.enemyHitTimer);
    const now = performance.now();
    const newHits = new Map();
    for (const event of combat.damageEvents.splice(0)) {
      const hit = newHits.get(event.enemyId) ?? { healthDamage: 0, absorbed: 0, reactions: new Set(), expires: now + 1800 };
      hit.healthDamage += event.healthDamage;
      hit.absorbed += event.absorbed;
      hit.defeated = event.defeated;
      if (event.reaction) hit.reactions.add(event.reaction);
      newHits.set(event.enemyId, hit);
    }
    for (const [id, hit] of newHits) this.enemyHits.set(id, hit);
    for (const [id, hit] of this.enemyHits) {
      if (hit.expires <= now) { this.enemyHits.delete(id); continue; }
      const unit = this.root.querySelector(`[data-enemy-id="${id}"]`);
      if (!unit) continue;
      unit.classList.add("has-hit-feedback");
      if (newHits.has(id)) unit.classList.add("is-hit");
      const feedback = document.createElement("span");
      feedback.className = `enemy-hit-feedback${hit.healthDamage === 0 ? " is-blocked" : ""}`;
      feedback.setAttribute("role", "status");
      feedback.setAttribute("aria-live", "polite");
      feedback.innerHTML = `<b>${hit.healthDamage > 0 ? `−${hit.healthDamage} 生命` : "护盾抵挡"}</b>${hit.absorbed ? `<small>护盾吸收 ${hit.absorbed}</small>` : ""}${hit.reactions.size ? `<small>${[...hit.reactions].join(" · ")}</small>` : ""}${hit.defeated ? "<small>击败！</small>" : ""}`;
      unit.append(feedback);
    }
    const expire = () => {
      const time = performance.now();
      for (const [id, hit] of this.enemyHits) {
        if (hit.expires > time) continue;
        const unit = this.root.querySelector(`[data-enemy-id="${id}"]`);
        unit?.classList.remove("has-hit-feedback", "is-hit");
        unit?.querySelector(".enemy-hit-feedback")?.remove();
        this.enemyHits.delete(id);
      }
      if (this.enemyHits.size) this.enemyHitTimer = setTimeout(expire, Math.max(0, Math.min(...[...this.enemyHits.values()].map((hit) => hit.expires)) - time));
    };
    expire();
  }

  showShieldGain(amount) {
    clearTimeout(this.shieldGainTimer);
    this.root.querySelectorAll(".shield-gain-feedback").forEach((element) => element.remove());
    const team = this.root.querySelector(".combat-team-portraits");
    if (!team) return;
    team.classList.add("player-is-blocking");
    const feedback = document.createElement("span");
    feedback.className = "player-hit-feedback is-blocked shield-gain-feedback";
    feedback.setAttribute("role", "status");
    feedback.innerHTML = `<small>我方队伍</small><b>护盾 +${amount}</b><small>派蒙与伙伴共享护盾</small>`;
    team.append(feedback);
    this.shieldGainTimer = setTimeout(() => {
      feedback.remove();
      team.classList.remove("player-is-blocking");
    }, 1500);
  }

  bindCardDrag(button, game) {
    button.addEventListener("dragstart", (event) => event.preventDefault());
    button.addEventListener("pointerdown", (start) => {
      if (start.button !== 0 || !start.isPrimary || button.disabled || this.cancelCardDrag) return;
      const pointerId = start.pointerId;
      const controller = new AbortController();
      const options = { signal: controller.signal };
      const hint = this.root.querySelector(".card-drag-hint");
      const originalHint = hint.textContent;
      const isAllyCard = button.dataset.dragSide === "ally";
      const targetSelector = isAllyCard ? ".team-character[data-ally-id]" : ".enemy-unit:not(.is-defeated)";
      const targets = [...this.root.querySelectorAll(targetSelector)];
      let ghost = null;
      let dragging = false;
      const targetAt = (event) => {
        const target = document.elementFromPoint(event.clientX, event.clientY)?.closest(targetSelector);
        return targets.includes(target) ? target : null;
      };
      const cleanup = () => {
        controller.abort();
        ghost?.remove();
        button.classList.remove("is-dragging");
        targets.forEach((target) => target.classList.remove("is-drop-ready", "is-drop-hover"));
        hint.textContent = originalHint;
        if (dragging) this.suppressCardClickUntil = performance.now() + 400;
        this.cancelCardDrag = null;
        if (button.hasPointerCapture(pointerId)) button.releasePointerCapture(pointerId);
      };
      this.cancelCardDrag = cleanup;
      button.setPointerCapture(pointerId);
      document.addEventListener("pointermove", (event) => {
        if (event.pointerId !== pointerId) return;
        if (!dragging && Math.hypot(event.clientX - start.clientX, event.clientY - start.clientY) < 8) return;
        event.preventDefault();
        if (!dragging) {
          dragging = true;
          const box = button.getBoundingClientRect();
          ghost = button.cloneNode(true);
          ghost.removeAttribute("data-card-id");
          ghost.setAttribute("aria-hidden", "true");
          ghost.tabIndex = -1;
          ghost.classList.add("card-drag-ghost");
          ghost.style.width = `${box.width}px`;
          ghost.style.height = `${box.height}px`;
          document.body.append(ghost);
          button.classList.add("is-dragging");
          targets.forEach((target) => target.classList.add("is-drop-ready"));
        }
        const previewWidth = ghost.offsetWidth;
        const previewHeight = ghost.offsetHeight;
        ghost.style.left = `${Math.max(previewWidth / 2 + 14, Math.min(window.innerWidth - previewWidth / 2 - 14, event.clientX))}px`;
        ghost.style.top = `${Math.max(previewHeight * .85 + 14, Math.min(window.innerHeight - previewHeight * .15 - 14, event.clientY))}px`;
        const target = targetAt(event);
        targets.forEach((entry) => entry.classList.toggle("is-drop-hover", Boolean(target) && (isAllyCard || entry === target || button.dataset.cardTarget === "all-enemies")));
        hint.textContent = target
          ? (isAllyCard ? "松开对我方队伍使用卡牌" : button.dataset.cardTarget === "all-enemies" ? "松开使用群体卡牌，对所有敌人生效" : `松开对${target.querySelector("strong").textContent}使用卡牌`)
          : (isAllyCard ? "拖到派蒙或伙伴卡牌上松开；在空白处松开可取消" : "拖到敌人卡牌上松开；在空白处松开可取消");
      }, { ...options, passive: false });
      document.addEventListener("pointerup", (event) => {
        if (event.pointerId !== pointerId) return;
        const target = dragging ? targetAt(event) : null;
        if (dragging) event.preventDefault();
        cleanup();
        if (target) {
          if (isAllyCard) game.playCardOnAlly(button.dataset.cardId, target.dataset.allyId);
          else game.playCardOnEnemy(button.dataset.cardId, target.dataset.enemyId);
        }
      }, options);
      document.addEventListener("pointercancel", (event) => { if (event.pointerId === pointerId) cleanup(); }, options);
      button.addEventListener("lostpointercapture", cleanup, options);
      document.addEventListener("keydown", (event) => { if (event.key === "Escape") cleanup(); }, options);
      window.addEventListener("blur", cleanup, options);
    });
  }

  cardTypeLabel(type) {
    return { attack: "行动", defense: "防御", idea: "妙想", food: "料理", element: "元素", partner: "伙伴" }[type] ?? "卡牌";
  }

  cardIcon(type) {
    return { attack: "⚔", defense: "🛡", idea: "💡", food: "🍗", element: "✦", partner: "★" }[type] ?? "◆";
  }

  elementLabel(element) {
    return elementChineseLabel(element);
  }

  renderResult(game) {
    const victory = game.resultOutcome === "victory";
    this.root.innerHTML = `
      <main class="result-screen">
        <img class="paimon-emblem" src="${PAIMON_IMAGE}" alt="派蒙" />
        <p class="eyebrow">${victory ? "第 3 / 3 层 · 吞星之鲸已击败" : "本次冒险结束"}</p>
        <h1>${victory ? "找到旅行者啦！" : "派蒙需要休息一下"}</h1>
        <p>完成${game.run.stats.nodesCompleted}个地点，赢得${game.run.stats.battlesWon}场战斗，触发${game.run.stats.reactions}次元素反应，获得${game.run.stats.cardsGained}张卡牌，用时约${game.run.elapsedMinutes}分钟。</p>
        <button class="primary-button" id="restart-button" type="button">重新开始</button>
      </main>`;
    this.root.querySelector("#restart-button").addEventListener("click", () => game.showPartnerSelection());
  }

  renderLayerClear(game) {
    const {run}=game, defeated=BOSS_BY_ID[run.bossPlan[run.layer-1]], next=BOSS_BY_ID[run.bossPlan[run.layer]];
    this.root.innerHTML=`<main class="game-shell layer-clear-screen">${this.statusBar(run)}<section class="choice-panel"><p class="eyebrow">第 ${run.layer} / 3 层 · 首领已击败</p><h1>${defeated.name} · 挑战完成</h1><p>下一站：第 ${run.layer+1} 层${run.layer===2?'（最终层）':''}。进入后恢复 20 点生命，获得 40 摩拉。</p><div class="layer-boss-portrait"><img class="layer-boss-art" src="${next.image}" alt="${next.name}" /></div><h2>下一层首领 · ${next.name}</h2><button class="text-button" data-monster-detail="${next.id}" type="button">查看技能详情 ↗</button><button class="primary-button" id="advance-layer" type="button">进入第 ${run.layer+1} 层</button></section></main>`;
    this.root.querySelector('#advance-layer').addEventListener('click',()=>game.advanceLayer());
  }

  renderEvent(game) {
    const event = game.eventEngine.event;
    this.root.innerHTML = `
      <main class="game-shell encounter-screen">
        ${this.statusBar(game.run)}
        <section class="choice-panel">
          <span class="encounter-icon" aria-hidden="true">?</span>
          <p class="eyebrow">随机事件 · ${game.encounter.name}</p>
          <h1>${event.title}</h1>
          <p class="choice-intro">${event.text}</p>
          <div class="choice-list">
            ${event.options.map((option) => `
              <button class="choice-button" data-event-option="${option.id}" type="button" ${game.eventEngine.isOptionAvailable(option) ? "" : "disabled"}>
                <strong>${option.label}</strong><span>${option.description}</span>
              </button>`).join("")}
          </div>
        </section>
      </main>`;
    this.root.querySelectorAll("[data-event-option]:not(:disabled)").forEach((button) => {
      button.addEventListener("click", () => game.chooseEventOption(button.dataset.eventOption));
    });
  }

  renderReward(game) {
    const reward = game.pendingReward;
    const isCardReward = reward.type === "card";
    this.root.innerHTML = `
      <main class="game-shell reward-screen">
        ${this.statusBar(game.run)}
        <section class="reward-content${reward.starting ? " starting-treasure" : ""}">
          <p class="eyebrow">${reward.starting ? "鹰翔海滩 · 冒险准备" : "冒险收获"}</p>
          <h1>${reward.title}</h1>
          ${reward.starting || game.encounter?.kind === "treasure" ? `<div class="starting-treasure-art">${nodeArtwork("treasure")}</div>` : ""}
          ${reward.starting ? '<p class="reward-note">派蒙发现了一只启程宝箱！免费选择一件秘宝，本次冒险立即生效。</p>' : ""}
          ${reward.moraGranted ? `<p class="reward-note">已获得 <strong>${reward.moraGranted} 摩拉</strong>${reward.relicCompensation ? `（含秘宝集齐补偿 ${reward.relicCompensation} 摩拉）` : ""}。${reward.upgraded ? "从下方三张升级卡牌中选择一张加入卡组。" : "选择一张卡牌加入卡组。"}</p>` : ""}
          ${reward.grantedRelic ? `<p class="reward-note">已获得秘宝：<strong>${reward.grantedRelic.name}</strong> - ${reward.grantedRelic.description}</p>` : ""}
          ${isCardReward ? `<p class="reward-note">技能获得一次即可循环抽取，奖励与商店不再重复提供该技能。${this.termButton("cards", "技能 / 策略规则")}</p>` : ""}
          <div class="reward-grid">
            ${reward.choices.map((choice) => isCardReward ? `
              <button class="reward-card card-${choice.type}" data-reward-id="${choice.id}" type="button">
                <span class="card-cost">${choice.cost}</span><span class="card-type">${this.cardLabel(choice)}</span>
                <strong>${choice.name}${reward.upgraded ? "+" : ""}</strong><span class="card-art" aria-hidden="true">${this.cardIcon(choice.type)}</span>
                <span>${reward.upgraded ? choice.upgradedDescription : choice.description}</span>
              </button>` : `
              <button class="relic-choice" data-reward-id="${choice.id}" type="button">
                <span class="relic-symbol" aria-hidden="true">${({ reaction_prism: "💎", warm_lunchbox: "🍱", adventure_badge: "🏅", wind_feather: "🪶", treasure_compass: "🧭" })[choice.id] ?? "✦"}</span><strong>${choice.name}</strong><span>${choice.description}</span>${reward.starting ? '<b class="starting-relic-action">免费领取并出发</b>' : ""}
              </button>`).join("")}
          </div>
          ${isCardReward || reward.starting ? `<button class="text-button" id="skip-reward" type="button">${reward.starting ? "放弃宝藏，直接出发" : "跳过卡牌"}</button>` : ""}
        </section>
      </main>`;
    this.root.querySelectorAll("[data-reward-id]").forEach((button) => button.addEventListener("click", () => game.chooseReward(button.dataset.rewardId)));
    this.root.querySelector("#skip-reward")?.addEventListener("click", () => game.chooseReward(null));
  }

  renderShop(game) {
    const shop = game.shop;
    const symbols = { card: "🃏", relic: "💎", heal: "🍗", inspiration: "🍵" };
    const labels = { card: "卡牌", relic: "秘宝", heal: "恢复道具", inspiration: "灵感道具" };
    this.root.innerHTML = `
      <main class="game-shell shop-screen">
        ${this.statusBar(game.run)}
        <section class="shop-content">
          <p class="eyebrow">提瓦特行商 · ${game.encounter.name}</p>
          <h1>派蒙的补给小铺</h1>
          <p class="choice-intro">把冒险收集的摩拉换成下一场战斗的底气吧！商品与价格随机，每件限购一次，补给购买后立即生效。</p>
          <p class="shop-wallet">持有摩拉 <strong>${game.run.mora}</strong></p>
          <p class="shop-state">生命 ${game.run.health}/${game.run.maxHealth} · ${this.termButton("inspiration", "灵感")} ${game.run.inspiration}/6</p>
          <div class="shop-grid">
            ${shop.items.map((item) => {
              const reason = shop.unavailableReason(item);
              return `<article class="shop-item${item.sold ? " is-sold" : ""}">
                <span class="shop-item-art" aria-hidden="true">${symbols[item.kind]}</span>
                <small>${item.kind === "card" ? this.cardLabel(CARD_DEFINITIONS[item.cardId]) : labels[item.kind]}</small><h2>${item.name}</h2>
                ${item.kind === "card" ? `<span>${this.termButton("energy", "星能")}消耗 ${item.cost}</span>` : ""}
                <p>${item.description}</p>
                <strong class="shop-price">${item.price} 摩拉</strong>
                <button class="primary-button" data-shop-item="${item.id}" type="button" ${reason ? "disabled" : ""}>${reason || "购买"}</button>
              </article>`;
            }).join("")}
          </div>
          <button class="text-button" id="leave-shop" type="button">离开商店，继续冒险</button>
        </section>
      </main>`;
    this.root.querySelectorAll("[data-shop-item]:not(:disabled)").forEach((button) => button.addEventListener("click", () => game.buyShopItem(button.dataset.shopItem)));
    this.root.querySelector("#leave-shop").addEventListener("click", () => game.leaveShop());
  }

  renderAnchor(game) {
    this.root.innerHTML = `
      <main class="game-shell encounter-screen anchor-screen">
        ${this.statusBar(game.run)}
        <section class="choice-panel anchor-panel">
          <span class="encounter-icon" aria-hidden="true">⌘</span>
          <p class="eyebrow">传送锚点</p>
          <h1>短暂整顿</h1>
          <p class="choice-intro">锚点重新亮起，派蒙只能在离开前选择一项帮助。</p>
          <button class="choice-button" id="anchor-heal" type="button"><strong>恢复状态</strong><span>恢复18点生命</span></button>
          <h2>或者升级一张卡牌</h2>
          <div class="deck-upgrade-list">
            ${game.run.deck.map((entry, index) => {
              const card = CARD_DEFINITIONS[entry.cardId];
              return `<button data-upgrade-index="${index}" type="button" ${entry.upgraded ? "disabled" : ""}><strong>${card.name}${entry.upgraded ? "+" : ""}</strong><span>${entry.upgraded ? "已经升级" : card.upgradedDescription}</span></button>`;
            }).join("")}
          </div>
        </section>
      </main>`;
    this.root.querySelector("#anchor-heal").addEventListener("click", () => game.useAnchor("heal"));
    this.root.querySelectorAll("[data-upgrade-index]:not(:disabled)").forEach((button) => button.addEventListener("click", () => game.useAnchor("upgrade", button.dataset.upgradeIndex)));
  }

  placeholderText(kind) {
    const texts = {
      battle: "前方传来魔物的声音，派蒙已经做好了指挥准备。",
      event: "一件意料之外的事情发生了，需要派蒙作出选择。",
      treasure: "草丛后闪过金色光芒，那里似乎藏着宝箱。",
      anchor: "古老的传送锚点仍有微弱光芒，可以在这里整顿状态。",
      boss: "异常地脉的中心就在眼前，旅行者的气息从核心深处传来。",
    };
    return texts[kind] ?? "派蒙开始调查这个地点。";
  }
}
