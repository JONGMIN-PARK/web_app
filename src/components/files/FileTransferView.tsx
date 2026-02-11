"use client";

import { useState } from "react";
import { useApp } from "@/store/AppContext";
import { FileTransferInfo } from "@/types";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { v4 as uuidv4 } from "uuid";

type FilterType = "all" | "sent" | "received";

export default function FileTransferView() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransfers = state.fileTransfers
    .filter((ft) => {
      if (filter === "sent") return ft.senderId === state.currentUser.id;
      if (filter === "received") return ft.receiverId === state.currentUser.id;
      return true;
    })
    .filter(
      (ft) =>
        !searchQuery ||
        ft.fileName.toLowerCase().includes(searchQuery.toLowerCase())
    );

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + " MB";
    return (bytes / 1073741824).toFixed(1) + " GB";
  }

  function getFileIcon(fileType: string): string {
    if (fileType.startsWith("image/")) return "🖼️";
    if (fileType.includes("pdf")) return "📕";
    if (fileType.includes("document") || fileType.includes("docx")) return "📝";
    if (fileType.includes("spreadsheet") || fileType.includes("xlsx"))
      return "📊";
    if (fileType.includes("presentation") || fileType.includes("pptx"))
      return "📑";
    if (fileType.includes("zip") || fileType.includes("rar")) return "📦";
    if (fileType.includes("video")) return "🎬";
    if (fileType.includes("audio")) return "🎵";
    if (fileType.includes("figma")) return "🎨";
    return "📄";
  }

  function getStatusBadge(status: FileTransferInfo["status"]) {
    switch (status) {
      case "completed":
        return (
          <span className="badge bg-green-500/20 text-green-400">완료</span>
        );
      case "transferring":
        return (
          <span className="badge bg-blue-500/20 text-blue-400">전송중</span>
        );
      case "pending":
        return (
          <span className="badge bg-yellow-500/20 text-yellow-400">대기</span>
        );
      case "failed":
        return (
          <span className="badge bg-red-500/20 text-red-400">실패</span>
        );
    }
  }

  function handleNewTransfer() {
    const peer = state.peers[Math.floor(Math.random() * state.peers.length)];
    const fileNames = [
      "보고서_최종.pdf",
      "회의록_0211.docx",
      "데이터분석.xlsx",
      "스크린샷.png",
      "프레젠테이션.pptx",
    ];
    const fileTypes = [
      "application/pdf",
      "application/docx",
      "application/xlsx",
      "image/png",
      "application/pptx",
    ];
    const idx = Math.floor(Math.random() * fileNames.length);

    const transfer: FileTransferInfo = {
      id: uuidv4(),
      fileName: fileNames[idx],
      fileSize: Math.floor(Math.random() * 10000000) + 100000,
      fileType: fileTypes[idx],
      status: "transferring",
      progress: 0,
      senderId: state.currentUser.id,
      senderName: state.currentUser.name,
      receiverId: peer.id,
      receiverName: peer.name,
      timestamp: Date.now(),
    };

    dispatch({ type: "ADD_FILE_TRANSFER", payload: transfer });

    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25 + 10;
      if (progress >= 100) {
        clearInterval(interval);
        dispatch({
          type: "UPDATE_FILE_TRANSFER",
          payload: {
            id: transfer.id,
            updates: { status: "completed", progress: 100 },
          },
        });
      } else {
        dispatch({
          type: "UPDATE_FILE_TRANSFER",
          payload: {
            id: transfer.id,
            updates: { progress: Math.min(progress, 99) },
          },
        });
      }
    }, 600);
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">파일 전송 이력</h2>
          <button onClick={handleNewTransfer} className="btn-primary text-sm">
            + 파일 전송
          </button>
        </div>

        <div className="flex gap-3 items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="파일명으로 검색..."
            className="input-field max-w-xs"
          />
          <div className="flex gap-1">
            {(["all", "sent", "received"] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  filter === f
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {f === "all" ? "전체" : f === "sent" ? "보낸 파일" : "받은 파일"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transfer list */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredTransfers.length === 0 ? (
          <div className="text-center text-slate-500 py-12">
            <div className="text-5xl mb-3">📁</div>
            <p>파일 전송 이력이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransfers.map((ft) => (
              <div
                key={ft.id}
                className="card flex items-center gap-4 hover:border-slate-600 transition-colors"
              >
                <div className="text-3xl">{getFileIcon(ft.fileType)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm truncate">
                      {ft.fileName}
                    </span>
                    {getStatusBadge(ft.status)}
                  </div>
                  <div className="text-xs text-slate-400 flex gap-3">
                    <span>{formatFileSize(ft.fileSize)}</span>
                    <span>
                      {ft.senderId === state.currentUser.id
                        ? `→ ${ft.receiverName}`
                        : `← ${ft.senderName}`}
                    </span>
                    <span>
                      {format(new Date(ft.timestamp), "yyyy.MM.dd a h:mm", {
                        locale: ko,
                      })}
                    </span>
                  </div>
                  {ft.status === "transferring" && (
                    <div className="mt-2 w-full bg-slate-600 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${ft.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="p-4 border-t border-slate-700 flex gap-6 text-sm">
        <div>
          <span className="text-slate-400">전체 파일: </span>
          <span className="font-medium">{state.fileTransfers.length}개</span>
        </div>
        <div>
          <span className="text-slate-400">보낸 파일: </span>
          <span className="font-medium">
            {
              state.fileTransfers.filter(
                (ft) => ft.senderId === state.currentUser.id
              ).length
            }
            개
          </span>
        </div>
        <div>
          <span className="text-slate-400">받은 파일: </span>
          <span className="font-medium">
            {
              state.fileTransfers.filter(
                (ft) => ft.receiverId === state.currentUser.id
              ).length
            }
            개
          </span>
        </div>
        <div>
          <span className="text-slate-400">총 용량: </span>
          <span className="font-medium">
            {formatFileSize(
              state.fileTransfers.reduce((acc, ft) => acc + ft.fileSize, 0)
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
