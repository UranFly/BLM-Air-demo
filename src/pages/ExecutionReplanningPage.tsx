import { useEffect, useMemo, useState } from "react";
import { MapCanvas } from "../components/MapCanvas";
import { StatusBadge } from "../components/StatusBadge";
import { airspaceZones, areas, docks, drones, obstacles, riskZones } from "../data/mockData";
import type { DemoState, DynamicEvent, Route, Task } from "../types";
import { createReplannedRoute, estimateBattery, getCurrentWaypointIndex, getPointAtProgress } from "../utils/executionEngine";

type ExecutionReplanningPageProps = {
  state: DemoState;
  onExecutionUpdate: (
    update: Partial<Pick<DemoState, "executionProgress" | "executionStatus" | "activeRouteId" | "selectedRouteId" | "routes">> & {
      activeTaskStatus?: Task["status"];
      dynamicEvents?: DynamicEvent[];
    }
  ) => void;
  goNext: () => void;
  goToRiskPage: () => void;
};

const executionStatusLabel: Record<DemoState["executionStatus"], string> = {
  idle: "待执行",
  running: "执行中",
  paused: "已暂停",
  event_detected: "事件已触发",
  completed: "已完成"
};

export function ExecutionReplanningPage({ state, onExecutionUpdate, goNext, goToRiskPage }: ExecutionReplanningPageProps) {
  const [pausedBeforeEvent, setPausedBeforeEvent] = useState(false);
  const activeRoute = state.routes.find((route) => route.id === state.activeRouteId) ?? state.routes.find((route) => route.id === state.selectedRouteId);
  const selectedDrone = drones.find((drone) => drone.id === state.selectedDroneId);
  const eventTriggered = state.dynamicEvents.some((event) => event.triggered);
  const dronePosition = activeRoute ? getPointAtProgress(activeRoute, state.executionProgress) : undefined;
  const currentBattery = estimateBattery(selectedDrone?.battery ?? 80, state.executionProgress, eventTriggered);
  const currentWaypoint = activeRoute ? getCurrentWaypointIndex(activeRoute, state.executionProgress) : 0;
  const replannedRoute = useMemo(() => {
    if (!state.activeTask || !activeRoute || !dronePosition) return undefined;
    return createReplannedRoute(state.activeTask, activeRoute, dronePosition);
  }, [activeRoute, dronePosition, state.activeTask]);
  const displayedRoutes = replannedRoute && eventTriggered ? [...state.routes.filter((route) => route.type !== "replanned"), replannedRoute] : state.routes;

  useEffect(() => {
    if (state.executionStatus !== "running") return;

    const timer = window.setInterval(() => {
      const nextProgress = Math.min(100, state.executionProgress + 3);

      if (!eventTriggered && nextProgress >= 45) {
        triggerDynamicEvent();
        return;
      }

      if (nextProgress >= 100) {
        onExecutionUpdate({ executionProgress: 100, executionStatus: "completed", activeTaskStatus: "completed" });
        return;
      }

      onExecutionUpdate({ executionProgress: nextProgress });
    }, 650);

    return () => window.clearInterval(timer);
  }, [eventTriggered, onExecutionUpdate, state.executionProgress, state.executionStatus]);

  function startExecution() {
    onExecutionUpdate({ executionStatus: "running", activeTaskStatus: state.activeTask?.status === "replanned" ? "replanned" : "executing" });
  }

  function pauseExecution() {
    onExecutionUpdate({ executionStatus: "paused" });
  }

  function resumeExecution() {
    onExecutionUpdate({ executionStatus: "running" });
  }

  function resetExecution() {
    const resetEvents = state.dynamicEvents.map((event) => ({ ...event, triggered: false }));
    onExecutionUpdate({
      executionProgress: 0,
      executionStatus: "idle",
      activeRouteId: state.selectedRouteId,
      activeTaskStatus: "risk_reviewed",
      dynamicEvents: resetEvents,
      routes: state.routes.filter((route) => route.type !== "replanned")
    });
    setPausedBeforeEvent(false);
  }

  function triggerDynamicEvent() {
    if (eventTriggered) return;
    const triggeredEvents = state.dynamicEvents.map((event) => (event.type === "temporary_control" ? { ...event, triggered: true, affectedRouteId: activeRoute?.id } : event));
    setPausedBeforeEvent(state.executionStatus === "running");
    onExecutionUpdate({
      executionProgress: Math.max(state.executionProgress, 45),
      executionStatus: "event_detected",
      activeTaskStatus: "event_detected",
      dynamicEvents: triggeredEvents
    });
  }

  function adoptReplannedRoute() {
    if (!replannedRoute) return;
    const routes = [...state.routes.filter((route) => route.type !== "replanned"), replannedRoute];
    onExecutionUpdate({
      routes,
      activeRouteId: replannedRoute.id,
      selectedRouteId: replannedRoute.id,
      executionStatus: pausedBeforeEvent ? "running" : "paused",
      activeTaskStatus: "replanned"
    });
  }

  if (!state.activeTask || !activeRoute) {
    return (
      <section className="page-grid page-grid--single">
        <div className="panel panel--wide empty-state">
          <div className="panel-kicker">任务执行</div>
          <h2>任务执行与动态重规划页</h2>
          <p className="page-lead">请先完成风险确认，再进入执行仿真。</p>
          <button className="button" onClick={goToRiskPage}>返回风险推演</button>
        </div>
      </section>
    );
  }

  return (
    <section className="page-grid">
      <div className="panel panel--wide">
        <div className="panel-kicker">任务执行</div>
        <h2>任务执行与动态重规划页</h2>
        <p className="page-lead">真实低空环境会动态变化，世界模型需要持续更新并支持重规划。</p>

        <div className="execution-dashboard">
          <div>
            <span>任务进度</span>
            <strong>{state.executionProgress}%</strong>
          </div>
          <div>
            <span>当前状态</span>
            <StatusBadge label={executionStatusLabel[state.executionStatus]} tone={state.executionStatus === "completed" ? "done" : state.executionStatus === "event_detected" ? "warning" : "active"} />
          </div>
          <div>
            <span>当前航点</span>
            <strong>{currentWaypoint} / {activeRoute.waypoints.length}</strong>
          </div>
          <div>
            <span>模拟电量</span>
            <strong>{currentBattery}%</strong>
          </div>
        </div>

        <div className="progress-track">
          <div style={{ width: `${state.executionProgress}%` }} />
        </div>

        <div className="execution-actions">
          <button className="button" disabled={state.executionStatus === "running" || state.executionStatus === "completed"} onClick={startExecution}>开始执行</button>
          <button className="button button--secondary" disabled={state.executionStatus !== "running"} onClick={pauseExecution}>暂停</button>
          <button className="button button--secondary" disabled={state.executionStatus !== "paused"} onClick={resumeExecution}>继续</button>
          <button className="button button--ghost" disabled={eventTriggered || state.executionStatus === "completed"} onClick={triggerDynamicEvent}>触发动态事件</button>
          <button className="button button--secondary" onClick={resetExecution}>重置</button>
        </div>

        <div className="execution-map">
          <MapCanvas
            areas={areas}
            airspaceZones={airspaceZones}
            obstacles={obstacles}
            riskZones={riskZones}
            docks={docks}
            drones={drones}
            routes={displayedRoutes}
            selectedRouteId={state.activeRouteId}
            activeTask={state.activeTask}
            activeDronePosition={dronePosition}
            enabledLayers={state.enabledLayers}
            temporaryControlActive={eventTriggered}
          />
        </div>
      </div>

      <aside className="panel">
        <div className="panel-kicker">动态事件</div>
        <h3>{eventTriggered ? "检测到临时管制区" : "等待环境变化"}</h3>
        {eventTriggered ? (
          <div className="event-card">
            <p>原推荐航线前方风险升高，系统已生成两种方案：</p>
            <ol>
              <li>绕行东侧航线，预计增加飞行距离，风险等级低。</li>
              <li>中止任务并返航，适用于紧急管制。</li>
            </ol>
            <strong>系统推荐：采用绕行方案，需要人工确认。</strong>
            <button className="button dispatch-confirm" disabled={state.activeRouteId?.includes("replanned")} onClick={adoptReplannedRoute}>采用重规划方案</button>
          </div>
        ) : (
          <p>飞行进度达到 45% 时将自动触发临时管制事件，也可以手动触发。</p>
        )}

        {state.executionStatus === "completed" && (
          <div className="event-card event-card--done">
            <strong>任务完成</strong>
            <p>当前任务已完成，可进入结果交付页生成任务报告。</p>
            <button className="button dispatch-confirm" onClick={goNext}>进入结果闭环</button>
          </div>
        )}
      </aside>
    </section>
  );
}
