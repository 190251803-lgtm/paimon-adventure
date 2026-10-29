import { elementChineseLabel } from './chineseText.js';
import { MONSTER_CATALOG } from './monsterCatalog.js';

export const MONSTER_ELEMENTS = { 火: 'pyro', 水: 'hydro', 冰: 'cryo', 雷: 'electro', 风: 'anemo', 岩: 'geo', 草: 'dendro', 物理: null };
export function monsterDamage(text) {
  const match = text.match(/造成(\d+)点(?:的)?(物理|[火水冰雷风岩草]元素)伤害/);
  return match ? { value: Number(match[1]) * 2, element: MONSTER_ELEMENTS[match[2].replace('元素', '')] } : { value: 0, element: null };
}

const PASSIVE_ADAPTATIONS = {
  精妙伪装: '每个敌方回合有三分之一概率获得1点蓄势；用概率事件近似三选一辨认。每点蓄势使下一次攻击+2伤害。',
  浊水变化: '免疫冻结；生命不超过一半时攻击+4，否则每次攻击追加2点穿透伤害。单个派蒙目标代替后台群体。',
  嗜魔: '受到自身元素伤害时叠层；两层后自身攻击+2，同时受到该元素伤害+4。',
  厄灵之能: '生命不超过70%时，每回合首次受伤获得1点蓄势，强化下次攻击。',
  标准外甲: '物理伤害减半，向上取整。',
  元素汲取: '吸收首次受到的元素；同元素后续伤害减半；能量洪流转换为吸收的元素并+2伤害。',
  战备补给: '开战获得2点蓄势，下一次攻击额外造成4点伤害，近似初始充能。',
  岩石大盾: '前3次受击减伤4，岩元素攻击额外消耗一次；盾量耗尽后失效。',
  原木大盾: '初始获得12点独立护甲；耗尽失效，用有限护甲近似元素大盾。',
  寒冰大盾: '初始获得12点独立护甲；耗尽失效，用有限护甲近似元素大盾。',
  状态转换: '有翼形态初始减伤2，陆行形态初始攻击+2；火攻击使加成消失，雷攻击改为每回合获得1点蓄势。',
  残心: '每次行动结束获得1点蓄势，下一次攻击+2，近似回合充能。',
  躲起来: '攻击后获得4点护盾，近似后撤换位；本游戏不设前后台角色。',
  流焰磨刃: '前3次物理攻击转换为火元素。',
  流煌磨刃: '前3次物理攻击转换为雷元素。',
  '惟神召符·煌': '前3次物理攻击转换为雷元素。',
  '惟神召符·炎': '前3次物理攻击转换为火元素。',
  绝境狂乱: '其他海乱鬼被击倒后，下次行动前治疗自身6点并恢复3次附魔。',
};
export function passiveAdaptation(skill) {
  if (PASSIVE_ADAPTATIONS[skill.name]) return PASSIVE_ADAPTATIONS[skill.name];
  if (skill.name.startsWith('元素沉积')) return '免疫自身元素；水元素生命保持固有水附着。遵循本项目规则，其他元素反应后清除附着；冰元素生命免疫冻结。';
  if (skill.name.startsWith('厄灵解放')) return '生命首次不超过70%时获得1点蓄势，并在2次行动内获得元素附魔、攻击+2与同元素易伤+4。';
  if (skill.name.startsWith('支援单位')) return '派蒙每打出3张牌，警戒机关追加2点对应元素伤害。';
  if (skill.name.startsWith('能源特征')) return '本项目无荒芒卡牌：任意元素反应均近似一次荒芒冲击，使机关跳过一次行动，随后2次行动改为物理伤害。';
  if (skill.name === '机体强化·荒') return '全体存活敌人攻击+2；能量强化后再+2。';
  if (skill.name === '机体修复·芒') return '每次友方行动后治疗受伤最多的敌人2点；能量强化后治疗4点。';
  if (skill.name.endsWith('元素护罩')) return '开战获得16点独立护甲；耗尽后跳过一次行动，近似可破除的元素护罩。冰护罩存在时免疫冻结。';
  throw new Error(`未配置的被动技能： ${skill.name}`);
}
export function compileMonsterSkill(monster, skill) {
  if (skill.type === '被动技能') return { skillId: skill.id, passive: true, adaptation: passiveAdaptation(skill) };
  const text = skill.description;
  const damage = monsterDamage(text);
  const rule = { skillId: skill.id, label: skill.name, type: damage.value ? 'attack' : 'defend', ...damage, block: 0, effects: [], prepared: [] };
  // Prepared moves are taken only from this monster's own linked note, never another entry.
  for (const note of skill.notes) {
    const match = note.match(/^(.+?)：(?:元素战技|元素爆发)（需准备(\d+)个行动轮）/);
    if (match) rule.prepared.push({ label: match[1], wait: Number(match[2]), ...monsterDamage(note), skillId: skill.id });
  }
  if (/提供2点护盾|盾牌格挡|聚风屏障/.test(text + skill.notes.join(''))) rule.block = 4;
  for (const summon of monster.skills.filter(s => s.type === '召唤物')) {
    if (skill.id !== summon.id && text.includes(summon.name)) rule.effects.push({ type: 'summon', skillId: summon.id, label: summon.name, ...monsterDamage(summon.description), turns: Number(summon.description.match(/可用次数：(\d+)/)?.[1] || 2), heal: /治疗/.test(summon.description) ? 2 : 0, armor: summon.name === '厄灵·岩之魔蜥' ? 4 : 0, aura: summon.name === '治疗之雨' ? 'hydro' : null });
  }
  if (/唤雷法杖|侵蚀|追踪爆弹|藤蔓/.test(text)) rule.effects.push({ type: 'summon', label: text.match(/唤雷法杖|侵蚀|追踪爆弹|藤蔓/)[0], value: /追踪爆弹/.test(text) ? 4 : 2, element: /唤雷/.test(text) ? 'electro' : /藤蔓/.test(text) ? 'dendro' : null, turns: /侵蚀/.test(text) ? 1 : 2, piercing: /侵蚀/.test(text) });
  if (/咕噜水泡|附属水泡/.test(text)) rule.effects.push({ type: 'disrupt', value: 1 });
  if (/治疗2个/.test(text)) rule.effects.push({ type: 'heal', value: 2 });
  if (/元素武装|岩土台座/.test(text)) rule.effects.push({ type: 'armor', value: 8 });
  if (/能量强化/.test(text)) rule.effects.push({ type: 'empower' });
  if (/切换到下一个/.test(text)) rule.effects.push({ type: 'block', value: 4 });
  if (/我方\[愚人众\]角色获得/.test(text)) rule.effects.push({ type: 'chargeAll' });
  if (/恢复到原本/.test(text)) rule.effects.push({ type: 'restore' });
  const pierce = text.match(/(?:后台角色|后台敌人|后台敌方角色)造成(\d+)点穿透伤害/);
  if (pierce) rule.effects.push({ type: 'pierce', value: Number(pierce[1]) * 2 });
  rule.adaptation = [damage.value ? `对派蒙造成${damage.value}点${elementChineseLabel(damage.element)}伤害` : '本次行动不直接攻击',
    rule.block ? `获得${rule.block}点护盾` : '',
    ...rule.prepared.map(p=>`准备${p.wait}个行动轮后发动「${p.label}」（${p.value}伤害）`),
    ...rule.effects.map(e=>({ summon:`生成「${e.label}」，持续${e.turns}次敌方回合结束结算`, disrupt:'派蒙下回合星能减少1点，近似水泡控制', heal:'治疗最多2名受伤友军各2点', armor:'获得8点独立护甲', empower:'强化本机的治疗／增伤光环', block:'获得4点护盾，近似换位', chargeAll:'友军各获得1点蓄势', restore:'恢复能源状态', pierce:`对派蒙追加${e.value}点穿透伤害，近似后台范围伤害` }[e.type]))
  ].filter(Boolean).join('；') + '。';
  if (skill.type === '召唤物') rule.adaptation = `由对应技能召唤，敌方回合结束触发；${/治疗/.test(text)?'治疗2点并附水':`造成${damage.value}点伤害`}，次数按来源说明。`;
  return rule;
}

export const MONSTER_RULES = Object.fromEntries(MONSTER_CATALOG.map(m => [m.id, m.skills.map(s => compileMonsterSkill(m,s))]));
export const CATALOG_ENEMY_DEFINITIONS = Object.fromEntries(MONSTER_CATALOG.map(m => [m.id, {
  id: m.id, name: m.name, image: m.image, catalogId: m.id, maxHealth: Math.max(24, Number(m.sourceHealth) * 3),
  monster: m, rules: MONSTER_RULES[m.id],
  permanentElement: m.skills.some(s=>s.name === '元素沉积·水') ? 'hydro' : null,
  immuneElements: m.skills.some(s=>s.name.startsWith('元素沉积')) ? [m.element] : [],
  intents: MONSTER_RULES[m.id].filter(r=>!r.passive && m.skills.find(s=>s.id===r.skillId).type !== '召唤物'),
}]));
