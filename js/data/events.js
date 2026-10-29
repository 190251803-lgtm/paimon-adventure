export const EVENT_DEFINITIONS = [
  { id: "cooking_stall", title: "奇怪的料理摊", text: "一口便携锅正在自己冒泡，旁边的木牌写着：旅行者免费，派蒙半价。", options: [
    { id: "pay", label: "支付15摩拉认真吃饭", description: "恢复12点生命，获得甜甜花酿鸡", requires: { mora: 15 }, effect: { mora: -15, heal: 12, addCard: "sweet_madame" } },
    { id: "taste", label: "先尝一小口", description: "恢复6点生命，饱腹+3", effect: { heal: 6, fullness: 3 } },
    { id: "pack", label: "把食材打包带走", description: "获得应急点心", effect: { addCard: "emergency_snack" } },
  ] },
  { id: "lost_seelie", title: "迷路的仙灵", text: "仙灵绕着派蒙飞了三圈，又朝一处被风吹开的石缝飘去。", options: [
    { id: "follow", label: "跟随仙灵", description: "获得30摩拉和捕风瓶", effect: { mora: 30, addCard: "gust_bottle" } },
    { id: "guide", label: "让派蒙来指路", description: "获得2点灵感并恢复5点生命", effect: { inspiration: 2, heal: 5 } },
    { id: "leave", label: "记下位置后继续前进", description: "获得15摩拉", effect: { mora: 15 } },
  ] },
  { id: "talking_chest", title: "会说话的宝箱", text: "宝箱盖子微微张开：只要回答一个问题，就让你拿走里面的东西。大概。", options: [
    { id: "open", label: "直接打开", description: "受到8点伤害，获得45摩拉", effect: { damage: 8, mora: 45 } },
    { id: "answer", label: "认真回答谜题", description: "获得水元素瓶", effect: { addCard: "hydro_flask" } },
    { id: "compliment", label: "夸它是全提瓦特最漂亮的宝箱", description: "获得派蒙的妙计", effect: { addCard: "bright_idea" } },
  ] },
  { id: "traveler_mirage", title: "旅行者的地脉幻影", text: "熟悉的身影出现在地脉光芒中。派蒙知道那不是真的，却还是停了下来。", options: [
    { id: "reach", label: "伸手触碰幻影", description: "失去10点生命，随机升级一张卡牌", effect: { damage: 10, upgradeRandom: true } },
    { id: "remember", label: "回忆一路上的冒险", description: "获得3点灵感", effect: { inspiration: 3 } },
    { id: "rest", label: "在附近休息", description: "恢复10点生命", effect: { heal: 10 } },
  ] },
];
