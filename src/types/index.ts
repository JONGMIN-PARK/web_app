export interface User {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "offline" | "away";
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: number;
  type: "text" | "file" | "system";
  fileInfo?: FileTransferInfo;
}

export interface FileTransferInfo {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  status: "pending" | "transferring" | "completed" | "failed";
  progress: number;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  timestamp: number;
  url?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  participants: User[];
  messages: ChatMessage[];
  lastActivity: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  members: User[];
  createdAt: number;
  updatedAt: number;
  status: "active" | "completed" | "archived";
  schedules: Schedule[];
}

export interface Schedule {
  id: string;
  projectId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  assignees: User[];
  status: "todo" | "in_progress" | "done";
  color: string;
  createdAt: number;
}

export type AppView = "dashboard" | "chat" | "files" | "projects" | "schedule";
