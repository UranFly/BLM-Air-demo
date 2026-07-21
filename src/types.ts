export type Point = {
  x: number;
  y: number;
};

export type Area = {
  id: string;
  name: string;
  type: "inspection_area" | "urban_area" | "logistics_zone" | "emergency_zone";
  polygon: Point[];
  description: string;
};

export type AirspaceZone = {
  id: string;
  name: string;
  type: "no_fly" | "restricted" | "height_limit";
  polygon: Point[];
  altitudeLimit?: number;
  description: string;
};

export type Obstacle = {
  id: string;
  name: string;
  type: "building" | "tower" | "powerline" | "unknown";
  position: Point;
  width?: number;
  height?: number;
  radius?: number;
  riskLevel: "low" | "medium" | "high";
};

export type RiskZone = {
  id: string;
  name: string;
  type: "communication_weak" | "weather_risk" | "temporary_control" | "dense_obstacle";
  polygon: Point[];
  riskLevel: "low" | "medium" | "high";
  description: string;
};

export type Dock = {
  id: string;
  name: string;
  position: Point;
  status: "available" | "busy" | "maintenance";
  supportedDroneIds: string[];
};

export type Drone = {
  id: string;
  name: string;
  position: Point;
  status: "available" | "charging" | "executing" | "offline";
  battery: number;
  payloads: Array<"hd_camera" | "thermal" | "speaker" | "delivery_box">;
  currentTaskId?: string;
  homeDockId: string;
  maxRangeKm: number;
  recommendedFor: Array<"inspection" | "emergency" | "delivery">;
};

export type TaskType = "inspection" | "emergency" | "delivery";

export type Task = {
  id: string;
  title: string;
  type: TaskType;
  priority: "normal" | "high" | "critical";
  targetAreaId?: string;
  targetPoint?: Point;
  startDockId?: string;
  endPoint?: Point;
  constraints: string[];
  requiredPayloads: string[];
  deliverables: string[];
  status:
    | "draft"
    | "parsed"
    | "planned"
    | "risk_reviewed"
    | "executing"
    | "event_detected"
    | "replanned"
    | "completed"
    | "reported";
  createdFrom: string;
};

export type Route = {
  id: string;
  name: string;
  taskId: string;
  type: "shortest" | "recommended" | "backup" | "replanned";
  waypoints: Point[];
  estimatedDistanceKm: number;
  estimatedTimeMin: number;
  riskScore: number;
  recommendation: "recommended" | "not_recommended" | "backup";
  reasons: string[];
};

export type RiskItem = {
  id: string;
  taskId: string;
  routeId?: string;
  category:
    | "airspace"
    | "obstacle"
    | "weather"
    | "communication"
    | "battery"
    | "resource"
    | "mission"
    | "compliance";
  level: "low" | "medium" | "high";
  title: string;
  description: string;
  suggestion: string;
  requiresHumanConfirm: boolean;
};

export type DynamicEvent = {
  id: string;
  title: string;
  type: "temporary_control" | "communication_drop" | "battery_low" | "new_priority_task";
  description: string;
  affectedRouteId?: string;
  position?: Point;
  triggered: boolean;
};

export type MissionReport = {
  id: string;
  taskId: string;
  taskTitle: string;
  taskType: TaskType;
  droneId: string;
  routeId: string;
  summary: string;
  startedAt: string;
  completedAt: string;
  flightDistanceKm: number;
  flightTimeMin: number;
  keyFindings: string[];
  riskEvents: string[];
  deliverables: string[];
  dataAssets: string[];
};

export type LayerState = {
  spatial: boolean;
  airspace: boolean;
  resources: boolean;
  risks: boolean;
  tasks: boolean;
  results: boolean;
};

export type DemoState = {
  currentPage: number;
  activeTask?: Task;
  selectedDroneId?: string;
  selectedDockId?: string;
  routes: Route[];
  selectedRouteId?: string;
  riskItems: RiskItem[];
  dynamicEvents: DynamicEvent[];
  activeRouteId?: string;
  executionProgress: number;
  executionStatus: "idle" | "running" | "paused" | "event_detected" | "completed";
  missionReport?: MissionReport;
  enabledLayers: LayerState;
};
