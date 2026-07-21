import { AmapWorldOverview } from "../components/AmapWorldOverview";
import type { DemoState } from "../types";
import { airspaceZones, areas, drones, riskZones } from "../data/mockData";

type PageProps = {
  state: DemoState;
  goNext: () => void;
};

export function WorldOverviewPage({ state, goNext }: PageProps) {
  return (
    <section className="page-grid page-grid--single">
      <div className="panel panel--wide">
        <div className="panel-kicker">世界总览</div>
        <h2>低空世界总览</h2>
        <p className="page-lead">低空世界模型不是一张地图，而是一个可计算、可推演、可调度的任务环境。</p>
        <div className="overview-metrics">
          <div>
            <span>语义区域</span>
            <strong>{areas.length}</strong>
          </div>
          <div>
            <span>空域约束</span>
            <strong>{airspaceZones.length}</strong>
          </div>
          <div>
            <span>无人机资源</span>
            <strong>{drones.length}</strong>
          </div>
          <div>
            <span>风险图层</span>
            <strong>{riskZones.length}</strong>
          </div>
        </div>
        <AmapWorldOverview state={state} />
        <button className="button dispatch-confirm" onClick={goNext}>进入语义图层</button>
      </div>
    </section>
  );
}
