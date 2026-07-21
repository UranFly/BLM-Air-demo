import { useMemo, useState } from "react";
import { StatusBadge } from "../components/StatusBadge";
import { drones } from "../data/mockData";
import type { DemoState, MissionReport } from "../types";
import { generateMissionReport, groupDataAssets } from "../utils/reportGenerator";

type ResultDataLoopPageProps = {
  state: DemoState;
  onReportGenerated: (report: MissionReport) => void;
  goToExecutionPage: () => void;
  returnOverview: () => void;
  resetDemo: () => void;
};

const taskTypeLabel: Record<string, string> = {
  inspection: "城市巡检",
  emergency: "应急侦察",
  delivery: "低空配送"
};

function downloadReport(report: MissionReport) {
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${report.id}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ResultDataLoopPage({ state, onReportGenerated, goToExecutionPage, returnOverview, resetDemo }: ResultDataLoopPageProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const selectedDrone = drones.find((drone) => drone.id === state.selectedDroneId);
  const activeRoute = state.routes.find((route) => route.id === state.activeRouteId) ?? state.routes.find((route) => route.id === state.selectedRouteId);
  const report = state.missionReport;
  const dataAssetGroups = useMemo(() => (report ? groupDataAssets(report) : {}), [report]);

  function generateReport() {
    if (!state.activeTask || !selectedDrone || !activeRoute) return;
    onReportGenerated(generateMissionReport({
      task: state.activeTask,
      drone: selectedDrone,
      route: activeRoute,
      riskItems: state.riskItems,
      dynamicEvents: state.dynamicEvents
    }));
  }

  async function copyReport() {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1500);
    } catch {
      setCopyState("failed");
    }
  }

  if (!state.activeTask || state.activeTask.status !== "completed" && state.activeTask.status !== "reported") {
    return (
      <section className="page-grid page-grid--single">
        <div className="panel panel--wide empty-state">
          <div className="panel-kicker">数据闭环</div>
          <h2>结果交付与数据闭环页</h2>
          <p className="page-lead">请先完成任务执行，再生成任务报告。</p>
          <button className="button" onClick={goToExecutionPage}>返回执行页</button>
        </div>
      </section>
    );
  }

  return (
    <section className="page-grid">
      <div className="panel panel--wide">
        <div className="panel-kicker">数据闭环</div>
        <h2>结果交付与数据闭环页</h2>
        <p className="page-lead">低空服务的商业价值不是飞行过程，而是可交付、可归档、可复用的数据结果。</p>

        {!report ? (
          <div className="report-ready">
            <div>
              <span>任务已完成</span>
              <strong>{state.activeTask.title}</strong>
              <p>已具备生成报告条件，可沉淀任务轨迹、风险事件、交付物和数据资产。</p>
            </div>
            <button className="button" onClick={generateReport}>生成任务报告</button>
          </div>
        ) : (
          <>
            <div className="report-card">
              <div className="result-header">
                <div>
                  <div className="panel-kicker">任务报告</div>
                  <h3>{report.taskTitle}</h3>
                </div>
                <StatusBadge label="已报告" tone="done" />
              </div>
              <div className="report-metrics">
                <div><span>任务类型</span><strong>{taskTypeLabel[report.taskType]}</strong></div>
                <div><span>执行无人机</span><strong>{selectedDrone?.name ?? "已选无人机"}</strong></div>
                <div><span>执行航线</span><strong>{report.routeId.includes("replanned") ? "重规划航线" : "推荐航线"}</strong></div>
                <div><span>飞行距离</span><strong>{report.flightDistanceKm} 公里</strong></div>
                <div><span>飞行时长</span><strong>{report.flightTimeMin} 分钟</strong></div>
                <div><span>动态事件</span><strong>{state.dynamicEvents.filter((event) => event.triggered).length}</strong></div>
              </div>
              <p>{report.summary}</p>
            </div>

            <div className="result-columns">
              <div className="result-list-card">
                <span className="column-label">关键发现</span>
                <ul>{report.keyFindings.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div className="result-list-card">
                <span className="column-label">交付物</span>
                <ul>{report.deliverables.map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
              <div className="result-list-card">
                <span className="column-label">风险事件摘要</span>
                <ul>{report.riskEvents.slice(0, 5).map((item) => <li key={item}>{item}</li>)}</ul>
              </div>
            </div>

            <div className="asset-grid">
              {Object.entries(dataAssetGroups).map(([group, assets]) => (
                <div key={group}>
                  <strong>{group}</strong>
                  {assets.map((asset) => <span key={asset}>{asset}</span>)}
                </div>
              ))}
            </div>
            <div className="header-actions result-actions">
              <button className="button button--ghost" onClick={copyReport}>{copyState === "copied" ? "已复制" : copyState === "failed" ? "复制失败" : "复制结构化报告"}</button>
              <button className="button button--secondary" onClick={() => downloadReport(report)}>下载结构化报告</button>
            </div>
          </>
        )}
      </div>

      <aside className="panel">
        <div className="panel-kicker">数据闭环</div>
        <h3>从一次任务到长期壁垒</h3>
        <p>每次任务沉淀为空间、风险、设备和任务数据，形成后续模型推演和运营优化的基础。</p>
        <div className="parser-rules">
          <strong>交付状态</strong>
          <span>任务状态：{state.activeTask.status === "reported" ? "已报告" : "已完成"}</span>
          <span>报告状态：{report ? "已生成" : "待生成"}</span>
          <span>结果图层：{state.enabledLayers.results ? "已开启" : "未开启"}</span>
        </div>
        <button className="button dispatch-confirm" onClick={returnOverview}>返回世界总览</button>
        <button className="button button--secondary dispatch-confirm" onClick={resetDemo}>重新创建新任务</button>
      </aside>
    </section>
  );
}
