"use client";

import { useEffect, useRef, useCallback, useState } from "react";

export interface WsMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: "text" | "file" | "system";
  roomId: string;
}

export interface WsUser {
  id: string;
  name: string;
  status: "online" | "offline" | "away";
}

export interface WsRoom {
  id: string;
  name: string;
  participantCount: number;
}

type WsEventHandler = {
  onRegistered?: (data: {
    userId: string;
    name: string;
    rooms: WsRoom[];
    users: WsUser[];
  }) => void;
  onMessage?: (roomId: string, message: WsMessage) => void;
  onHistory?: (roomId: string, messages: WsMessage[]) => void;
  onUserJoined?: (user: WsUser, allUsers: WsUser[]) => void;
  onUserLeft?: (userId: string, allUsers: WsUser[]) => void;
  onTyping?: (roomId: string, userName: string) => void;
  onConnectionChange?: (connected: boolean) => void;
};

export function useWebSocket(handlers: WsEventHandler) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef(handlers);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const [connected, setConnected] = useState(false);

  handlersRef.current = handlers;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      handlersRef.current.onConnectionChange?.(true);
    };

    ws.onclose = () => {
      setConnected(false);
      handlersRef.current.onConnectionChange?.(false);
      // Reconnect after 2s
      reconnectTimer.current = setTimeout(connect, 2000);
    };

    ws.onerror = () => {
      ws.close();
    };

    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (data.type) {
        case "registered":
          handlersRef.current.onRegistered?.(data);
          break;
        case "message":
          handlersRef.current.onMessage?.(data.roomId, data.message);
          break;
        case "history":
          handlersRef.current.onHistory?.(data.roomId, data.messages);
          break;
        case "user_joined":
          handlersRef.current.onUserJoined?.(data.user, data.users);
          break;
        case "user_left":
          handlersRef.current.onUserLeft?.(data.userId, data.users);
          break;
        case "typing":
          handlersRef.current.onTyping?.(data.roomId, data.userName);
          break;
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, []);

  const register = useCallback((name: string) => {
    connect();
    // Wait for connection then register
    const tryRegister = () => {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "register", name }));
      } else {
        setTimeout(tryRegister, 100);
      }
    };
    tryRegister();
  }, [connect]);

  const sendMessage = useCallback((roomId: string, content: string, id: string) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "message", roomId, content, id }));
    }
  }, []);

  const sendTyping = useCallback((roomId: string) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "typing", roomId }));
    }
  }, []);

  return { connected, register, sendMessage, sendTyping };
}
