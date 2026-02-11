"use client";

import { useState } from "react";
import { useApp } from "@/store/AppContext";
import { Schedule } from "@/types";
import { v4 as uuidv4 } from "uuid";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isWithinInterval,
} from "date-fns";
import { ko } from "date-fns/locale";

export default function ScheduleView() {
  const { state, dispatch } = useApp();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    projectId: "",
    color: "#3B82F6",
  });

  const allSchedules = state.projects.flatMap((p) => p.schedules);

  function getSchedulesForDate(date: Date): Schedule[] {
    return allSchedules.filter((s) => {
      const start = parseISO(s.startDate);
      const end = parseISO(s.endDate);
      return isWithinInterval(date, { start, end });
    });
  }

  function renderCalendar() {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const days = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  }

  function handleCreateSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title || !formData.startDate || !formData.endDate || !formData.projectId) return;

    const schedule: Schedule = {
      id: uuidv4(),
      projectId: formData.projectId,
      title: formData.title,
      description: formData.description,
      startDate: formData.startDate,
      endDate: formData.endDate,
      assignees: [state.currentUser],
      status: "todo",
      color: formData.color,
      createdAt: Date.now(),
    };

    dispatch({ type: "ADD_SCHEDULE", payload: schedule });
    setFormData({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      projectId: "",
      color: "#3B82F6",
    });
    setShowForm(false);
  }

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];
  const calendarDays = renderCalendar();
  const today = new Date();

  const selectedDateSchedules = selectedDate
    ? getSchedulesForDate(selectedDate)
    : [];

  const colors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
  ];

  return (
    <div className="flex-1 flex h-full overflow-hidden">
      {/* Calendar */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">일정 관리</h2>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn-primary text-sm"
            >
              + 새 일정
            </button>
          </div>

          {showForm && (
            <form
              onSubmit={handleCreateSchedule}
              className="mt-4 card space-y-3"
            >
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="일정 제목"
                className="input-field"
                autoFocus
              />
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="설명 (선택사항)"
                className="input-field resize-none"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="input-field"
                />
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="input-field"
                />
              </div>
              <select
                value={formData.projectId}
                onChange={(e) =>
                  setFormData({ ...formData, projectId: e.target.value })
                }
                className="input-field"
              >
                <option value="">프로젝트 선택</option>
                {state.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-400">색상:</span>
                {colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: c })}
                    className={`w-6 h-6 rounded-full border-2 transition-transform ${
                      formData.color === c
                        ? "border-white scale-110"
                        : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
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
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="btn-secondary text-sm px-3"
            >
              ◀
            </button>
            <h3 className="text-lg font-bold">
              {format(currentMonth, "yyyy년 M월", { locale: ko })}
            </h3>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="btn-secondary text-sm px-3"
            >
              ▶
            </button>
          </div>

          {/* Week headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekDays.map((d) => (
              <div
                key={d}
                className="text-center text-xs font-medium text-slate-400 py-2"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const daySchedules = getSchedulesForDate(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, today);
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={`min-h-[80px] p-1 rounded-lg text-left border transition-colors ${
                    isSelected
                      ? "border-blue-500 bg-blue-500/10"
                      : isToday
                      ? "border-blue-500/50 bg-slate-800"
                      : "border-slate-700/50 hover:border-slate-600 bg-slate-800/50"
                  } ${!isCurrentMonth ? "opacity-40" : ""}`}
                >
                  <div
                    className={`text-xs mb-1 ${
                      isToday
                        ? "text-blue-400 font-bold"
                        : "text-slate-300"
                    }`}
                  >
                    {format(day, "d")}
                  </div>
                  <div className="space-y-0.5">
                    {daySchedules.slice(0, 2).map((s) => (
                      <div
                        key={s.id}
                        className="text-[10px] px-1 py-0.5 rounded truncate text-white"
                        style={{ backgroundColor: s.color + "CC" }}
                      >
                        {s.title}
                      </div>
                    ))}
                    {daySchedules.length > 2 && (
                      <div className="text-[10px] text-slate-400 px-1">
                        +{daySchedules.length - 2}개
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected date detail panel */}
      <div className="w-80 border-l border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h3 className="font-bold">
            {selectedDate
              ? format(selectedDate, "M월 d일 (EEE)", { locale: ko })
              : "날짜를 선택하세요"}
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {selectedDate ? (
            selectedDateSchedules.length > 0 ? (
              <div className="space-y-3">
                {selectedDateSchedules.map((s) => {
                  const project = state.projects.find(
                    (p) => p.id === s.projectId
                  );
                  return (
                    <div key={s.id} className="card">
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="font-medium text-sm">{s.title}</span>
                      </div>
                      {s.description && (
                        <p className="text-xs text-slate-400 mb-2">
                          {s.description}
                        </p>
                      )}
                      <div className="text-xs text-slate-500 space-y-1">
                        <div>
                          {s.startDate} ~ {s.endDate}
                        </div>
                        {project && (
                          <div className="text-blue-400">{project.name}</div>
                        )}
                        <div className="flex gap-1 mt-1">
                          {s.assignees.map((a) => (
                            <span
                              key={a.id}
                              className="bg-slate-700 rounded-full px-2 py-0.5"
                            >
                              {a.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">
                이 날짜에 일정이 없습니다
              </p>
            )
          ) : (
            <p className="text-sm text-slate-500 text-center py-4">
              캘린더에서 날짜를 클릭하세요
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
