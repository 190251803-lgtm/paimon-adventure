import test from 'node:test';
import assert from 'node:assert/strict';
import { Enemy } from '../js/core/Enemy.js';
import { CombatEngine } from '../js/core/CombatEngine.js';
import { RunState } from '../js/core/RunState.js';
import { Random } from '../js/core/Random.js';
import { getPartner } from '../js/data/partners.js';
import { ENEMY_DEFINITIONS } from '../js/data/enemies.js';
import { monsterHitPlayer, monsterCardPlayed, monsterEndPhase } from '../js/core/MonsterBehavior.js';

function fixture({ intents, skills = [], legacy = false, emergency = false }) {
  const definition = { id: 'damage_test', name: '伤害测试敌人', maxHealth: 100, intents,
    ...(!legacy && { catalogId: 'damage_test', monster: { skills } }) };
  const runState = new RunState({ partner: getPartner('amber'), weather: { id: 'clear' }, seed: 23 });
  runState.player.health = runState.player.maxHealth = 10000;
  const combat = new CombatEngine({ runState, random: new Random(23), enemyIds: [definition.id],
    enemyDefinitions: { [definition.id]: definition }, isEmergency: emergency });
  return { combat, enemy: combat.enemies[0] };
}

test('全部普通怪物和首领的攻击意图按原值向上取整后减半，原始资料不变', () => {
  assert.equal(Object.keys(ENEMY_DEFINITIONS).length, 92);
  for (const definition of Object.values(ENEMY_DEFINITIONS)) {
    const snapshot = JSON.stringify(definition);
    const enemy = new Enemy(definition);
    for (let index = 0; index < definition.intents.length; index++) {
      enemy.intentIndex = index;
      const base = enemy.baseIntent;
      const expected = base.type === 'attack' && base.value > 0 ? Math.ceil(base.value / 2) : base.value;
      assert.equal(enemy.intent.value, expected, `${definition.name} ${base.label}`);
      assert.equal(enemy.intent.value, expected, '重复读取不叠加');
    }
    assert.equal(JSON.stringify(definition), snapshot);
  }
});

test('普通技能、穿透附伤和召唤物每次命中均减半，不重复结算', () => {
  const { combat, enemy } = fixture({ intents: [{ type: 'attack', value: 4, label: '组合技',
    effects: [{ type: 'pierce', value: 3 }, { type: 'summon', label: '召唤攻击', value: 2, turns: 2 }] }] });
  const actions = [...combat.enemyIntentSteps(enemy)];
  assert.equal(enemy.intent.value, 2);
  assert.deepEqual(actions.map(action => action.healthDamage), [2, 2]);
  assert.deepEqual([...monsterEndPhase(combat)].map(action => action.healthDamage), [1]);
  assert.deepEqual([...monsterEndPhase(combat)].map(action => action.healthDamage), [1]);
  assert.deepEqual([...monsterEndPhase(combat)], []);
});

test('准备期间不凭空造成伤害，准备技实际发动时也减半', () => {
  const { combat, enemy } = fixture({ intents: [{ type: 'defend', value: 0, label: '蓄力',
    prepared: [{ value: 8, label: '准备攻击', wait: 2 }] }] });
  const health = combat.player.health;
  assert.equal(enemy.intent.value, 0);
  [...combat.enemyIntentSteps(enemy)];
  assert.equal(enemy.intent.value, 0);
  [...combat.enemyIntentSteps(enemy)];
  assert.equal(combat.player.health, health);
  assert.equal(enemy.intent.value, 4);
  assert.equal([...combat.enemyIntentSteps(enemy)][0].healthDamage, 4);
});

test('支援单位被动追击与浊水变化附伤也各减半', () => {
  const { combat, enemy } = fixture({ skills: [{ name: '支援单位·芒' }, { name: '浊水变化' }],
    intents: [{ type: 'attack', value: 4, label: '攻击' }] });
  assert.deepEqual([...combat.enemyIntentSteps(enemy)].map(action => action.healthDamage), [2, 1]);
  const health = combat.player.health;
  monsterCardPlayed(combat);
  monsterCardPlayed(combat);
  assert.equal(combat.player.health, health);
  monsterCardPlayed(combat);
  assert.equal(combat.player.health, health - 1);
});

test('多段攻击每段减半，紧急战斗原有加2仍叠加', () => {
  for (const emergency of [false, true]) {
    const { combat, enemy } = fixture({ legacy: true, emergency,
      intents: [{ type: 'attack', value: 3, hits: 2, label: '连击' }] });
    assert.deepEqual([...combat.enemyIntentSteps(enemy)].map(action => action.healthDamage),
      emergency ? [3, 3] : [2, 2]);
  }
});

test('减半后按原规则结算虚弱、元素反应、护盾和穿透', () => {
  const { combat, enemy } = fixture({ intents: [{ type: 'attack', value: 7, label: '攻击' }] });
  enemy.weak = 1;
  assert.equal([...combat.enemyIntentSteps(enemy)][0].healthDamage, 3);
  combat.player.block = 4;
  combat.playerAura = { element: 'hydro' };
  const reaction = monsterHitPlayer(combat, enemy, 2, 'pyro', '火伤');
  assert.equal(reaction.absorbed, 2);
  assert.equal(reaction.healthDamage, 0, '2点基础伤害减半后触发蒸发，再被4点护盾吸收');
  combat.player.block = 20;
  assert.equal(monsterHitPlayer(combat, enemy, 2, null, '穿透', { piercing: true }).healthDamage, 1);
  assert.equal(combat.player.block, 20);
});

test('敌人受到超载后保留额外伤害，下一次仍正常攻击', () => {
  for (const [aura, element] of [['electro', 'pyro'], ['pyro', 'electro']]) {
    const { combat, enemy } = fixture({ intents: [{ type: 'attack', value: 4, label: '攻击' }] });
    enemy.element = aura;
    const enemyHealth = enemy.health;
    combat.applyElementalDamage(enemy, 6, element, '超载测试');
    assert.equal(enemy.health, enemyHealth - 11);
    assert.equal(enemy.delayed, 0);
    const playerHealth = combat.player.health;
    combat.endPlayerTurn();
    assert.equal(combat.player.health, playerHealth - 2);
    assert.equal(combat.turn, 2);
  }
});

test('派蒙受到超载不减少下回合星能，冻结控制仍有效', () => {
  for (const [aura, element, expectedDamage, expectedEnergy] of [
    ['electro', 'pyro', 6, 3], ['pyro', 'electro', 6, 3], ['hydro', 'cryo', 1, 2],
  ]) {
    const { combat, enemy } = fixture({ intents: [{ type: 'defend', value: 0, label: '待机' }] });
    combat.playerAura = { element: aura };
    const result = monsterHitPlayer(combat, enemy, 2, element, '反应测试');
    assert.equal(result.healthDamage, expectedDamage);
    combat.endPlayerTurn();
    assert.equal(combat.player.energy, expectedEnergy);
  }
});

test('防御与治疗技能不获得攻击伤害，数值保持原样', () => {
  const { combat, enemy } = fixture({ intents: [{ type: 'defend', value: 0, block: 6, label: '治疗防御',
    effects: [{ type: 'summon', label: '治疗', value: 0, heal: 2, turns: 1 }] }] });
  enemy.health -= 5;
  const health = combat.player.health;
  assert.equal([...combat.enemyIntentSteps(enemy)].some(action => action.type === 'attack'), false);
  assert.deepEqual([...monsterEndPhase(combat)], []);
  assert.equal(combat.player.health, health);
  assert.equal(enemy.block, 6);
  assert.equal(enemy.health, enemy.maxHealth - 3);
});
