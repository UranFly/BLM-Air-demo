import { useMemo, useState } from "react";
import { MapCanvas } from "../components/MapCanvas";
import { StatusBadge } from "../components/StatusBadge";
import { airspaceZones, areas, docks, drones, obstacles, riskZones } from "../data/mockData";
import type { DemoState, Route } from "../types";
import { planRoutes } from "../utils/routePlanner";

type RoutePlanningPageProps = {
  state: DemoState;
  onConfirmRoute: (routes: Route[], selectedRouteId: string) => void;
  goNext: () => void;
  goToTaskPage: () => void;
  goToResourcePage: () => void;
};

const recommendationTone: Record<Route["recommendation"], "active" | "warning" | "danger"> = {
  recommended: "active",
  backup: "warning",
  not_recommended: "danger"
};

const recommendationLabel: Record<Route["recommendation"], string> = {
  recommended: "系统推荐",
  backup: "备用",
  not_recommended: "不推荐"
};

export function RoutePlanningPage({ state, onConfirmRoute, goNext, goToTaskPage, goToResourcePage }: RoutePlanningPageProps) {
  const selectedDock = docks.find((dock) => dock.id === state.selectedDockId);
  const generatedRoutes = useMemo(() => {
    if (!state.activeTask || !selectedDock) return [];
    return state.routes.length > 0 ? state.routes : planRoutes(state.activeTask, selectedDock);
  }, [selectedDock, state.activeTask, state.routes]);
  const defaultRouteId = state.selectedRouteId ?? generatedRoutes.find((route) => route.recommendation === "recommended")?.id ?? generatedRoutes[0]?.id;
  const [localSelectedRouteId, setLocalSelectedRouteId] = useState(defaultRouteId);
  const selectedRouteId = localSelectedRouteId ?? defaultRouteId;
  const selectedRoute = generatedRoutes.find((route) => route.id === selectedRouteId);

  function confirmAndContinue() {
    if (!selectedRouteId) return;
    onConfirmRoute(generatedRoutes, selectedRouteId);
    goNext();
  }

  if (!state.activeTask) {
    return (
      <section className="page-grid page-grid--single">
        <div className="panel panel--wide empty-state">
          <div className="panel-kicker">航线规划</div>
          <h2>航线规划与候选方案页</h2>
          <p className="page-lead">请先解析任务，系统才能生成候选航线。</p>
          <button className="button" onClick={goToTaskPage}>返回任务意图</button>
        </div>
      </section>
    );
  }

  if (!selectedDock) {
    return (
      <section className="page-grid page-grid--single">
        <div className="panel panel--wide empty-state">
          <div className="panel-kicker">航线规划</div>
          <h2>航线规划与候选方案页</h2>
          <p className="page-lead">请先确认无人机与起降点，航线规划需要明确起点资源。</p>
          <button className="button" onClick={goToResourcePage}>返回资源调度</button>
        </div>
      </section>
    );
  }

  return (
    <section className="page-grid">
      <div className="panel panel--wide">
        <div className="panel-kicker">航线规划</div>
        <h2>航线规划与候选方案页</h2>
        <p className="page-lead">系统不是生成一条线，而是在空域、障碍、资源和风险约束下生成可执行方案。</p>

        <div className="route-layout">
          <div className="route-options">
            {generatedRoutes.map((route) => (
              <button
                key={route.id}
                className={`route-card route-card--${route.type} ${route.id === selectedRouteId ? "is-selected" : ""}`}
                onClick={() => setLocalSelectedRouteId(route.id)}
              >
                <div className="route-card-header">
                  <h3>{route.name}</h3>
                  <StatusBadge label={recommendationLabel[route.recommendation]} tone={recommendationTone[route.recommendation]} />
                </div>
                <div className="route-metrics">
                  <span>{route.estimatedDistanceKm} 公里</span>
                  <span>{route.estimatedTimeMin} 分钟</span>
                  <span>风险 {route.riskScore}</span>
                </div>
                <ul className="reason-list">
                  {route.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                </ul>
              </button>
            ))}
          </div>

          <div className="route-map">
            <MapCanvas
              areas={areas}
              airspaceZones={airspaceZones}
              obstacles={obstacles}
              riskZones={riskZones}
              docks={docks}
              drones={drones}
              routes={generatedRoutes}
              selectedRouteId={selectedRouteId}
              activeTask={state.activeTask}
              enabledLayers={state.enabledLayers}
            />
          </div>
        </div>
      </div>

      <aside className="panel">
        <div className="panel-kicker">方案详情</div>
        <h3>{selectedRoute?.name ?? "待选择航线"}</h3>
        {selectedRoute && (
          <div className="recommendation-block">
            <StatusBadge label={recommendationLabel[selectedRoute.recommendation]} tone={recommendationTone[selectedRoute.recommendation]} />
            <div className="route-detail-grid">
              <div>
                <span>预计距离</span>
                <strong>{selectedRoute.estimatedDistanceKm} 公里</strong>
              </div>
              <div>
                <span>预计时间</span>
                <strong>{selectedRoute.estimatedTimeMin} 分钟</strong>
              </div>
              <div>
                <span>风险评分</span>
                <strong>{selectedRoute.riskScore}</strong>
              </div>
              <div>
                <span>航点数量</span>
                <strong>{selectedRoute.waypoints.length}</strong>
              </div>
            </div>
          </div>
        )}
        <button className="button dispatch-confirm" disabled={!selectedRouteId} onClick={confirmAndContinue}>进入风险推演</button>
        <div className="parser-rules">
          <strong>地图标识</strong>
          <span>最短路线：橙色虚线，风险较高</span>
          <span>推荐路线：青色实线，默认选中</span>
          <span>备用路线：紫色虚线，用于异常切换</span>
        </div>
      </aside>
    </section>
  );
}
