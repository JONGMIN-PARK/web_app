"use client";

import { useState } from "react";
import { useApp } from "@/store/AppContext";

export default function NicknameScreen() {
  const { setNickname } = useApp();
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setNickname(trimmed);
  }

  return (
    <div className="h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400 mb-2">P2P Collab</h1>
          <p className="text-slate-400">실시간 채팅 · 파일공유 · 프로젝트</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              닉네임을 입력하세요
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 홍길동"
              className="input-field text-base"
              maxLength={20}
              autoFocus
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim()}
            className="btn-primary w-full disabled:opacity-50"
          >
            입장하기
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 mt-4">
          같은 네트워크의 다른 사용자와 실시간으로 대화할 수 있습니다
        </p>
      </div>
    </div>
  );
}
