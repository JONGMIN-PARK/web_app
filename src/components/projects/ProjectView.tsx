"use client";

import { useState } from "react";
import { useApp } from "@/store/AppContext";
import { Project } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function ProjectView() {
  const { state, dispatch } = useApp();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const activeProject = state.projects.find(
    (p) => p.id === state.activeProjectId
  );

  function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    const project: Project = {
      id: uuidv4(),
      name: newName.trim(),
      description: newDesc.trim(),
      members: [state.currentUser],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      status: "active",
      schedules: [],
    };

    dispatch({ type: "ADD_PROJECT", payload: project });
    setNewName("");
    setNewDesc("");
    setShowCreateForm(false);
  }

  function getStatusColor(status: Project["status"]) {
    switch (status) {
      case "active":
        return "bg-green-500/20 text-green-400";
      case "completed":
        return "bg-blue-500/20 text-blue-400";
      case "archived":
        return "bg-slate-500/20 text-slate-400";
    }
  }

  function getStatusLabel(status: Project["status"]) {
    switch (status) {
      case "active":
        return "진행중";
      case "completed":
        return "완료";
      case "archived":
        return "보관";
    }
  }

  if (activeProject) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-slate-700">
          <button
            onClick={() => dispatch({ type: "SET_ACTIVE_PROJECT", payload: null })}
            className="text-sm text-slate-400 hover:text-slate-200 mb-2 flex items-center gap-1"
          >
            ← 프로젝트 목록
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">{activeProject.name}</h2>
              <p className="text-sm text-slate-400 mt-1">
                {activeProject.description}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`badge ${getStatusColor(activeProject.status)}`}>
                {getStatusLabel(activeProject.status)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Members */}
          <div className="card mb-4">
            <h3 className="font-bold text-sm mb-3">멤버</h3>
            <div className="flex gap-2 flex-wrap">
              {activeProject.members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-2 bg-slate-700 rounded-full px-3 py-1"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs">
                    {m.name[0]}
                  </div>
                  <span className="text-sm">{m.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Schedules */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm">일정 ({activeProject.schedules.length})</h3>
            </div>
            {activeProject.schedules.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                등록된 일정이 없습니다
              </p>
            ) : (
              <div className="space-y-2">
                {activeProject.schedules.map((schedule) => (
                  <div
                    key={schedule.id}
                    className="flex items-center gap-3 bg-slate-700/50 rounded-lg p-3"
                  >
                    <div
                      className="w-1 h-10 rounded-full"
                      style={{ backgroundColor: schedule.color }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {schedule.title}
                        </span>
                        <span
                          className={`badge text-xs ${
                            schedule.status === "done"
                              ? "bg-green-500/20 text-green-400"
                              : schedule.status === "in_progress"
                              ? "bg-blue-500/20 text-blue-400"
                              : "bg-slate-500/20 text-slate-400"
                          }`}
                        >
                          {schedule.status === "done"
                            ? "완료"
                            : schedule.status === "in_progress"
                            ? "진행중"
                            : "예정"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {schedule.startDate} ~ {schedule.endDate}
                      </div>
                    </div>
                    <div className="flex -space-x-1">
                      {schedule.assignees.map((a) => (
                        <div
                          key={a.id}
                          className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs border-2 border-slate-800"
                          title={a.name}
                        >
                          {a.name[0]}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="card mt-4">
            <h3 className="font-bold text-sm mb-3">프로젝트 정보</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">생성일</span>
                <span>
                  {format(new Date(activeProject.createdAt), "yyyy년 M월 d일", {
                    locale: ko,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">최종 수정</span>
                <span>
                  {format(new Date(activeProject.updatedAt), "yyyy년 M월 d일", {
                    locale: ko,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">멤버 수</span>
                <span>{activeProject.members.length}명</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">일정 수</span>
                <span>{activeProject.schedules.length}개</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">프로젝트</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="btn-primary text-sm"
          >
            + 새 프로젝트
          </button>
        </div>

        {showCreateForm && (
          <form
            onSubmit={handleCreateProject}
            className="mt-4 card space-y-3"
          >
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="프로젝트 이름"
              className="input-field"
              autoFocus
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="설명 (선택사항)"
              className="input-field resize-none"
              rows={2}
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary text-sm"
              >
                취소
              </button>
              <button type="submit" className="btn-primary text-sm">
                생성
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {state.projects.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            <div className="text-5xl mb-3">📋</div>
            <p>등록된 프로젝트가 없습니다</p>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
            {state.projects.map((project) => (
              <button
                key={project.id}
                onClick={() =>
                  dispatch({
                    type: "SET_ACTIVE_PROJECT",
                    payload: project.id,
                  })
                }
                className="card text-left hover:border-slate-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold">{project.name}</h3>
                  <span
                    className={`badge ${getStatusColor(project.status)}`}
                  >
                    {getStatusLabel(project.status)}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                  {project.description}
                </p>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <span>멤버 {project.members.length}명</span>
                    <span>일정 {project.schedules.length}개</span>
                  </div>
                  <span>
                    {format(new Date(project.updatedAt), "M.d", {
                      locale: ko,
                    })}{" "}
                    수정
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
