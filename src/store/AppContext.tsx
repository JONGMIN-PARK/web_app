"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import {
  User,
  ChatRoom,
  FileTransferInfo,
  Project,
  AppView,
  ChatMessage,
  Schedule,
} from "@/types";
import { v4 as uuidv4 } from "uuid";

interface AppState {
  currentUser: User;
  currentView: AppView;
  chatRooms: ChatRoom[];
  activeChatRoomId: string | null;
  fileTransfers: FileTransferInfo[];
  projects: Project[];
  activeProjectId: string | null;
  peers: User[];
}

type AppAction =
  | { type: "SET_VIEW"; payload: AppView }
  | { type: "SET_ACTIVE_CHAT"; payload: string }
  | { type: "ADD_CHAT_ROOM"; payload: ChatRoom }
  | { type: "ADD_MESSAGE"; payload: { roomId: string; message: ChatMessage } }
  | { type: "ADD_FILE_TRANSFER"; payload: FileTransferInfo }
  | {
      type: "UPDATE_FILE_TRANSFER";
      payload: { id: string; updates: Partial<FileTransferInfo> };
    }
  | { type: "ADD_PROJECT"; payload: Project }
  | { type: "UPDATE_PROJECT"; payload: { id: string; updates: Partial<Project> } }
  | { type: "DELETE_PROJECT"; payload: string }
  | { type: "SET_ACTIVE_PROJECT"; payload: string | null }
  | { type: "ADD_SCHEDULE"; payload: Schedule }
  | { type: "UPDATE_SCHEDULE"; payload: { id: string; updates: Partial<Schedule> } }
  | { type: "DELETE_SCHEDULE"; payload: { projectId: string; scheduleId: string } }
  | { type: "ADD_PEER"; payload: User }
  | { type: "REMOVE_PEER"; payload: string }
  | { type: "UPDATE_PEER_STATUS"; payload: { id: string; status: User["status"] } };

const currentUser: User = {
  id: uuidv4(),
  name: "나",
  status: "online",
};

const demoPeers: User[] = [
  { id: uuidv4(), name: "김민수", status: "online" },
  { id: uuidv4(), name: "이서연", status: "online" },
  { id: uuidv4(), name: "박지훈", status: "away" },
];

function createDemoData(user: User, peers: User[]): Partial<AppState> {
  const now = Date.now();

  const room1: ChatRoom = {
    id: uuidv4(),
    name: "일반 채팅",
    participants: [user, peers[0], peers[1]],
    messages: [
      {
        id: uuidv4(),
        senderId: peers[0].id,
        senderName: peers[0].name,
        content: "안녕하세요! 프로젝트 관련해서 이야기 나눠봐요.",
        timestamp: now - 3600000,
        type: "text",
      },
      {
        id: uuidv4(),
        senderId: peers[1].id,
        senderName: peers[1].name,
        content: "네, 좋습니다! 일정 확인했어요.",
        timestamp: now - 3500000,
        type: "text",
      },
      {
        id: uuidv4(),
        senderId: user.id,
        senderName: user.name,
        content: "기획안 파일 공유합니다.",
        timestamp: now - 3400000,
        type: "text",
      },
    ],
    lastActivity: now - 3400000,
  };

  const room2: ChatRoom = {
    id: uuidv4(),
    name: "개발팀",
    participants: [user, peers[2]],
    messages: [
      {
        id: uuidv4(),
        senderId: peers[2].id,
        senderName: peers[2].name,
        content: "API 설계 완료했습니다.",
        timestamp: now - 7200000,
        type: "text",
      },
    ],
    lastActivity: now - 7200000,
  };

  const project1: Project = {
    id: uuidv4(),
    name: "웹앱 리뉴얼",
    description: "기존 웹앱을 Next.js로 리뉴얼하는 프로젝트",
    members: [user, peers[0], peers[1]],
    createdAt: now - 86400000 * 7,
    updatedAt: now - 3600000,
    status: "active",
    schedules: [],
  };

  project1.schedules = [
    {
      id: uuidv4(),
      projectId: project1.id,
      title: "기획 완료",
      description: "전체 기획안 작성 및 검토",
      startDate: "2026-02-10",
      endDate: "2026-02-14",
      assignees: [user, peers[0]],
      status: "in_progress",
      color: "#3B82F6",
      createdAt: now - 86400000 * 5,
    },
    {
      id: uuidv4(),
      projectId: project1.id,
      title: "디자인 작업",
      description: "UI/UX 디자인",
      startDate: "2026-02-15",
      endDate: "2026-02-21",
      assignees: [peers[1]],
      status: "todo",
      color: "#8B5CF6",
      createdAt: now - 86400000 * 5,
    },
    {
      id: uuidv4(),
      projectId: project1.id,
      title: "프론트엔드 개발",
      description: "React 컴포넌트 개발",
      startDate: "2026-02-22",
      endDate: "2026-03-07",
      assignees: [user, peers[0]],
      status: "todo",
      color: "#10B981",
      createdAt: now - 86400000 * 5,
    },
  ];

  const project2: Project = {
    id: uuidv4(),
    name: "모바일 앱 MVP",
    description: "모바일 앱 최소 기능 제품 개발",
    members: [user, peers[2]],
    createdAt: now - 86400000 * 3,
    updatedAt: now - 86400000,
    status: "active",
    schedules: [
      {
        id: uuidv4(),
        projectId: "",
        title: "요구사항 분석",
        description: "사용자 요구사항 수집 및 분석",
        startDate: "2026-02-11",
        endDate: "2026-02-18",
        assignees: [user],
        status: "in_progress",
        color: "#F59E0B",
        createdAt: now - 86400000 * 2,
      },
    ],
  };
  project2.schedules[0].projectId = project2.id;

  const fileTransfers: FileTransferInfo[] = [
    {
      id: uuidv4(),
      fileName: "기획안_v2.pdf",
      fileSize: 2450000,
      fileType: "application/pdf",
      status: "completed",
      progress: 100,
      senderId: user.id,
      senderName: user.name,
      receiverId: peers[0].id,
      receiverName: peers[0].name,
      timestamp: now - 3400000,
    },
    {
      id: uuidv4(),
      fileName: "디자인_시안.fig",
      fileSize: 8900000,
      fileType: "application/figma",
      status: "completed",
      progress: 100,
      senderId: peers[1].id,
      senderName: peers[1].name,
      receiverId: user.id,
      receiverName: user.name,
      timestamp: now - 86400000,
    },
    {
      id: uuidv4(),
      fileName: "API_문서.docx",
      fileSize: 540000,
      fileType: "application/docx",
      status: "completed",
      progress: 100,
      senderId: peers[2].id,
      senderName: peers[2].name,
      receiverId: user.id,
      receiverName: user.name,
      timestamp: now - 7200000,
    },
  ];

  return {
    chatRooms: [room1, room2],
    projects: [project1, project2],
    fileTransfers,
  };
}

const demoData = createDemoData(currentUser, demoPeers);

const initialState: AppState = {
  currentUser,
  currentView: "dashboard",
  chatRooms: demoData.chatRooms || [],
  activeChatRoomId: null,
  fileTransfers: demoData.fileTransfers || [],
  projects: demoData.projects || [],
  activeProjectId: null,
  peers: demoPeers,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_VIEW":
      return { ...state, currentView: action.payload };
    case "SET_ACTIVE_CHAT":
      return { ...state, activeChatRoomId: action.payload };
    case "ADD_CHAT_ROOM":
      return { ...state, chatRooms: [...state.chatRooms, action.payload] };
    case "ADD_MESSAGE": {
      return {
        ...state,
        chatRooms: state.chatRooms.map((room) =>
          room.id === action.payload.roomId
            ? {
                ...room,
                messages: [...room.messages, action.payload.message],
                lastActivity: action.payload.message.timestamp,
              }
            : room
        ),
      };
    }
    case "ADD_FILE_TRANSFER":
      return {
        ...state,
        fileTransfers: [action.payload, ...state.fileTransfers],
      };
    case "UPDATE_FILE_TRANSFER":
      return {
        ...state,
        fileTransfers: state.fileTransfers.map((ft) =>
          ft.id === action.payload.id
            ? { ...ft, ...action.payload.updates }
            : ft
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
        activeProjectId:
          state.activeProjectId === action.payload
            ? null
            : state.activeProjectId,
      };
    case "SET_ACTIVE_PROJECT":
      return { ...state, activeProjectId: action.payload };
    case "ADD_SCHEDULE": {
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.projectId
            ? { ...p, schedules: [...p.schedules, action.payload] }
            : p
        ),
      };
    }
    case "UPDATE_SCHEDULE": {
      return {
        ...state,
        projects: state.projects.map((p) => ({
          ...p,
          schedules: p.schedules.map((s) =>
            s.id === action.payload.id ? { ...s, ...action.payload.updates } : s
          ),
        })),
      };
    }
    case "DELETE_SCHEDULE": {
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.projectId
            ? {
                ...p,
                schedules: p.schedules.filter(
                  (s) => s.id !== action.payload.scheduleId
                ),
              }
            : p
        ),
      };
    }
    case "ADD_PEER":
      return { ...state, peers: [...state.peers, action.payload] };
    case "REMOVE_PEER":
      return {
        ...state,
        peers: state.peers.filter((p) => p.id !== action.payload),
      };
    case "UPDATE_PEER_STATUS":
      return {
        ...state,
        peers: state.peers.map((p) =>
          p.id === action.payload.id
            ? { ...p, status: action.payload.status }
            : p
        ),
      };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}>({ state: initialState, dispatch: () => undefined });

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
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
