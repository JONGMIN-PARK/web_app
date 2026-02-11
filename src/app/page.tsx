"use client";

import { useState } from "react";
import { useApp } from "@/store/AppContext";
import Sidebar from "@/components/Sidebar";
import DashboardView from "@/components/dashboard/DashboardView";
import ChatView from "@/components/chat/ChatView";
import FileTransferView from "@/components/files/FileTransferView";
import ProjectView from "@/components/projects/ProjectView";
import ScheduleView from "@/components/schedule/ScheduleView";

export default function Home() {
  const { state } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function renderView() {
    switch (state.currentView) {
      case "dashboard":
        return <DashboardView />;
      case "chat":
        return <ChatView />;
      case "files":
        return <FileTransferView />;
      case "projects":
        return <ProjectView />;
      case "schedule":
        return <ScheduleView />;
      default:
        return <DashboardView />;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 p-3 border-b border-slate-700 bg-slate-900">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-300 hover:text-white p-1"
          >
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
          <span className="font-bold text-blue-400">P2P Collab</span>
        </div>
        {renderView()}
      </main>
    </div>
  );
}
