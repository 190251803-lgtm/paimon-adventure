import { elementChineseLabel } from './chineseText.js';
import { BOSS_CATALOG, FINAL_BOSS_ID } from './bossCatalog.js';
import { compileMonsterSkill, monsterDamage } from './monsterRules.js';

export const BOSS_PASSIVE_ADAPTATIONS = {
  水晶核心:'开场获得一次免于倒下效果，触发时恢复2生命；水滴仍在场时消耗一次水滴恢复核心。水滴在结束阶段优先恢复缺失的核心，否则攻击。',
  前驱气势:'击破派蒙护盾后获得1点蓄势，近似抓牌带来的资源优势。',
  斑斓的绚影:'开场获得6点独立护甲；浮彩技能再获得4点护甲，近似生成并打出浮彩。',
  亡骸饥渴:'开场获得2个能量块；战技补充能量块，爆发消耗能量块以发动准备技能。',
  古老者的血脉:'偶数敌方行动后触发一次金焰形态：2点火伤害及2点穿透伤害。',
  忿恨:'用虚拟敌方牌库记录舍弃数量，每6张累积1层忿恨，每层攻击+2；爆发额外获得1层。',
  分流:'单体首领缺少其他友方召唤物，因此把离场分流近似为：汛波在生命高于2时自伤2点，并在没有存续召唤物时直接产生半幻人；半幻人每次结束阶段造成2水伤，2次后治疗自身4点。',
  圣骸感应:'能量块被消耗时治疗自身2点，爆发每消耗1块再提高最大生命2点。',
  贪食之王:'战技抓取料理以获得随机增益：2点攻击或2点最大生命，并治疗2点；不使用派蒙饱腹资源。',
  攻阵气势:'攻击命中派蒙护盾时获得1层摧岩伟力，后续攻击每层+2（本局最多3层）。',
  雷之新生:'首次被击倒时恢复8生命，之后雷伤害+2。',
  无尽食欲:'敌方使用虚拟牌库；每回合结束吞噬1张虚拟手牌，迸落星雨额外吞噬1张最高费牌。每3张按费用匹配提高最大生命2至6点；星雨每6点额外生命+2伤害（最多+6）。不会删掉玩家的初始牌。',
  '不朽亡骸·风':'开场获得6个能量块；战技增加1块，爆发消耗全部能量块，每2块翻倍一次伤害（本游戏最多翻倍2次）。',
  增殖感召:'战技或爆发以抓取并打出唤醒眷属近似，生成增殖生命体；累计4次后获得2护盾及永久2点增伤。',
  '不朽亡骸·雷':'每次行动结束获得2个能量块；爆发最多消耗3块，生成对应次数的雷锥陷阱。',
  帝王甲胄:'开场获得10点独立蟹壳护甲；战技再增加4点，准备后的爆发消耗全部蟹壳并增伤。',
  水之新生:'首次被击倒时恢复8生命，之后物理攻击转为水元素，水伤害+2。',
  明珠甲胄:'开场获得6点独立明珠护甲；战技补充2点，爆发恢复6点并召唤珊瑚珠。',
  冰晶核心:'开场获得一次免于倒下效果，触发时恢复2生命。',
  雷霆探知:'锁定派蒙为雷鸣探知目标；雷墙与轰雷禁锢始终攻击该目标，近似前后台目标选择。',
  磐岩百相:'记录受到的冰、水、火、雷元素；战技转为最近汲取元素，爆发每种已汲取元素+2伤害。',
  火之新生:'首次被击倒时恢复8生命，之后火伤害+2。',
  雷晶核心:'开场获得一次免于倒下效果，触发时恢复2生命。',
  '魔化：岩盔':'开场获得6点独立护甲；护甲存在时物理攻击转岩，且攻击+2。',
  活化激能:'造成或受到元素伤害后积累活化激能（上限3）；爆发每层+2并清空，回合结束满3层则清空。',
};

function compileBossSkill(boss, skill) {
  if (skill.mode !== '七圣召唤') return {skillId:skill.id,passive:true,adaptation:'来源的自行巧局变体资料；冒险采用同一角色的七圣召唤技能形态，此变体不混入技能轮换。'};
  if (skill.type === '装备牌') return {skillId:skill.id,passive:true,adaptation:'来源的可选天赋装备，完整保留说明；本次首领战未装备此牌，因此不自动获得该装备效果。'};
  if (skill.type === '被动技能') {
    if (!BOSS_PASSIVE_ADAPTATIONS[skill.name]) throw new Error(`未配置的首领被动技能： ${boss.name} / ${skill.name}`);
    return {skillId:skill.id,passive:true,adaptation:BOSS_PASSIVE_ADAPTATIONS[skill.name]};
  }
  const rule = compileMonsterSkill(boss,skill);
  const text = skill.description;
  // Only read preparation notes actually linked by this exact skill.
  for (const note of skill.notes) {
    const match=note.match(/^(.+?)：(元素战技|元素爆发)(?:（需准备(\d+)个行动轮）)?/);
    if (match && text.includes(match[1]) && /准备技能/.test(text) && !rule.prepared.some(p=>p.label===match[1])) {
      rule.prepared.push({label:match[1],wait:Number(match[3]||1),...monsterDamage(note),skillId:skill.id});
    }
  }
  if (/飞旋|高效切换/.test(text)) rule.effects.push({type:'block',value:2});
  if (/浮彩/.test(text)) rule.effects.push({type:'bossArmor',value:4});
  if (/重甲蟹壳/.test(text)) rule.effects.push({type:'bossArmor',value:4});
  if (/原海明珠/.test(text)) rule.effects.push({type:'bossArmor',value:skill.type==='元素爆发'?6:2});
  if (/暗流的诅咒|水泡/.test(text) || skill.type==='特技') rule.effects.push({type:'disrupt',value:1});
  if (/坍毁/.test(text)) rule.effects.push({type:'bossExpose',value:2});
  if (/振荡冲击/.test(text)) rule.effects.push({type:'summon',label:'振荡冲击',value:2,piercing:true,turns:2});
  if (/黄金侵蚀/.test(text)) {
    rule.effects=rule.effects.filter(e=>e.label!=='侵蚀');
    rule.effects.push({type:'summon',label:'黄金侵蚀',value:2,piercing:true,turns:2});
  }
  if (/金焰形态/.test(text)) rule.effects.push({type:'summon',label:'金焰形态',value:2,element:'pyro',turns:1});
  if (/噬骸能量块/.test(text)) rule.effects.push({type:'bossEnergy',value:skill.type==='元素战技'?1:0});
  if (/绿洲之滋养/.test(text)) rule.effects.push({type:'bossProliferate'});
  if (/纯水幻造|林野百态/.test(skill.name)) rule.effects.push({type:'bossMimic',value:skill.name==='林野百态'?2:1});
  if (/触发我方所有/.test(text)) rule.effects.push({type:'bossTriggerSummons'});
  if (/随机触发我方1个/.test(text)) rule.effects.push({type:'bossTriggerSummons',random:true});
  if (/四迸冰锥/.test(text)) rule.effects.push({type:'summon',label:'四迸冰锥',value:2,element:'cryo',turns:2});
  if (skill.name==='秘渊虚霆') rule.effects.push({type:'bossDrain'});
  if (skill.name==='盘绕风引' || skill.name==='低位撩斩') rule.effects.push({type:'bossDraw'});
  if (skill.name==='迸落星雨') rule.effects.push({type:'bossDevour'});
  if (skill.name==='横噬鲸吞') rule.effects=rule.effects.filter(e=>e.label!=='黑色幻影').concat({type:'bossPhantom'});
  if (skill.name==='喷吐草实') rule.effects.push({type:'bossFood'});
  if (/舍弃牌组顶部/.test(text)) rule.effects.push({type:'bossDiscard',value:skill.type==='元素爆发'?3:1});
  if (skill.name==='汛波') rule.effects.push({type:'bossSplit'});
  if (skill.type==='召唤物' && skill.name==='黑色幻影') rule.adaptation='由横噬鲸吞召唤；按虚拟吞噬牌中的最高费用×2造成雷伤害，次数等于最高费用牌数量；受击时减伤2并消耗2次可用次数。';
  else if (skill.type==='召唤物' && skill.name==='半幻人') rule.adaptation='由分流的单体战近似机制产生，每次结束阶段造成2点水伤；共2次，被额外触发也消耗次数，到期治疗水形幻人4点。';
  else if (skill.type==='召唤物' && skill.name==='水滴') rule.adaptation='由危祸之潮召唤，共2次；结束阶段缺失水晶核心时恢复核心，否则造成4点水伤。';
  else if (skill.type!=='召唤物') rule.adaptation = `${rule.value?`基础${rule.value}点${elementChineseLabel(rule.element)}伤害`:'本次不直接攻击'}；${rule.prepared.map(p=>`下次行动准备「${p.label}」（${p.value}点伤害）`).join('；')}${rule.effects.length?'；执行对应的召唤、护甲、资源或状态效果':''}。${BOSS_PASSIVE_ADAPTATIONS[boss.skills.find(s=>s.type==='被动技能'&&s.mode==='七圣召唤')?.name]||''}${/四迸冰锥/.test(text)?'四迸冰锥的换位伤害近似为结束阶段2点冰伤，持续2次。':''}${skill.name==='秘渊虚霆'?'雷附着目标的充能夺取近似为减少派蒙1点灵感并获得1点蓄势。':''}${/低位撩斩|盘绕风引/.test(skill.name)?'抓牌近似为下次攻击获得1点蓄势，飞蛇则补充1个能量块。':''}前后台与距离按单个派蒙目标近似。`;
  return rule;
}

export const BOSS_RULES = Object.fromEntries(BOSS_CATALOG.map(b=>[b.id,b.skills.map(s=>compileBossSkill(b,s))]));
export const BOSS_ENEMY_DEFINITIONS = Object.fromEntries(BOSS_CATALOG.map(b=>[b.id,{
  id:b.id,name:b.name,image:b.image,catalogId:b.id,isBoss:true,monster:b,rules:BOSS_RULES[b.id],
  maxHealth:b.id===FINAL_BOSS_ID?96:Math.max(48,b.sourceHealth*5),
  intents:BOSS_RULES[b.id].filter(r=>!r.passive && b.skills.find(s=>s.id===r.skillId).type!=='召唤物'),
}]));
