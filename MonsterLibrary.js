import { elementChineseLabel, localizeGameText, hasTransliteratedSkill } from '../data/chineseText.js';
import { MONSTER_CATALOG, MONSTER_BY_ID } from '../data/monsterCatalog.js';
import { MONSTER_RULES } from '../data/monsterRules.js';
import { BOSS_CATALOG, BOSS_BY_ID, FINAL_BOSS_ID, RANDOM_BOSS_CANDIDATES } from '../data/bossCatalog.js';
import { BOSS_RULES, BOSS_ENEMY_DEFINITIONS } from '../data/bossRules.js';
import { ENEMY_ATTACK_BONUS, enemyMaxHealth } from '../data/combatRules.js';

const libraryCards = [...MONSTER_CATALOG, BOSS_BY_ID[FINAL_BOSS_ID]];

const monsterEscape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const monsterText = value => monsterEscape(localizeGameText(value));
export class MonsterLibrary {
  constructor(root) { this.root=root; this.query=''; this.family=''; this.scroll=0; }
  image(monster, large=false) {
    return `<div class="monster-art${large?' monster-art--large':''}"><img src="${monsterEscape(monster.image)}" alt="${monsterText(monster.name)}魔物牌图片" ${large?'':'loading="lazy"'} /><span class="monster-image-fallback" hidden>暂无图像<br>${monsterText(monster.name)}</span></div>`;
  }
  bindImages() {
    this.root.querySelectorAll('.monster-art img').forEach(img=>{
      const failed=()=>{img.hidden=true; img.nextElementSibling.hidden=false;};
      img.addEventListener('error',failed,{once:true});
      if (img.complete && !img.naturalWidth) failed();
    });
  }
  render(game) {
    const id=game.monsterId;
    if (game.battleInfoRestricted) {
      if (id) return this.renderDetail(game,game.currentMonsterIds.includes(id) ? MONSTER_BY_ID[id] || BOSS_BY_ID[id] : null);
      const items=game.currentMonsterIds.map(id=>MONSTER_BY_ID[id] || BOSS_BY_ID[id]).filter(Boolean);
      this.root.innerHTML=`<main class="game-shell monster-library"><header class="monster-heading"><div><p class="eyebrow">战斗情报</p><h1>本关怪物</h1><p>仅展示当前关卡的 ${items.length} 种怪物，可查看图片与技能。</p></div><button class="text-button" data-library-exit>返回${game.libraryReturn === 'combat' ? '战斗' : game.libraryReturn === 'map' && game.currentMonsterIds.length ? '关卡预览' : '游戏'}</button></header><section class="monster-grid" aria-label="本关怪物卡牌">${items.length ? this.cards(items) : '<p class="monster-empty">请在地图中选择一个战斗关卡，点击怪物下方的“技能详情”查看本关资料；战斗中也可查看。</p>'}</section></main>`;
      this.root.querySelector('[data-library-exit]').addEventListener('click',()=>game.closeMonsterLibrary());
      this.bindImages(); window.scrollTo(0,0); return;
    }
    if (id) return this.renderDetail(game,MONSTER_BY_ID[id] || BOSS_BY_ID[id]);
    this.root.innerHTML=`<main class="game-shell monster-library">
      <header class="monster-heading"><div><p class="eyebrow">观测绘本 · 七圣召唤</p><h1>魔物图鉴</h1><p>61 张普通怪物牌 + 1 张最终首领 牌 · ${game.canStartMonsterTrial ? '查看技能，进入试战。' : '查看技能；冒险开始后不可进入试战。'}</p></div><button class="text-button" data-library-exit>返回游戏</button></header>
      <div class="monster-filters"><label>搜索名称或技能<input id="monster-search" type="search" placeholder="例如：吞星之鲸、蓄势" value="${monsterEscape(this.query)}" /></label><label>怪物类别<select id="monster-family"><option value="">全部类别</option>${[...new Set([...libraryCards,...RANDOM_BOSS_CANDIDATES].map(m=>m.family))].map(f=>`<option value="${monsterEscape(f)}" ${this.family===f?'selected':''}>${monsterText(f)}</option>`).join('')}</select></label></div>
      <p class="monster-source-note">按参考页面“魔物牌”目录收录，包含芒／荒变体。原卡图片保存在本地，技能数值与机制另列游戏改编说明。</p>
      <p id="monster-count" role="status"></p><section class="monster-grid" aria-label="怪物卡牌"></section>
      <details class="boss-candidates"><summary>前两层首领 候选 · 30 位（独立首领资料，不计入普通牌数量）</summary><p class="monster-source-note">每局抽取两位不同首领；吞星之鲸固定守卫第 3 层。<a href="https://baike.mihoyo.com/ys/obc/channel/map/231/233" target="_blank" rel="noopener noreferrer">查看角色牌来源目录</a></p><section class="monster-grid boss-candidate-grid" aria-label="首领候选"></section></details>
      <footer class="monster-source-note"><a href="https://baike.mihoyo.com/ys/obc/channel/map/231/235" target="_blank" rel="noopener noreferrer">查看观测枢原目录</a> · 核对日期：2026-10-29</footer></main>`;
    const update=()=>{
      const query=this.query.trim().toLocaleLowerCase();
      const matches=m=>(!this.family || m.family===this.family) && (!query || localizeGameText(`${m.name} ${m.skills.map(s=>s.name).join(' ')}`).toLocaleLowerCase().includes(query));
      const items=libraryCards.filter(matches), bosses=RANDOM_BOSS_CANDIDATES.filter(matches);
      this.root.querySelector('#monster-count').textContent=`显示 ${items.length} / 62 张（普通牌 61 + 最终首领 1）；匹配首领候选 ${bosses.length} / 30 位`;
      this.root.querySelector('.monster-grid').innerHTML=this.cards(items);
      this.root.querySelector('.boss-candidate-grid').innerHTML=this.cards(bosses,true);
      if(query || this.family==='BOSS 候选') this.root.querySelector('.boss-candidates').open=true;
      this.root.querySelectorAll('[data-monster-card]').forEach(a=>a.addEventListener('click',()=>{this.scroll=window.scrollY;}));
      this.bindImages();
    };
    this.root.querySelector('#monster-search').addEventListener('input',e=>{this.query=e.target.value; update();});
    this.root.querySelector('#monster-family').addEventListener('change',e=>{this.family=e.target.value; update();});
    this.root.querySelector('[data-library-exit]').addEventListener('click',()=>game.closeMonsterLibrary());
    update(); window.scrollTo(0,this.scroll);
  }
  cards(items,boss=false) {
    return items.length?items.map(m=>`<a class="monster-card${boss?' boss-candidate-card':''}" href="#monsters/${m.id}" data-monster-card="${m.id}">${this.image(m)}<div class="monster-card-copy"><span>${monsterText(m.family)} · ${elementChineseLabel(m.element)}</span><h2>${monsterText(m.name)}</h2><p>${m.skills.length} 条技能与机制 <b aria-hidden="true">↗</b></p></div></a>`).join(''):'<p class="monster-empty">没有找到匹配的怪物。请尝试其他名称或清除筛选。</p>';
  }
  renderDetail(game,monster) {
    const returnLabel = game.libraryReturn === 'combat' ? '战斗' : game.libraryReturn === 'map' && game.currentMonsterIds.length ? '关卡预览' : '游戏';
    if (!monster) {
      this.root.innerHTML=`<main class="game-shell monster-library"><a class="text-button" href="#monsters">← 返回${game.battleInfoRestricted?'本关怪物':'怪物列表'}</a><button class="text-button" data-library-exit>返回${returnLabel}</button><h1>${game.battleInfoRestricted?'本关无此怪物':'未找到这只怪物'}</h1><p>${game.battleInfoRestricted?'冒险开始后仅可查看所选关卡或当前战斗中的怪物信息。':'链接中的怪物编号不存在，请返回图鉴选择。'}</p></main>`;
      this.root.querySelector('[data-library-exit]').addEventListener('click',()=>game.closeMonsterLibrary()); return;
    }
    const rules=MONSTER_RULES[monster.id] || BOSS_RULES[monster.id] || [];
    const bossDefinition=BOSS_ENEMY_DEFINITIONS[monster.id];
    this.root.innerHTML=`<main class="game-shell monster-library"><nav class="monster-nav"><a class="text-button" href="#monsters">← 返回${game.battleInfoRestricted ? "本关怪物" : "怪物列表"}</a><button class="text-button" data-library-exit>返回${returnLabel}</button></nav>
      <section class="monster-detail-hero">${this.image(monster,true)}<div><p class="eyebrow">${monsterText(monster.family)} · ${elementChineseLabel(monster.element)}元素</p><h1 tabindex="-1">${monsterText(monster.name)}</h1><p>${monsterText(monster.summary || '来源未提供额外简介。')}</p><dl class="monster-attributes">${monster.attributes.map(a=>`<div><dt>${monsterText(a.key)}</dt><dd>${monsterText(a.value.join('、'))}</dd></div>`).join('')}</dl>${game.canStartMonsterTrial ? '<button class="primary-button" data-monster-trial>进入试战</button><p class="monster-source-note">试战使用独立队伍，仅在正式冒险开始前开放。</p>' : '<p class="monster-source-note">冒险开始后仅可查看怪物资料，不可进入试战。</p>'}<p class="monster-source-note">${monsterText(monster.imageCredit)}</p><a href="${monsterEscape(monster.sourceUrl)}" target="_blank" rel="noopener noreferrer">查看该怪物原始词条 ↗</a></div></section>
      <section class="monster-adaptation"><h2>本游戏的战斗方式</h2><p>沿用派蒙卡牌战斗：技能伤害按来源数值的 2 倍适配，${bossDefinition?`首领生命 ${enemyMaxHealth(bossDefinition.maxHealth)}（在原游戏适配生命基础上翻倍，最终首领 192）。采用七圣召唤形态；自行巧局变体与可选天赋分开列出，不自动装备。`:'生命按来源的 3 倍适配（最低 24）后再翻倍，最低 48。'}所有敌人每段非零伤害额外增加 ${ENEMY_ATTACK_BONUS} 点，包括技能、准备技、被动追击、召唤物和穿透伤害，再结算虚弱与元素反应；下方逐技能说明列出加伤前的基础数值。主动技能按顺序轮换，蓄力动作独立占用回合；技能提前显示意图。召唤物在敌方回合结束结算。前后台、距离与范围效果以单个派蒙目标及护盾／穿透伤害近似；充能以轮换和蓄势近似。原页面未提供动作秒数，采用现有攻击动画。</p></section>
      ${monster.sourceIssues.length?`<aside class="monster-source-note">${monster.sourceIssues.map(monsterText).join('<br>')}</aside>`:''}
      ${hasTransliteratedSkill(monster)?'<p class="monster-source-note">丘丘语技能名以中文音译显示，技能内容与原词条一一对应。</p>':''}<section aria-label="全部技能"><h2>技能与机制 <small>共 ${monster.skills.length} 条</small></h2><div class="monster-skills">${monster.skills.length?monster.skills.map(s=>`<article class="monster-skill" id="skill-${s.id}" data-skill-id="${s.id}"><span class="eyebrow">${monsterText([s.mode,s.type || '技能'].filter(Boolean).join(' · '))}</span><h3>${monsterText(s.name)}</h3><p>${monsterText(s.description || '来源未提供技能说明。')}</p>${s.notes.length?`<details><summary>相关状态与准备技能说明（${s.notes.length}）</summary>${s.notes.map(n=>`<p>${monsterText(n)}</p>`).join('')}</details>`:''}<div class="monster-skill-adaptation"><strong>游戏内表现</strong><p>${monsterText(rules.find(r=>r.skillId===s.id)?.adaptation || '尚无可确认的行为数据，未加入战斗。')}</p></div></article>`).join(''):'<p class="monster-empty">来源暂无技能数据。</p>'}</div></section></main>`;
    this.root.querySelector('[data-library-exit]').addEventListener('click',()=>game.closeMonsterLibrary());
    this.root.querySelector('[data-monster-trial]')?.addEventListener('click',()=>game.startMonsterTrial(monster.id));
    this.bindImages(); window.scrollTo(0,0); this.root.querySelector('h1').focus({preventScroll:true});
  }
}
