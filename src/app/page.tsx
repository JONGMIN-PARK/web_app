"use client";

import { useApp } from "@/store/AppContext";
import Sidebar from "@/components/Sidebar";
import DashboardView from "@/components/dashboard/DashboardView";
import ChatView from "@/components/chat/ChatView";
import FileTransferView from "@/components/files/FileTransferView";
import ProjectView from "@/components/projects/ProjectView";
import ScheduleView from "@/components/schedule/ScheduleView";

export default function Home() {
  const { state } = useApp();

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
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {renderView()}
      </main>
    </div>
  );
}
