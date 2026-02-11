"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import {
  User,
  ChatRoom,
  FileTransferInfo,
  Project,
  AppView,
  ChatMessage,
  Schedule,
} from "@/types";
import { useWebSocket, WsMessage, WsUser, WsRoom } from "@/hooks/useWebSocket";

interface AppState {
  currentUser: User;
  currentView: AppView;
  chatRooms: ChatRoom[];
  activeChatRoomId: string | null;
  fileTransfers: FileTransferInfo[];
  projects: Project[];
  activeProjectId: string | null;
  peers: User[];
  nickname: string | null; // null = not set yet
  wsConnected: boolean;
  typingUsers: Record<string, string>; // roomId -> "name is typing..."
}

type AppAction =
  | { type: "SET_VIEW"; payload: AppView }
  | { type: "SET_ACTIVE_CHAT"; payload: string }
  | { type: "SET_NICKNAME"; payload: string }
  | { type: "SET_USER"; payload: { id: string; name: string } }
  | { type: "SET_ROOMS"; payload: WsRoom[] }
  | { type: "SET_PEERS"; payload: User[] }
  | { type: "ADD_PEER"; payload: User }
  | { type: "REMOVE_PEER"; payload: string }
  | { type: "ADD_MESSAGE"; payload: { roomId: string; message: ChatMessage } }
  | { type: "SET_ROOM_MESSAGES"; payload: { roomId: string; messages: ChatMessage[] } }
  | { type: "SET_WS_CONNECTED"; payload: boolean }
  | { type: "SET_TYPING"; payload: { roomId: string; text: string } }
  | { type: "ADD_FILE_TRANSFER"; payload: FileTransferInfo }
  | { type: "UPDATE_FILE_TRANSFER"; payload: { id: string; updates: Partial<FileTransferInfo> } }
  | { type: "ADD_PROJECT"; payload: Project }
  | { type: "UPDATE_PROJECT"; payload: { id: string; updates: Partial<Project> } }
  | { type: "DELETE_PROJECT"; payload: string }
  | { type: "SET_ACTIVE_PROJECT"; payload: string | null }
  | { type: "ADD_SCHEDULE"; payload: Schedule }
  | { type: "UPDATE_SCHEDULE"; payload: { id: string; updates: Partial<Schedule> } }
  | { type: "DELETE_SCHEDULE"; payload: { projectId: string; scheduleId: string } };

const NICK_KEY = "p2p-collab-nickname";

function getSavedNickname(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(NICK_KEY);
}

function saveNickname(name: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NICK_KEY, name);
}

const initialState: AppState = {
  currentUser: { id: "", name: "", status: "online" },
  currentView: "dashboard",
  chatRooms: [],
  activeChatRoomId: null,
  fileTransfers: [],
  projects: [],
  activeProjectId: null,
  peers: [],
  nickname: null,
  wsConnected: false,
  typingUsers: {},
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_VIEW":
      return { ...state, currentView: action.payload };
    case "SET_ACTIVE_CHAT":
      return { ...state, activeChatRoomId: action.payload || null };
    case "SET_NICKNAME":
      return { ...state, nickname: action.payload };
    case "SET_USER":
      return {
        ...state,
        currentUser: { id: action.payload.id, name: action.payload.name, status: "online" },
      };
    case "SET_ROOMS": {
      const existingMessages: Record<string, ChatMessage[]> = {};
      state.chatRooms.forEach((r) => {
        existingMessages[r.id] = r.messages;
      });
      return {
        ...state,
        chatRooms: action.payload.map((r) => ({
          id: r.id,
          name: r.name,
          participants: [],
          messages: existingMessages[r.id] || [],
          lastActivity: Date.now(),
        })),
      };
    }
    case "SET_PEERS":
      return { ...state, peers: action.payload };
    case "ADD_PEER": {
      if (state.peers.find((p) => p.id === action.payload.id)) return state;
      return { ...state, peers: [...state.peers, action.payload] };
    }
    case "REMOVE_PEER":
      return { ...state, peers: state.peers.filter((p) => p.id !== action.payload) };
    case "ADD_MESSAGE": {
      const { roomId, message } = action.payload;
      const roomExists = state.chatRooms.some((r) => r.id === roomId);
      if (!roomExists) return state;
      // Deduplicate by message id
      const room = state.chatRooms.find((r) => r.id === roomId)!;
      if (room.messages.some((m) => m.id === message.id)) return state;
      return {
        ...state,
        chatRooms: state.chatRooms.map((r) =>
          r.id === roomId
            ? { ...r, messages: [...r.messages, message], lastActivity: message.timestamp }
            : r
        ),
      };
    }
    case "SET_ROOM_MESSAGES": {
      return {
        ...state,
        chatRooms: state.chatRooms.map((r) =>
          r.id === action.payload.roomId
            ? { ...r, messages: action.payload.messages }
            : r
        ),
      };
    }
    case "SET_WS_CONNECTED":
      return { ...state, wsConnected: action.payload };
    case "SET_TYPING":
      return {
        ...state,
        typingUsers: { ...state.typingUsers, [action.payload.roomId]: action.payload.text },
      };
    case "ADD_FILE_TRANSFER":
      return { ...state, fileTransfers: [action.payload, ...state.fileTransfers] };
    case "UPDATE_FILE_TRANSFER":
      return {
        ...state,
        fileTransfers: state.fileTransfers.map((ft) =>
          ft.id === action.payload.id ? { ...ft, ...action.payload.updates } : ft
        ),
      };
    case "ADD_PROJECT":
      return { ...state, projects: [...state.projects, action.payload] };
    case "UPDATE_PROJECT":
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        ),
      };
    case "DELETE_PROJECT":
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.payload),
        activeProjectId: state.activeProjectId === action.payload ? null : state.activeProjectId,
      };
    case "SET_ACTIVE_PROJECT":
      return { ...state, activeProjectId: action.payload };
    case "ADD_SCHEDULE":
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.projectId
            ? { ...p, schedules: [...p.schedules, action.payload] }
            : p
        ),
      };
    case "UPDATE_SCHEDULE":
      return {
        ...state,
        projects: state.projects.map((p) => ({
          ...p,
          schedules: p.schedules.map((s) =>
            s.id === action.payload.id ? { ...s, ...action.payload.updates } : s
          ),
        })),
      };
    case "DELETE_SCHEDULE":
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.projectId
            ? { ...p, schedules: p.schedules.filter((s) => s.id !== action.payload.scheduleId) }
            : p
        ),
      };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  sendMessage: (roomId: string, content: string, id: string) => void;
  sendTyping: (roomId: string) => void;
  setNickname: (name: string) => void;
}

const AppContext = createContext<AppContextType>({
  state: initialState,
  dispatch: () => undefined,
  sendMessage: () => undefined,
  sendTyping: () => undefined,
  setNickname: () => undefined,
});

function wsMessageToChatMessage(msg: WsMessage): ChatMessage {
  return {
    id: msg.id,
    senderId: msg.senderId,
    senderName: msg.senderName,
    content: msg.content,
    timestamp: msg.timestamp,
    type: msg.type,
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load nickname on mount
  useEffect(() => {
    const saved = getSavedNickname();
    if (saved) {
      dispatch({ type: "SET_NICKNAME", payload: saved });
    }
  }, []);

  const onRegistered = useCallback(
    (data: { userId: string; name: string; rooms: WsRoom[]; users: WsUser[] }) => {
      dispatch({ type: "SET_USER", payload: { id: data.userId, name: data.name } });
      dispatch({ type: "SET_ROOMS", payload: data.rooms });
      dispatch({
        type: "SET_PEERS",
        payload: data.users.map((u) => ({ id: u.id, name: u.name, status: u.status })),
      });
    },
    []
  );

  const onMessage = useCallback((roomId: string, message: WsMessage) => {
    dispatch({
      type: "ADD_MESSAGE",
      payload: { roomId, message: wsMessageToChatMessage(message) },
    });
  }, []);

  const onHistory = useCallback((roomId: string, messages: WsMessage[]) => {
    dispatch({
      type: "SET_ROOM_MESSAGES",
      payload: { roomId, messages: messages.map(wsMessageToChatMessage) },
    });
  }, []);

  const onUserJoined = useCallback((_user: WsUser, allUsers: WsUser[]) => {
    dispatch({
      type: "SET_PEERS",
      payload: allUsers.map((u) => ({ id: u.id, name: u.name, status: u.status })),
    });
  }, []);

  const onUserLeft = useCallback((_userId: string, allUsers: WsUser[]) => {
    dispatch({
      type: "SET_PEERS",
      payload: allUsers.map((u) => ({ id: u.id, name: u.name, status: u.status })),
    });
  }, []);

  const onTyping = useCallback((roomId: string, userName: string) => {
    dispatch({ type: "SET_TYPING", payload: { roomId, text: `${userName}님이 입력 중...` } });
    setTimeout(() => {
      dispatch({ type: "SET_TYPING", payload: { roomId, text: "" } });
    }, 2000);
  }, []);

  const onConnectionChange = useCallback((connected: boolean) => {
    dispatch({ type: "SET_WS_CONNECTED", payload: connected });
  }, []);

  const { register, sendMessage, sendTyping } = useWebSocket({
    onRegistered,
    onMessage,
    onHistory,
    onUserJoined,
    onUserLeft,
    onTyping,
    onConnectionChange,
  });

  const setNickname = useCallback(
    (name: string) => {
      saveNickname(name);
      dispatch({ type: "SET_NICKNAME", payload: name });
      register(name);
    },
    [register]
  );

  // Auto-register if nickname already saved
  useEffect(() => {
    const saved = getSavedNickname();
    if (saved) {
      register(saved);
    }
  }, [register]);

  return (
    <AppContext.Provider value={{ state, dispatch, sendMessage, sendTyping, setNickname }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
