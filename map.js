export const WEATHER_OPTIONS = [
  { id: "wind", name: "高天之风", description: "首张妙想牌费用减少1点" },
  { id: "rain", name: "细雨漫游", description: "部分敌人初始附着水元素" },
  { id: "storm", name: "远雷将至", description: "雷元素与感电效果更活跃" },
  { id: "clear", name: "晴空巡礼", description: "事件与宝箱奖励略微增加" },
];

export const MAP_ROUTES = [
  { id: "upper", y: 20, nodes: [
  { id: "meadow", name: "望风山地", kind: "battle" },
  { id: "lake", name: "望风角", kind: "battle" },
  { id: "ruins", name: "千风神殿", kind: "emergency" },
  { id: "north_anchor", name: "天衡山", kind: "anchor" },
  { id: "ridge", name: "归离原", kind: "battle" },
  { id: "old_tower", name: "孤云阁", kind: "emergency" },
  { id: "upper_gate", name: "鸣神大社", kind: "battle" },
  ] },
  { id: "middle", y: 50, nodes: [
  { id: "camp", name: "风起地", kind: "battle" },
  { id: "riverbank", name: "蒙德城", kind: "battle" },
  { id: "seelie", name: "摘星崖", kind: "event" },
  { id: "windfield", name: "荻花洲", kind: "battle" },
  { id: "anchor", name: "望舒客栈", kind: "anchor" },
  { id: "elite", name: "遁玉陵", kind: "emergency" },
  { id: "central_guard", name: "白狐之野", kind: "battle" },
  ] },
  { id: "lower", y: 80, nodes: [
  { id: "shore", name: "清泉镇", kind: "battle" },
  { id: "sandbar", name: "达达乌帕谷", kind: "battle" },
  { id: "shrine_event", name: "晨曦酒庄", kind: "event" },
  { id: "south_anchor", name: "石门", kind: "anchor" },
  { id: "grotto", name: "渌华池", kind: "battle" },
  { id: "lookout", name: "灵矩关", kind: "emergency" },
  { id: "lower_gate", name: "甘金岛", kind: "battle" },
  ] },
];

export const MAP_NODE_DEFINITIONS = [
  { id: "start", name: "鹰翔海滩", kind: "start", x: 4, y: 50, links: MAP_ROUTES.map((route) => route.nodes[0].id) },
  ...MAP_ROUTES.flatMap((route) => route.nodes.map((node, index) => ({
    ...node, route: route.id, x: 14 + index * 10, y: route.y,
    links: [route.nodes[index + 1]?.id ?? "core_guard"],
  }))),
  { id: "core_guard", name: "稻妻城", kind: "battle", x: 85, y: 50, links: ["boss"] },
  { id: "boss", name: "天守阁", kind: "boss", x: 95, y: 50, links: [] },
];

export const NODE_LABELS = {
  start: "起点",
  battle: "战斗",
  emergency: "紧急战斗",
  event: "事件",
  treasure: "宝箱",
  shop: "商店",
  anchor: "锚点",
  boss: "首领",
};
