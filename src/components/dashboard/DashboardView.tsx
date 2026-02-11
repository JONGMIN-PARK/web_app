"use client";

import { useApp } from "@/store/AppContext";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function DashboardView() {
  const { state, dispatch } = useApp();

  const totalMessages = state.chatRooms.reduce(
    (acc, room) => acc + room.messages.length,
    0
  );
  const totalSchedules = state.projects.reduce(
    (acc, p) => acc + p.schedules.length,
    0
  );
  const inProgressSchedules = state.projects.reduce(
    (acc, p) =>
      acc + p.schedules.filter((s) => s.status === "in_progress").length,
    0
  );
  const activeProjects = state.projects.filter(
    (p) => p.status === "active"
  ).length;

  const recentMessages = state.chatRooms
    .flatMap((room) =>
      room.messages.map((m) => ({ ...m, roomName: room.name }))
    )
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  const recentTransfers = state.fileTransfers.slice(0, 5);

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">대시보드</h2>
        <p className="text-slate-400 text-sm mt-1">
          {format(new Date(), "yyyy년 M월 d일 (EEE)", { locale: ko })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="text-sm text-slate-400">활성 프로젝트</div>
          <div className="text-3xl font-bold text-blue-400 mt-1">
            {activeProjects}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-400">진행중 일정</div>
          <div className="text-3xl font-bold text-yellow-400 mt-1">
            {inProgressSchedules}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-400">전체 메시지</div>
          <div className="text-3xl font-bold text-green-400 mt-1">
            {totalMessages}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-400">파일 전송</div>
          <div className="text-3xl font-bold text-purple-400 mt-1">
            {state.fileTransfers.length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent messages */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">최근 메시지</h3>
            <button
              onClick={() => dispatch({ type: "SET_VIEW", payload: "chat" })}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              전체보기
            </button>
          </div>
          {recentMessages.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              메시지가 없습니다
            </p>
          ) : (
            <div className="space-y-3">
              {recentMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs shrink-0">
                    {msg.senderName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {msg.senderName}
                      </span>
                      <span className="text-xs text-slate-500">
                        {(msg as typeof msg & { roomName: string }).roomName}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 truncate">
                      {msg.content}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500 shrink-0">
                    {format(new Date(msg.timestamp), "a h:mm", { locale: ko })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent file transfers */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">최근 파일 전송</h3>
            <button
              onClick={() => dispatch({ type: "SET_VIEW", payload: "files" })}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              전체보기
            </button>
          </div>
          {recentTransfers.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              파일 전송 이력이 없습니다
            </p>
          ) : (
            <div className="space-y-3">
              {recentTransfers.map((ft) => (
                <div key={ft.id} className="flex items-center gap-3">
                  <div className="text-2xl">
                    {ft.fileType.includes("pdf") ? "📕" : "📄"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {ft.fileName}
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatFileSize(ft.fileSize)} ·{" "}
                      {ft.senderId === state.currentUser.id
                        ? `→ ${ft.receiverName}`
                        : `← ${ft.senderName}`}
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      ft.status === "completed"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}
                  >
                    {ft.status === "completed" ? "완료" : "전송중"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Projects overview */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">프로젝트</h3>
            <button
              onClick={() =>
                dispatch({ type: "SET_VIEW", payload: "projects" })
              }
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              전체보기
            </button>
          </div>
          {state.projects.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              프로젝트가 없습니다
            </p>
          ) : (
            <div className="space-y-3">
              {state.projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    dispatch({ type: "SET_VIEW", payload: "projects" });
                    dispatch({
                      type: "SET_ACTIVE_PROJECT",
                      payload: project.id,
                    });
                  }}
                  className="w-full flex items-center gap-3 hover:bg-slate-700/50 rounded-lg p-2 transition-colors text-left"
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      project.status === "active"
                        ? "bg-green-400"
                        : "bg-slate-400"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{project.name}</div>
                    <div className="text-xs text-slate-400">
                      멤버 {project.members.length}명 · 일정{" "}
                      {project.schedules.length}개
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming schedules */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">진행중 일정</h3>
            <button
              onClick={() =>
                dispatch({ type: "SET_VIEW", payload: "schedule" })
              }
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              전체보기
            </button>
          </div>
          {(() => {
            const upcoming = state.projects
              .flatMap((p) =>
                p.schedules
                  .filter((s) => s.status !== "done")
                  .map((s) => ({ ...s, projectName: p.name }))
              )
              .sort(
                (a, b) =>
                  new Date(a.startDate).getTime() -
                  new Date(b.startDate).getTime()
              )
              .slice(0, 5);

            if (upcoming.length === 0) {
              return (
                <p className="text-sm text-slate-500 py-4 text-center">
                  진행중인 일정이 없습니다
                </p>
              );
            }

            return (
              <div className="space-y-3">
                {upcoming.map((s) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <div
                      className="w-1 h-10 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{s.title}</div>
                      <div className="text-xs text-slate-400">
                        {(s as typeof s & { projectName: string }).projectName}{" "}
                        · {s.startDate} ~ {s.endDate}
                      </div>
                    </div>
                    <span
                      className={`badge text-xs ${
                        s.status === "in_progress"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-slate-500/20 text-slate-400"
                      }`}
                    >
                      {s.status === "in_progress" ? "진행중" : "예정"}
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
