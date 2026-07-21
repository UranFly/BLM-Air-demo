import { useMemo } from "react";
import { AmapMissionMap } from "../components/AmapMissionMap";
import { StatusBadge } from "../components/StatusBadge";
import { drones } from "../data/mockData";
import type { DemoState, RiskItem } from "../types";
import { evaluateRiskDecision, generateRiskItems } from "../utils/riskEngine";

type RiskSimulationPageProps = {
  state: DemoState;
  onConfirmRisk: (riskItems: RiskItem[]) => void;
  goNext: () => void;
  goToRoutePage: () => void;
  goToTaskPage: () => void;
};

const levelTone: Record<RiskItem["level"], "active" | "warning" | "danger"> = {
  low: "active",
  medium: "warning",
  high: "danger"
};

const levelLabel: Record<RiskItem["level"], string> = {
  low: "低",
  medium: "中",
  high: "高"
};

const categoryLabel: Record<RiskItem["category"], string> = {
  airspace: "空域",
  obstacle: "障碍物",
  weather: "天气",
  communication: "通信",
  battery: "电量",
  resource: "资源",
  mission: "任务",
  compliance: "合规"
};

export function RiskSimulationPage({ state, onConfirmRisk, goNext, goToRoutePage, goToTaskPage }: RiskSimulationPageProps) {
  const selectedRoute = state.routes.find((route) => route.id === state.selectedRouteId);
  const selectedDrone = drones.find((drone) => drone.id === state.selectedDroneId);
  const riskItems = useMemo(() => {
    if (!state.activeTask || !selectedRoute) return [];
    return state.riskItems.length > 0 ? state.riskItems : generateRiskItems(state.activeTask, selectedRoute, selectedDrone);
  }, [selectedDrone, selectedRoute, state.activeTask, state.riskItems]);
  const decision = useMemo(() => evaluateRiskDecision(riskItems), [riskItems]);

  function confirmAndContinue() {
    if (riskItems.length === 0) return;
    onConfirmRisk(riskItems);
    goNext();
  }

  if (!state.activeTask) {
    return (
      <section className="page-grid page-grid--single">
        <div className="panel panel--wide empty-state">
          <div className="panel-kicker">风险推演</div>
          <h2>风险推演页</h2>
          <p className="page-lead">请先解析任务，再进入风险推演。</p>
          <button className="button" onClick={goToTaskPage}>返回任务意图</button>
        </div>
      </section>
    );
  }

  if (!selectedRoute) {
    return (
      <section className="page-grid page-grid--single">
        <div className="panel panel--wide empty-state">
          <div className="panel-kicker">风险推演</div>
          <h2>风险推演页</h2>
          <p className="page-lead">请先选择并确认一条候选航线，系统才能生成风险清单。</p>
          <button className="button" onClick={goToRoutePage}>返回航线规划</button>
        </div>
      </section>
    );
  }

  return (
    <section className="page-grid">
      <div className="panel panel--wide">
        <div className="panel-kicker">风险推演</div>
        <h2>风险推演页</h2>
        <p className="page-lead">低空任务的关键不是能不能飞，而是能不能安全、合规、可解释地飞。</p>

        <div className={`risk-verdict risk-verdict--${decision.level}`}>
          <div>
            <span>总体风险判断</span>
            <strong>{decision.verdict}</strong>
            <p>{decision.summary}</p>
          </div>
          <StatusBadge label={`总体风险：${levelLabel[decision.level]}`} tone={levelTone[decision.level]} />
        </div>

        <div className="risk-layout">
          <div className="risk-table">
            <div className="risk-table-head">
              <span>类别</span>
              <span>等级</span>
              <span>说明</span>
              <span>建议动作</span>
              <span>人工确认</span>
            </div>
            {riskItems.map((item) => (
              <article key={item.id} className={`risk-row risk-row--${item.level}`}>
                <span>{categoryLabel[item.category]}</span>
                <StatusBadge label={levelLabel[item.level]} tone={levelTone[item.level]} />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </div>
                <p>{item.suggestion}</p>
                <StatusBadge label={item.requiresHumanConfirm ? "需要" : "不需要"} tone={item.requiresHumanConfirm ? "warning" : "active"} />
              </article>
            ))}
          </div>

          <div className="risk-map">
            <AmapMissionMap state={state} title="风险推演地图" routes={state.routes} selectedRouteId={selectedRoute.id} mode="risks" />
          </div>
        </div>
      </div>

      <aside className="panel">
        <div className="panel-kicker">系统建议</div>
        <h3>{selectedRoute.name}</h3>
        <div className="route-detail-grid">
          <div>
            <span>风险评分</span>
            <strong>{selectedRoute.riskScore}</strong>
          </div>
          <div>
            <span>检查项</span>
            <strong>{riskItems.length}</strong>
          </div>
          <div>
            <span>需确认</span>
            <strong>{riskItems.filter((item) => item.requiresHumanConfirm).length}</strong>
          </div>
          <div>
            <span>高风险</span>
            <strong>{riskItems.filter((item) => item.level === "high").length}</strong>
          </div>
        </div>
        <button className="button dispatch-confirm" disabled={riskItems.length === 0 || decision.verdict === "不建议执行"} onClick={confirmAndContinue}>
          确认风险并进入执行
        </button>
        {decision.verdict === "不建议执行" && <p className="blocked-note">当前路线存在严重空域风险，请返回航线规划选择推荐路线。</p>}
        <div className="parser-rules">
          <strong>判断规则</strong>
          <span>存在高空域风险：不建议执行</span>
          <span>存在中高风险：需人工确认</span>
          <span>全部低风险：可执行</span>
        </div>
      </aside>
    </section>
  );
}
