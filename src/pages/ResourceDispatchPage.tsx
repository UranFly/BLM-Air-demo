import { useMemo } from "react";
import { MapCanvas } from "../components/MapCanvas";
import { StatusBadge } from "../components/StatusBadge";
import { airspaceZones, areas, docks, drones, obstacles, riskZones } from "../data/mockData";
import type { DemoState, Dock, Drone } from "../types";
import { recommendResources } from "../utils/resourceMatcher";

type ResourceDispatchPageProps = {
  state: DemoState;
  onConfirmResource: (droneId: string, dockId: string) => void;
  goNext: () => void;
  goToTaskPage: () => void;
};

const statusTone: Record<Drone["status"] | Dock["status"], "idle" | "active" | "warning" | "danger"> = {
  available: "active",
  charging: "warning",
  executing: "warning",
  offline: "danger",
  busy: "warning",
  maintenance: "danger"
};

const statusLabel: Record<Drone["status"] | Dock["status"], string> = {
  available: "可用",
  charging: "充电中",
  executing: "执行中",
  offline: "离线",
  busy: "忙碌",
  maintenance: "维护中"
};

function payloadText(payloads: Drone["payloads"]) {
  const labels: Record<Drone["payloads"][number], string> = {
    hd_camera: "高清相机",
    thermal: "热成像",
    speaker: "喊话器",
    delivery_box: "配送箱"
  };
  return payloads.map((payload) => labels[payload]).join("、");
}

export function ResourceDispatchPage({ state, onConfirmResource, goNext, goToTaskPage }: ResourceDispatchPageProps) {
  const recommendation = useMemo(() => {
    if (!state.activeTask) return undefined;
    return recommendResources(state.activeTask, drones, docks);
  }, [state.activeTask]);

  const selectedDroneId = state.selectedDroneId ?? recommendation?.recommendedDrone?.id;
  const selectedDockId = state.selectedDockId ?? recommendation?.recommendedDock?.id;
  const selectedDrone = drones.find((drone) => drone.id === selectedDroneId);
  const selectedDock = docks.find((dock) => dock.id === selectedDockId);
  const canConfirm = Boolean(selectedDrone && selectedDock);

  function confirmAndContinue() {
    if (!selectedDrone || !selectedDock) return;
    onConfirmResource(selectedDrone.id, selectedDock.id);
    goNext();
  }

  if (!state.activeTask) {
    return (
      <section className="page-grid page-grid--single">
        <div className="panel panel--wide empty-state">
          <div className="panel-kicker">资源调度</div>
          <h2>资源调度页</h2>
          <p className="page-lead">请先在任务意图页解析一个低空任务，系统才能基于任务类型、载荷、电量和距离推荐资源。</p>
          <button className="button" onClick={goToTaskPage}>返回任务意图</button>
        </div>
      </section>
    );
  }

  return (
    <section className="page-grid">
      <div className="panel panel--wide">
        <div className="panel-kicker">资源调度</div>
        <h2>资源调度页</h2>
        <p className="page-lead">系统根据任务类型、载荷需求、无人机状态、电量和空间距离生成可解释的调度建议。</p>

        <div className="dispatch-summary">
          <div>
            <span>当前任务</span>
            <strong>{state.activeTask.title}</strong>
          </div>
          <div>
            <span>推荐无人机</span>
            <strong>{selectedDrone?.name ?? "暂无可用无人机"}</strong>
          </div>
          <div>
            <span>推荐起降点</span>
            <strong>{selectedDock?.name ?? "暂无可用起降点"}</strong>
          </div>
          <div>
            <span>调度状态</span>
            <StatusBadge label={state.selectedDroneId ? "已确认" : "待确认"} tone={state.selectedDroneId ? "done" : "warning"} />
          </div>
        </div>

        <div className="dispatch-layout">
          <div className="resource-list">
            {recommendation?.droneMatches.map((match) => (
              <article
                key={match.drone.id}
                className={`resource-card ${match.drone.id === selectedDroneId ? "is-selected" : ""} ${!match.eligible ? "is-muted" : ""}`}
              >
                <div className="resource-card-header">
                  <div>
                    <h3>{match.drone.name}</h3>
                    <p>{payloadText(match.drone.payloads)}</p>
                  </div>
                  <StatusBadge label={statusLabel[match.drone.status]} tone={statusTone[match.drone.status]} />
                </div>
                <div className="resource-metrics">
                  <span>电量 {match.drone.battery}%</span>
                  <span>航程 {match.drone.maxRangeKm} 公里</span>
                  <span>评分 {Math.round(match.score)}</span>
                </div>
                <ul className="reason-list">
                  {(match.eligible ? match.reasons : match.unavailableReasons).map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="dispatch-map">
            <MapCanvas
              areas={areas}
              airspaceZones={airspaceZones}
              obstacles={obstacles}
              riskZones={riskZones}
              docks={docks}
              drones={drones}
              activeTask={state.activeTask}
              enabledLayers={state.enabledLayers}
            />
          </div>
        </div>
      </div>

      <aside className="panel">
        <div className="panel-kicker">推荐解释</div>
        <h3>{selectedDrone ? selectedDrone.name : "暂无推荐资源"}</h3>
        {selectedDrone && (
          <div className="recommendation-block">
            <StatusBadge label={`电量 ${selectedDrone.battery}%`} tone="active" />
            <p>系统推荐该资源用于当前任务，并保留其他无人机不可用原因，便于调度员解释和复核。</p>
            <span className="column-label">起降点判断</span>
            <ul className="reason-list">
              {recommendation?.dockReasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          </div>
        )}
        <button className="button dispatch-confirm" disabled={!canConfirm} onClick={confirmAndContinue}>确认资源并进入航线规划</button>
        <div className="parser-rules">
          <strong>调度规则</strong>
          <span>巡检：可用、高清相机、电量 &gt;= 50、靠近目标区</span>
          <span>应急：可用、电量 &gt;= 40、距离目标点最近</span>
          <span>配送：可用、配送箱、电量 &gt;= 60、适合配送</span>
        </div>
      </aside>
    </section>
  );
}
