import { MAP_NODE_DEFINITIONS, MAP_ROUTES } from "../data/map.js";

export class MapNode {
  constructor(definition, kind) {
    Object.assign(this, definition);
    this.links = [...definition.links];
    this.kind = kind;
    this.status = definition.id === "start" ? "current" : "locked";
  }
}

export class MapEngine {
  constructor(random) {
    this.random = random;
    this.nodes = MAP_NODE_DEFINITIONS.map((definition) => {
      const kind = definition.kind ?? random.pick(definition.allowedKinds);
      return new MapNode(definition, kind);
    });
    for (const route of MAP_ROUTES) {
      const index = random.integer(3, 5);
      const previous = this.getNode(route.nodes[index].id);
      const next = this.getNode(previous.links[0]);
      const x = (previous.x + next.x) / 2;
      const shop = new MapNode({
        id: `shop_${route.id}`, name: x <= 64 ? "璃月港行商" : "离岛行商",
        route: route.id, x, y: route.y, links: [next.id],
      }, "shop");
      previous.links = [shop.id];
      this.nodes.push(shop);
    }
    this.connectBranches();
    this.currentNodeId = "start";
    this.visitedNodeIds = ["start"];
    this.completedNodeIds = new Set();
    this.refreshAvailability();
  }

  connectBranches() {
    // 每一层均可走本分支或相邻分支；商店作为层间停靠点，不跳过主要关卡。
    for (let stage = 0; stage < MAP_ROUTES[0].nodes.length - 1; stage += 1) {
      MAP_ROUTES.forEach((route, lane) => {
        const source = this.getNode(route.nodes[stage].id);
        const ownNext = this.getNode(source.links[0]);
        for (const neighbor of [lane - 1, lane + 1]) {
          const otherRoute = MAP_ROUTES[neighbor];
          if (!otherRoute) continue;
          const otherSource = this.getNode(otherRoute.nodes[stage].id);
          source.links.push(otherSource.links[0]);
          if (ownNext.kind === "shop") ownNext.links.push(otherRoute.nodes[stage + 1].id);
        }
      });
    }
  }

  get currentNode() {
    return this.getNode(this.currentNodeId);
  }

  getNode(nodeId) {
    return this.nodes.find((node) => node.id === nodeId);
  }

  getReachableNodeIds() {
    return this.currentNode.links.filter((nodeId) => !this.completedNodeIds.has(nodeId));
  }

  canMoveTo(nodeId) {
    return this.getReachableNodeIds().includes(nodeId);
  }

  moveTo(nodeId) {
    if (!this.canMoveTo(nodeId)) {
      throw new Error("该地点当前不可到达");
    }
    this.currentNodeId = nodeId;
    this.visitedNodeIds.push(nodeId);
    this.refreshAvailability();
    return this.currentNode;
  }

  completeCurrentNode() {
    if (this.currentNodeId !== "start") {
      this.completedNodeIds.add(this.currentNodeId);
    }
    this.refreshAvailability();
  }

  refreshAvailability() {
    const reachable = new Set(this.getReachableNodeIds());
    this.nodes.forEach((node) => {
      if (node.id === this.currentNodeId) node.status = "current";
      else if (this.completedNodeIds.has(node.id)) node.status = "completed";
      else if (reachable.has(node.id)) node.status = "available";
      else node.status = "locked";
    });
  }
}
