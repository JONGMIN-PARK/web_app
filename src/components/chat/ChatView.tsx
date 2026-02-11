"use client";

import { useState, useRef, useEffect } from "react";
import { useApp } from "@/store/AppContext";
import { ChatRoom } from "@/types";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export default function ChatView() {
  const { state, dispatch, sendMessage, sendTyping } = useApp();
  const [messageInput, setMessageInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();

  const activeRoom = state.chatRooms.find(
    (r) => r.id === state.activeChatRoomId
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeRoom?.messages]);

  function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!messageInput.trim() || !activeRoom) return;

    const id = uuidv4();
    sendMessage(activeRoom.id, messageInput.trim(), id);
    setMessageInput("");
  }

  function handleInputChange(value: string) {
    setMessageInput(value);
    if (!activeRoom) return;

    // Throttle typing indicator
    if (!typingTimer.current) {
      sendTyping(activeRoom.id);
      typingTimer.current = setTimeout(() => {
        typingTimer.current = undefined;
      }, 2000);
    }
  }

  function handleBack() {
    dispatch({ type: "SET_ACTIVE_CHAT", payload: "" });
  }

  const showChat = !!state.activeChatRoomId && !!activeRoom;
  const typingText = activeRoom ? state.typingUsers[activeRoom.id] : "";

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Room list */}
      <div
        className={`w-full md:w-80 border-r border-slate-700 flex flex-col flex-shrink-0 ${
          showChat ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-bold">채팅</h2>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                state.wsConnected ? "bg-green-400" : "bg-red-400"
              }`}
            />
            <span className="text-xs text-slate-400">
              {state.wsConnected ? "연결됨" : "연결 중..."}
            </span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {state.chatRooms.length === 0 && (
            <div className="p-4 text-center text-slate-500 text-sm">
              {state.wsConnected
                ? "채팅방 로딩 중..."
                : "서버에 연결 중..."}
            </div>
          )}
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
          {/* Header */}
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
                  접속자 {state.peers.length}명
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
            {activeRoom?.messages.map((msg) => {
              const isMe = msg.senderId === state.currentUser.id;
              const isSystem = msg.type === "system";

              if (isSystem) {
                return (
                  <div key={msg.id} className="text-center">
                    <span className="text-xs text-slate-500 bg-slate-800/50 px-3 py-1 rounded-full">
                      {msg.content}
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] md:max-w-md`}>
                    {!isMe && (
                      <div className="text-xs text-slate-400 mb-1">
                        {msg.senderName}
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-3 py-2 md:px-4 ${
                        isMe
                          ? "bg-blue-600 text-white"
                          : "bg-slate-700 text-slate-100"
                      }`}
                    >
                      <p className="text-sm break-words">{msg.content}</p>
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

          {/* Typing indicator */}
          {typingText && (
            <div className="px-4 py-1">
              <span className="text-xs text-slate-400 italic">{typingText}</span>
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 md:p-4 border-t border-slate-700"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={
                  state.wsConnected
                    ? "메시지를 입력하세요..."
                    : "서버 연결 중..."
                }
                disabled={!state.wsConnected}
                className="input-field flex-1 text-base disabled:opacity-50"
              />
              <button
                type="submit"
                className="btn-primary whitespace-nowrap disabled:opacity-50"
                disabled={!state.wsConnected || !messageInput.trim()}
              >
                전송
              </button>
            </div>
          </form>
        </div>
      ) : (
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
