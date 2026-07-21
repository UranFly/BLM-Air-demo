import type { AirspaceZone, Area, Dock, Drone, DynamicEvent, Obstacle, RiskZone } from "../types";

export const areas: Area[] = [
  {
    id: "area-a",
    name: "甲区域：城市巡检区域",
    type: "inspection_area",
    polygon: [
      { x: 110, y: 100 },
      { x: 420, y: 80 },
      { x: 470, y: 280 },
      { x: 180, y: 330 }
    ],
    description: "用于展示城市低空巡检、重点设施覆盖和异常点记录。"
  },
  {
    id: "urban-core",
    name: "城市核心区",
    type: "urban_area",
    polygon: [
      { x: 450, y: 230 },
      { x: 730, y: 220 },
      { x: 760, y: 500 },
      { x: 430, y: 520 }
    ],
    description: "建筑和通信设施密集，是低空约束推演的主要区域。"
  },
  {
    id: "logistics-c",
    name: "丙点：配送目标点",
    type: "logistics_zone",
    polygon: [
      { x: 760, y: 490 },
      { x: 910, y: 520 },
      { x: 900, y: 650 },
      { x: 720, y: 640 }
    ],
    description: "低空小件配送目标区域。"
  },
  {
    id: "event-b",
    name: "乙点：应急事件点",
    type: "emergency_zone",
    polygon: [
      { x: 760, y: 95 },
      { x: 910, y: 120 },
      { x: 890, y: 245 },
      { x: 735, y: 230 }
    ],
    description: "用于模拟突发事件侦察任务。"
  }
];

export const airspaceZones: AirspaceZone[] = [
  {
    id: "no-fly-alpha",
    name: "禁飞区甲",
    type: "no_fly",
    polygon: [
      { x: 520, y: 90 },
      { x: 650, y: 110 },
      { x: 640, y: 250 },
      { x: 500, y: 235 }
    ],
    description: "模拟禁飞区，候选航线需要规避。"
  },
  {
    id: "height-beta",
    name: "限高区乙",
    type: "height_limit",
    altitudeLimit: 120,
    polygon: [
      { x: 250, y: 410 },
      { x: 430, y: 390 },
      { x: 455, y: 560 },
      { x: 270, y: 585 }
    ],
    description: "模拟限高区，用于展示合规约束。"
  },
  {
    id: "temporary-control",
    name: "临时管制区",
    type: "restricted",
    polygon: [
      { x: 600, y: 350 },
      { x: 735, y: 345 },
      { x: 760, y: 465 },
      { x: 620, y: 490 }
    ],
    description: "执行中触发的临时管制区。"
  }
];

export const obstacles: Obstacle[] = [
  { id: "obs-buildings", name: "高层建筑群", type: "building", position: { x: 560, y: 410 }, width: 90, height: 120, riskLevel: "high" },
  { id: "obs-tower", name: "通信塔", type: "tower", position: { x: 675, y: 300 }, radius: 20, riskLevel: "medium" },
  { id: "obs-powerline", name: "电力塔", type: "powerline", position: { x: 330, y: 500 }, width: 120, height: 18, riskLevel: "medium" }
];

export const riskZones: RiskZone[] = [
  {
    id: "risk-comm",
    name: "通信弱覆盖区",
    type: "communication_weak",
    polygon: [
      { x: 650, y: 220 },
      { x: 840, y: 250 },
      { x: 820, y: 385 },
      { x: 630, y: 360 }
    ],
    riskLevel: "medium",
    description: "部分航段需要关键帧回传和链路监测。"
  },
  {
    id: "risk-obstacle",
    name: "密集障碍区",
    type: "dense_obstacle",
    polygon: [
      { x: 470, y: 355 },
      { x: 650, y: 345 },
      { x: 680, y: 530 },
      { x: 455, y: 540 }
    ],
    riskLevel: "high",
    description: "建筑物密度较高，建议绕行或提升安全高度。"
  },
  {
    id: "risk-weather",
    name: "天气风险区",
    type: "weather_risk",
    polygon: [
      { x: 120, y: 455 },
      { x: 245, y: 425 },
      { x: 310, y: 560 },
      { x: 150, y: 620 }
    ],
    riskLevel: "medium",
    description: "模拟阵风或降水导致的飞行稳定性风险。"
  }
];

export const docks: Dock[] = [
  { id: "dock-a", name: "起降点甲", position: { x: 95, y: 365 }, status: "available", supportedDroneIds: ["drone-01", "drone-02"] },
  { id: "dock-b", name: "起降点乙", position: { x: 890, y: 310 }, status: "available", supportedDroneIds: ["drone-03"] },
  { id: "dock-c", name: "起降点丙", position: { x: 620, y: 640 }, status: "maintenance", supportedDroneIds: ["drone-04"] }
];

export const drones: Drone[] = [
  {
    id: "drone-01",
    name: "一号巡检机",
    position: { x: 120, y: 350 },
    status: "available",
    battery: 86,
    payloads: ["hd_camera"],
    homeDockId: "dock-a",
    maxRangeKm: 18,
    recommendedFor: ["inspection", "emergency"]
  },
  {
    id: "drone-02",
    name: "二号热成像机",
    position: { x: 110, y: 390 },
    status: "charging",
    battery: 38,
    payloads: ["thermal", "hd_camera"],
    homeDockId: "dock-a",
    maxRangeKm: 14,
    recommendedFor: ["inspection", "emergency"]
  },
  {
    id: "drone-03",
    name: "三号应急机",
    position: { x: 860, y: 290 },
    status: "executing",
    battery: 63,
    payloads: ["hd_camera", "speaker"],
    currentTaskId: "existing-task",
    homeDockId: "dock-b",
    maxRangeKm: 20,
    recommendedFor: ["emergency"]
  },
  {
    id: "drone-04",
    name: "四号配送机",
    position: { x: 600, y: 615 },
    status: "available",
    battery: 91,
    payloads: ["delivery_box"],
    homeDockId: "dock-c",
    maxRangeKm: 22,
    recommendedFor: ["delivery"]
  }
];

export const dynamicEvents: DynamicEvent[] = [
  {
    id: "event-temporary-control",
    title: "临时管制区出现",
    type: "temporary_control",
    description: "原推荐航线前方出现临时管制，系统需要生成绕行方案。",
    position: { x: 680, y: 420 },
    triggered: false
  }
];
