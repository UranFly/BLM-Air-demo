import { useMemo, useState } from "react";
import { Header } from "./components/Header";
import { Sidebar, type NavItem } from "./components/Sidebar";
import { WorldOverviewPage } from "./pages/WorldOverviewPage";
import { SemanticLayersPage } from "./pages/SemanticLayersPage";
import { SemanticGenerationPage } from "./pages/SemanticGenerationPage";
import { FlightViewGenerationPage } from "./pages/FlightViewGenerationPage";
import { TaskIntentPage } from "./pages/TaskIntentPage";
import { ResourceDispatchPage } from "./pages/ResourceDispatchPage";
import { RoutePlanningPage } from "./pages/RoutePlanningPage";
import { RiskSimulationPage } from "./pages/RiskSimulationPage";
import { ExecutionReplanningPage } from "./pages/ExecutionReplanningPage";
import { ResultDataLoopPage } from "./pages/ResultDataLoopPage";
import { dynamicEvents } from "./data/mockData";
import type { DemoState, DynamicEvent, LayerState, MissionReport, RiskItem, Route, Task } from "./types";

const navItems: NavItem[] = [
  { id: 0, title: "物理世界重建页", shortTitle: "世界重建" },
  { id: 1, title: "第一视角生成页", shortTitle: "视角生成" },
  { id: 2, title: "低空世界总览", shortTitle: "世界总览" },
  { id: 3, title: "语义图层管理", shortTitle: "语义图层" },
  { id: 4, title: "自然语言任务入口", shortTitle: "任务意图" },
  { id: 5, title: "资源调度页", shortTitle: "资源调度" },
  { id: 6, title: "航线规划与候选方案页", shortTitle: "航线规划" },
  { id: 7, title: "风险推演页", shortTitle: "风险推演" },
  { id: 8, title: "任务执行与动态重规划页", shortTitle: "执行重规划" },
  { id: 9, title: "结果交付与数据闭环页", shortTitle: "结果闭环" }
];

const initialLayers: LayerState = {
  spatial: true,
  airspace: true,
  resources: true,
  risks: true,
  tasks: true,
  results: false
};

function createInitialState(): DemoState {
  return {
    currentPage: 0,
    routes: [],
    riskItems: [],
    dynamicEvents,
    executionProgress: 0,
    executionStatus: "idle",
    enabledLayers: initialLayers
  };
}

function getCompletedPage(state: DemoState): number {
  if (!state.activeTask) return 3;
  if (state.activeTask.status === "reported") return 9;
  if (state.activeTask.status === "completed") return 8;
  if (["executing", "event_detected", "replanned"].includes(state.activeTask.status)) return 7;
  if (state.activeTask.status === "risk_reviewed") return 7;
  if (state.activeTask.status === "planned") return 6;
  if (state.selectedDroneId && state.selectedDockId) return 5;
  if (state.activeTask.status === "parsed") return 4;
  return 3;
}

export default function App() {
  const [state, setState] = useState<DemoState>(() => createInitialState());
  const [demoSignal, setDemoSignal] = useState(0);
  const [resetSignal, setResetSignal] = useState(0);
  const currentNavItem = useMemo(() => navItems.find((item) => item.id === state.currentPage) ?? navItems[0], [state.currentPage]);
  const completedPage = getCompletedPage(state);

  function setCurrentPage(page: number) {
    setState((current) => ({ ...current, currentPage: page }));
  }

  function setLayers(enabledLayers: LayerState) {
    setState((current) => ({ ...current, enabledLayers }));
  }

  function goNext() {
    setCurrentPage(Math.min(state.currentPage + 1, navItems.length - 1));
  }

  function startDemo() {
    setState((current) => ({ ...current, currentPage: 0 }));
    setDemoSignal((current) => current + 1);
  }

  function setParsedTask(activeTask: Task) {
    setState((current) => ({
      ...current,
      activeTask,
      routes: [],
      selectedDroneId: undefined,
      selectedDockId: undefined,
      selectedRouteId: undefined,
      activeRouteId: undefined,
      riskItems: [],
      missionReport: undefined,
      executionProgress: 0,
      executionStatus: "idle"
    }));
  }

  function confirmResourceSelection(droneId: string, dockId: string) {
    setState((current) => ({
      ...current,
      selectedDroneId: droneId,
      selectedDockId: dockId
    }));
  }

  function confirmRoutePlanning(routes: Route[], selectedRouteId: string) {
    setState((current) => ({
      ...current,
      routes,
      selectedRouteId,
      activeRouteId: selectedRouteId,
      activeTask: current.activeTask ? { ...current.activeTask, status: "planned" } : current.activeTask,
      riskItems: []
    }));
  }

  function confirmRiskReview(riskItems: RiskItem[]) {
    setState((current) => ({
      ...current,
      riskItems,
      activeTask: current.activeTask ? { ...current.activeTask, status: "risk_reviewed" } : current.activeTask
    }));
  }

  function updateExecutionState(
    update: Partial<Pick<DemoState, "executionProgress" | "executionStatus" | "activeRouteId" | "selectedRouteId" | "routes">> & {
      activeTaskStatus?: Task["status"];
      dynamicEvents?: DynamicEvent[];
    }
  ) {
    setState((current) => ({
      ...current,
      ...("executionProgress" in update ? { executionProgress: update.executionProgress } : {}),
      ...("executionStatus" in update ? { executionStatus: update.executionStatus } : {}),
      ...("activeRouteId" in update ? { activeRouteId: update.activeRouteId } : {}),
      ...("selectedRouteId" in update ? { selectedRouteId: update.selectedRouteId } : {}),
      ...("routes" in update ? { routes: update.routes ?? current.routes } : {}),
      ...(update.dynamicEvents ? { dynamicEvents: update.dynamicEvents } : {}),
      activeTask: update.activeTaskStatus && current.activeTask ? { ...current.activeTask, status: update.activeTaskStatus } : current.activeTask
    }));
  }

  function setMissionReport(missionReport: MissionReport) {
    setState((current) => ({
      ...current,
      missionReport,
      enabledLayers: { ...current.enabledLayers, results: true },
      activeTask: current.activeTask ? { ...current.activeTask, status: "reported" } : current.activeTask
    }));
  }

  function resetDemo() {
    setState(createInitialState());
    setDemoSignal(0);
    setResetSignal((current) => current + 1);
  }

  return (
    <div className="app-shell">
      <Header activeTask={state.activeTask} onStartDemo={startDemo} onReset={resetDemo} />
      <div className="workspace">
        <Sidebar items={navItems} currentPage={state.currentPage} completedPage={completedPage} activeTask={state.activeTask} onNavigate={setCurrentPage} />
        <main className="main-stage">
          <div className="stage-heading">
            <span>{String(currentNavItem.id + 1).padStart(2, "0")}</span>
            <h2>{currentNavItem.title}</h2>
          </div>
          {state.currentPage === 0 && <SemanticGenerationPage key={`semantic-generation-${resetSignal}`} goNext={goNext} autoDemoSignal={demoSignal} />}
          {state.currentPage === 1 && <FlightViewGenerationPage goNext={goNext} />}
          {state.currentPage === 2 && <WorldOverviewPage state={state} goNext={goNext} />}
          {state.currentPage === 3 && <SemanticLayersPage state={state} setLayers={setLayers} goNext={goNext} />}
          {state.currentPage === 4 && <TaskIntentPage activeTask={state.activeTask} onTaskParsed={setParsedTask} goNext={goNext} />}
          {state.currentPage === 5 && (
            <ResourceDispatchPage state={state} onConfirmResource={confirmResourceSelection} goNext={goNext} goToTaskPage={() => setCurrentPage(4)} />
          )}
          {state.currentPage === 6 && (
            <RoutePlanningPage
              state={state}
              onConfirmRoute={confirmRoutePlanning}
              goNext={goNext}
              goToTaskPage={() => setCurrentPage(4)}
              goToResourcePage={() => setCurrentPage(5)}
            />
          )}
          {state.currentPage === 7 && (
            <RiskSimulationPage
              state={state}
              onConfirmRisk={confirmRiskReview}
              goNext={goNext}
              goToRoutePage={() => setCurrentPage(6)}
              goToTaskPage={() => setCurrentPage(4)}
            />
          )}
          {state.currentPage === 8 && <ExecutionReplanningPage state={state} onExecutionUpdate={updateExecutionState} goNext={goNext} goToRiskPage={() => setCurrentPage(7)} />}
          {state.currentPage === 9 && (
            <ResultDataLoopPage
              state={state}
              onReportGenerated={setMissionReport}
              goToExecutionPage={() => setCurrentPage(8)}
              returnOverview={() => setCurrentPage(0)}
              resetDemo={resetDemo}
            />
          )}
        </main>
      </div>
    </div>
  );
}
