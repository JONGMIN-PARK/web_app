"use client";

import { useState, useRef, useEffect } from "react";
import { useApp } from "@/store/AppContext";
import { ChatMessage, ChatRoom } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function ChatView() {
  const { state, dispatch } = useApp();
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeRoom = state.chatRooms.find(
    (r) => r.id === state.activeChatRoomId
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeRoom?.messages]);

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageInput.trim() || !activeRoom) return;

    const message: ChatMessage = {
      id: uuidv4(),
      senderId: state.currentUser.id,
      senderName: state.currentUser.name,
      content: messageInput.trim(),
      timestamp: Date.now(),
      type: "text",
    };

    dispatch({
      type: "ADD_MESSAGE",
      payload: { roomId: activeRoom.id, message },
    });
    setMessageInput("");

    // Simulate peer reply
    setTimeout(() => {
      const randomPeer =
        activeRoom.participants.filter(
          (p) => p.id !== state.currentUser.id
        )[0];
      if (!randomPeer) return;

      const replies = [
        "네, 확인했습니다!",
        "좋은 의견이네요.",
        "알겠습니다. 진행하겠습니다.",
        "동의합니다 👍",
        "이 부분은 좀 더 논의가 필요할 것 같아요.",
      ];

      const reply: ChatMessage = {
        id: uuidv4(),
        senderId: randomPeer.id,
        senderName: randomPeer.name,
        content: replies[Math.floor(Math.random() * replies.length)],
        timestamp: Date.now(),
        type: "text",
      };

      dispatch({
        type: "ADD_MESSAGE",
        payload: { roomId: activeRoom.id, message: reply },
      });
    }, 1500);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeRoom) return;

    const receiver = activeRoom.participants.find(
      (p) => p.id !== state.currentUser.id
    );
    if (!receiver) return;

    const fileTransfer = {
      id: uuidv4(),
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || "application/octet-stream",
      status: "transferring" as const,
      progress: 0,
      senderId: state.currentUser.id,
      senderName: state.currentUser.name,
      receiverId: receiver.id,
      receiverName: receiver.name,
      timestamp: Date.now(),
    };

    dispatch({ type: "ADD_FILE_TRANSFER", payload: fileTransfer });

    const fileMessage: ChatMessage = {
      id: uuidv4(),
      senderId: state.currentUser.id,
      senderName: state.currentUser.name,
      content: `파일 전송: ${file.name}`,
      timestamp: Date.now(),
      type: "file",
      fileInfo: fileTransfer,
    };

    dispatch({
      type: "ADD_MESSAGE",
      payload: { roomId: activeRoom.id, message: fileMessage },
    });

    // Simulate file transfer progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30 + 10;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        dispatch({
          type: "UPDATE_FILE_TRANSFER",
          payload: {
            id: fileTransfer.id,
            updates: { status: "completed", progress: 100 },
          },
        });
      } else {
        dispatch({
          type: "UPDATE_FILE_TRANSFER",
          payload: {
            id: fileTransfer.id,
            updates: { progress: Math.min(progress, 99) },
          },
        });
      }
    }, 500);

    e.target.value = "";
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }

  function handleBack() {
    dispatch({ type: "SET_ACTIVE_CHAT", payload: "" });
  }

  // Mobile: show room list OR chat, not both
  // Desktop: show both side by side
  const showChat = !!state.activeChatRoomId && !!activeRoom;

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Room list - hidden on mobile when a chat is active */}
      <div
        className={`w-full md:w-80 border-r border-slate-700 flex flex-col flex-shrink-0 ${
          showChat ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold">채팅</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {state.chatRooms.map((room) => (
            <RoomItem
              key={room.id}
              room={room}
              active={room.id === state.activeChatRoomId}
              onClick={() =>
                dispatch({ type: "SET_ACTIVE_CHAT", payload: room.id })
              }
            />
          ))}
        </div>
      </div>

      {/* Chat area */}
      {showChat ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat header */}
          <div className="p-3 md:p-4 border-b border-slate-700 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={handleBack}
                className="md:hidden text-slate-400 hover:text-white p-1 flex-shrink-0"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 4l-8 8 8 8" />
                </svg>
              </button>
              <div className="min-w-0">
                <h3 className="font-bold truncate">{activeRoom?.name}</h3>
                <p className="text-xs text-slate-400">
                  {activeRoom?.participants.length}명 참여중
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary text-sm flex items-center gap-1 whitespace-nowrap"
              >
                <span className="hidden sm:inline">📎 파일</span>
                <span className="sm:hidden">📎</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
            {activeRoom?.messages.map((msg) => {
              const isMe = msg.senderId === state.currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-md ${
                      isMe ? "order-2" : "order-1"
                    }`}
                  >
                    {!isMe && (
                      <div className="text-xs text-slate-400 mb-1">
                        {msg.senderName}
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-3 py-2 md:px-4 ${
                        msg.type === "file"
                          ? "bg-slate-700 border border-slate-600"
                          : isMe
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-100"
                      }`}
                    >
                      {msg.type === "file" && msg.fileInfo ? (
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📄</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {msg.fileInfo.fileName}
                            </div>
                            <div className="text-xs text-slate-400">
                              {formatFileSize(msg.fileInfo.fileSize)}
                            </div>
                            {msg.fileInfo.status === "transferring" && (
                              <div className="mt-1 w-full bg-slate-600 rounded-full h-1.5">
                                <div
                                  className="bg-blue-500 h-1.5 rounded-full transition-all"
                                  style={{
                                    width: `${
                                      state.fileTransfers.find(
                                        (ft) => ft.id === msg.fileInfo!.id
                                      )?.progress || 0
                                    }%`,
                                  }}
                                />
                              </div>
                            )}
                            {msg.fileInfo.status === "completed" && (
                              <span className="text-xs text-green-400">
                                전송 완료
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm break-words">{msg.content}</p>
                      )}
                    </div>
                    <div
                      className={`text-xs text-slate-500 mt-1 ${
                        isMe ? "text-right" : ""
                      }`}
                    >
                      {format(new Date(msg.timestamp), "a h:mm", {
                        locale: ko,
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 md:p-4 border-t border-slate-700"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="메시지를 입력하세요..."
                className="input-field flex-1 text-base"
              />
              <button type="submit" className="btn-primary whitespace-nowrap">
                전송
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* Empty state - desktop only */
        <div className="hidden md:flex flex-1 items-center justify-center text-slate-500">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-lg">채팅방을 선택하세요</p>
          </div>
        </div>
      )}
    </div>
  );
}

function RoomItem({
  room,
  active,
  onClick,
}: {
  room: ChatRoom;
  active?: boolean;
  onClick: () => void;
}) {
  const lastMessage = room.messages[room.messages.length - 1];

  return (
    <button
      onClick={onClick}
      className={`w-full p-3 text-left border-b border-slate-700/50 transition-colors ${
        active ? "bg-slate-700/50" : "hover:bg-slate-800"
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-medium text-sm">{room.name}</span>
        {lastMessage && (
          <span className="text-xs text-slate-500">
            {format(new Date(lastMessage.timestamp), "a h:mm", { locale: ko })}
          </span>
        )}
      </div>
      {lastMessage && (
        <p className="text-xs text-slate-400 truncate">{lastMessage.content}</p>
      )}
    </button>
  );
}
