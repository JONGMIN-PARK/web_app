"use client";

import { useApp } from "@/store/AppContext";
import { AppView } from "@/types";

const navItems: { view: AppView; label: string; icon: string }[] = [
  { view: "dashboard", label: "대시보드", icon: "📊" },
  { view: "chat", label: "채팅", icon: "💬" },
  { view: "files", label: "파일 전송", icon: "📁" },
  { view: "projects", label: "프로젝트", icon: "📋" },
  { view: "schedule", label: "일정", icon: "📅" },
];

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { state, dispatch } = useApp();

  function handleNav(view: AppView) {
    dispatch({ type: "SET_VIEW", payload: view });
    onClose();
  }

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-700 flex flex-col h-full
          transform transition-transform duration-200 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"}
          md:relative md:translate-x-0
        `}
      >
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-blue-400">P2P Collab</h1>
            <p className="text-xs text-slate-400 mt-1">채팅 · 파일공유 · 프로젝트</p>
          </div>
          <button
            onClick={onClose}
            className="md:hidden text-slate-400 hover:text-white p-1"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => handleNav(item.view)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                state.currentView === item.view
                  ? "bg-blue-600/20 text-blue-400"
                  : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-700">
          <div className="text-xs text-slate-500 mb-2 px-2">접속중인 피어</div>
          {state.peers.map((peer) => (
            <div
              key={peer.id}
              className="flex items-center gap-2 px-2 py-1.5 text-sm"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  peer.status === "online"
                    ? "bg-green-400"
                    : peer.status === "away"
                    ? "bg-yellow-400"
                    : "bg-slate-500"
                }`}
              />
              <span className="text-slate-300">{peer.name}</span>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-700">
          <div className="flex items-center gap-2 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
              {state.currentUser.name[0]}
            </div>
            <div>
              <div className="text-sm font-medium">{state.currentUser.name}</div>
              <div className="text-xs text-green-400">온라인</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
