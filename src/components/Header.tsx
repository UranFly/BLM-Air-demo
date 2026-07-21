import type { Task } from "../types";
import { StatusBadge } from "./StatusBadge";

type HeaderProps = {
  activeTask?: Task;
  onStartDemo: () => void;
  onReset: () => void;
};

const statusLabel: Record<NonNullable<Task["status"]>, string> = {
  draft: "未创建",
  parsed: "已解析",
  planned: "已规划",
  risk_reviewed: "风险推演完成",
  executing: "执行中",
  event_detected: "事件已触发",
  replanned: "已重规划",
  completed: "已完成",
  reported: "已报告"
};

export function Header({ activeTask, onStartDemo, onReset }: HeaderProps) {
  return (
    <header className="app-header">
      <div>
        <div className="brand-mark">悠然智飞</div>
        <h1>低空运营智能体功能演示</h1>
        <p>面向低空经济的低空运营智能体平台</p>
      </div>
      <div className="header-actions">
        {activeTask && <span className="header-task">{activeTask.title}</span>}
        <StatusBadge label={activeTask ? statusLabel[activeTask.status] : "未创建"} tone={activeTask ? "active" : "idle"} />
        <button className="button button--ghost" onClick={onStartDemo}>启动一键演示</button>
        <button className="button button--secondary" onClick={onReset}>重置演示</button>
      </div>
    </header>
  );
}
