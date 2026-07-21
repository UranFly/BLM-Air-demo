import type { AirspaceZone, Area, Dock, Drone, LayerState, Obstacle, RiskZone, Route, Task, Point } from "../types";

export type SemanticVisibility = {
  water: boolean;
  wetland: boolean;
  scienceCity: boolean;
  logistics: boolean;
  urbanCore: boolean;
  roads: boolean;
  markers: boolean;
};

type MapCanvasProps = {
  areas: Area[];
  airspaceZones: AirspaceZone[];
  obstacles: Obstacle[];
  riskZones: RiskZone[];
  docks: Dock[];
  drones: Drone[];
  routes?: Route[];
  selectedRouteId?: string;
  activeTask?: Task;
  activeDronePosition?: Point;
  enabledLayers: LayerState;
  temporaryControlActive?: boolean;
  basemap?: "simulation" | "semantic-xinglong";
  semanticVisibility?: SemanticVisibility;
};

function pointsToString(points: Point[]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

const resourceStatusLabel: Record<Dock["status"] | Drone["status"], string> = {
  available: "可用",
  busy: "忙碌",
  maintenance: "维护中",
  charging: "充电中",
  executing: "执行中",
  offline: "离线"
};

const obstacleTypeLabel: Record<Obstacle["type"], string> = {
  building: "建筑物",
  tower: "塔体",
  powerline: "电力设施",
  unknown: "未知障碍物"
};

export function MapCanvas({
  areas,
  airspaceZones,
  obstacles,
  riskZones,
  docks,
  drones,
  routes = [],
  selectedRouteId,
  activeTask,
  activeDronePosition,
  enabledLayers,
  temporaryControlActive = false,
  basemap = "simulation",
  semanticVisibility
}: MapCanvasProps) {
  const activeLayers = Object.values(enabledLayers).filter(Boolean).length;
  const selectedRoute = routes.find((route) => route.id === selectedRouteId);
  const showSemanticBasemap = basemap === "semantic-xinglong";
  const semantic = semanticVisibility ?? {
    water: true,
    wetland: true,
    scienceCity: true,
    logistics: true,
    urbanCore: true,
    roads: true,
    markers: true
  };

  return (
    <div className={`map-shell ${showSemanticBasemap ? "map-shell--semantic" : ""}`}>
      <div className="map-hud">
        <div>
          <span>低空世界模型</span>
          <strong>{activeTask?.title ?? "城市低空模拟域"}</strong>
        </div>
        <div className="map-hud-metrics">
          <span>{activeLayers} 层语义图层</span>
          <span>{drones.filter((drone) => drone.status === "available").length} 架可用无人机</span>
          <span>{selectedRoute ? `当前航线 ${selectedRoute.riskScore}` : "待规划航线"}</span>
          <span>{showSemanticBasemap ? "兴隆湖语义底图" : "模拟低空域"}</span>
        </div>
      </div>
      <svg className="map-canvas" viewBox="0 0 1000 700" role="img" aria-label="模拟低空世界地图">
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(148, 163, 184, 0.12)" strokeWidth="1" />
          </pattern>
        </defs>
        {showSemanticBasemap ? (
          <g className="semantic-basemap">
            <rect width="1000" height="700" fill="url(#grid)" />
            {semantic.water && <path className="semantic-water" d="M 250 165 C 390 50 610 68 755 170 C 890 265 900 430 755 535 C 600 648 345 630 205 500 C 75 378 105 260 250 165 Z" />}
            {semantic.wetland && <path className="semantic-wetland" d="M 120 105 C 210 58 365 72 455 132 L 415 265 C 310 238 205 260 120 330 Z" />}
            {semantic.scienceCity && <path className="semantic-science-city" d="M 690 92 L 940 120 L 905 286 L 715 248 Z" />}
            {semantic.logistics && <path className="semantic-logistics" d="M 702 492 L 932 524 L 900 664 L 675 646 Z" />}
            {semantic.urbanCore && <path className="semantic-urban" d="M 430 300 L 690 284 L 740 512 L 420 540 Z" />}
            {semantic.roads && (
              <>
                <path className="semantic-parkway" d="M 90 374 C 260 314 430 310 604 356 C 742 392 848 472 930 586" />
                <path className="semantic-parkway semantic-parkway--secondary" d="M 180 640 C 310 520 470 455 650 426 C 775 406 875 364 940 292" />
                <path className="semantic-parkway semantic-parkway--secondary" d="M 96 172 C 230 242 405 268 560 228 C 690 194 810 160 928 170" />
              </>
            )}
            {semantic.markers && <g className="semantic-zone-tags">
              {semantic.wetland && <g transform="translate(205 142)">
                <circle r="19" />
                <text y="6">巡</text>
              </g>}
              {semantic.scienceCity && <g transform="translate(820 168)">
                <circle r="19" />
                <text y="6">急</text>
              </g>}
              {semantic.logistics && <g transform="translate(820 588)">
                <circle r="19" />
                <text y="6">配</text>
              </g>}
              {semantic.urbanCore && <g transform="translate(560 438)">
                <rect x="-32" y="-15" width="64" height="30" rx="15" />
                <text y="6">核心</text>
              </g>}
            </g>}
          </g>
        ) : (
          <rect width="1000" height="700" fill="url(#grid)" />
        )}

        {enabledLayers.spatial &&
          areas.map((area) => (
            <polygon key={area.id} points={pointsToString(area.polygon)} className={`map-area map-area--${area.type}`}>
              <title>{`${area.name}：${area.description}`}</title>
            </polygon>
          ))}

        {enabledLayers.airspace &&
          airspaceZones.map((zone) => (
            <polygon
              key={zone.id}
              points={pointsToString(zone.polygon)}
              className={`map-airspace map-airspace--${zone.type} ${zone.id === "temporary-control" && temporaryControlActive ? "is-active" : ""}`}
            >
              <title>{`${zone.name}：${zone.description}`}</title>
            </polygon>
          ))}

        {enabledLayers.risks &&
          riskZones.map((zone) => (
            <polygon key={zone.id} points={pointsToString(zone.polygon)} className={`map-risk map-risk--${zone.riskLevel}`}>
              <title>{`${zone.name}：${zone.description}`}</title>
            </polygon>
          ))}

        {(!showSemanticBasemap || semantic.urbanCore) &&
          obstacles.map((obstacle) => (
            <g key={obstacle.id} className={`map-obstacle map-obstacle--${obstacle.riskLevel}`}>
              {obstacle.width && obstacle.height ? (
                <rect x={obstacle.position.x} y={obstacle.position.y} width={obstacle.width} height={obstacle.height} rx="8" />
              ) : (
                <circle cx={obstacle.position.x} cy={obstacle.position.y} r={obstacle.radius ?? 16} />
              )}
              <title>{`${obstacle.name}：${obstacleTypeLabel[obstacle.type]}`}</title>
            </g>
          ))}

        {routes.map((route) => (
          <polyline
            key={route.id}
            points={pointsToString(route.waypoints)}
            className={`map-route map-route--${route.type} ${selectedRouteId === route.id ? "is-selected" : ""}`}
          >
            <title>{`${route.name}：风险评分 ${route.riskScore}`}</title>
          </polyline>
        ))}

        {enabledLayers.resources &&
          docks.map((dock) => (
            <g key={dock.id} className={`map-dock map-dock--${dock.status}`}>
              <rect x={dock.position.x - 14} y={dock.position.y - 14} width="28" height="28" rx="5" />
              {!showSemanticBasemap && <text x={dock.position.x + 18} y={dock.position.y + 5}>{dock.name}</text>}
              <title>{`${dock.name}：${resourceStatusLabel[dock.status]}`}</title>
            </g>
          ))}

        {enabledLayers.resources &&
          drones.map((drone) => (
            <g key={drone.id} className={`map-drone map-drone--${drone.status}`}>
              <circle cx={drone.position.x} cy={drone.position.y} r="11" />
              <path d={`M ${drone.position.x} ${drone.position.y - 18} l 8 18 h -16 z`} />
              <title>{`${drone.name}：${resourceStatusLabel[drone.status]}，电量 ${drone.battery}%`}</title>
            </g>
          ))}

        {activeTask?.targetPoint && enabledLayers.tasks && (
          <g className="map-target">
            <circle cx={activeTask.targetPoint.x} cy={activeTask.targetPoint.y} r="14" />
            <text x={activeTask.targetPoint.x + 18} y={activeTask.targetPoint.y + 5}>任务点</text>
          </g>
        )}

        {activeDronePosition && (
          <g className="map-active-drone">
            <circle cx={activeDronePosition.x} cy={activeDronePosition.y} r="16" />
            <circle cx={activeDronePosition.x} cy={activeDronePosition.y} r="5" />
          </g>
        )}
      </svg>
      <div className="map-caption">
        <span>
          {showSemanticBasemap
            ? "成都兴隆湖语义底图 · 湖体、科学城、湿地、配送区与任务语义一一对应"
            : "模拟坐标系 0-1000 / 0-700 · 无真实地图服务"}
        </span>
        <div className="map-legend">
          <span><i className="legend-dot legend-dot--cyan" /> 推荐路线</span>
          <span><i className="legend-dot legend-dot--amber" /> 风险/限飞</span>
          <span><i className="legend-dot legend-dot--green" /> 可用资源</span>
          <span><i className="legend-dot legend-dot--violet" /> 备用/重规划</span>
        </div>
      </div>
      {showSemanticBasemap && (
        <div className="map-attribution">
          成都兴隆湖语义底图 · 非真实测绘底图 · 用于保证任务、资源、风险和航线语义一致
        </div>
      )}
    </div>
  );
}
