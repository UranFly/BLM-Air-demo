import type { Task } from "../types";
import { StatusBadge } from "./StatusBadge";

export type NavItem = {
  id: number;
  title: string;
  shortTitle: string;
};

type SidebarProps = {
  items: NavItem[];
  currentPage: number;
  completedPage: number;
  activeTask?: Task;
  onNavigate: (page: number) => void;
};

function getStepTone(index: number, currentPage: number, completedPage: number) {
  if (index === currentPage) return "active";
  if (index <= completedPage) return "done";
  return "idle";
}

function getStepLabel(index: number, currentPage: number, completedPage: number) {
  if (index === currentPage) return "当前";
  if (index <= completedPage) return "已完成";
  return "未开始";
}

export function Sidebar({ items, currentPage, completedPage, activeTask, onNavigate }: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-label">任务流</div>
        <div className="task-title">{activeTask?.title ?? "等待创建任务"}</div>
      </div>
      <nav className="nav-list" aria-label="演示页面导航">
        {items.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${currentPage === item.id ? "is-active" : ""}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-index">{String(item.id + 1).padStart(2, "0")}</span>
            <span className="nav-title">{item.shortTitle}</span>
            <StatusBadge label={getStepLabel(item.id, currentPage, completedPage)} tone={getStepTone(item.id, currentPage, completedPage)} />
          </button>
        ))}
      </nav>
    </aside>
  );
}
