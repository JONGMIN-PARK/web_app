const { WebSocketServer } = require("ws");

const PORT = process.env.WS_PORT || 4000;
const wss = new WebSocketServer({ port: PORT });

// State
const rooms = new Map(); // roomId -> Set<ws>
const users = new Map(); // ws -> { id, name, roomIds }
const chatHistory = new Map(); // roomId -> messages[]

const DEFAULT_ROOMS = [
  { id: "general", name: "일반 채팅" },
  { id: "dev", name: "개발팀" },
  { id: "design", name: "디자인팀" },
];

// Initialize default rooms
DEFAULT_ROOMS.forEach((r) => {
  rooms.set(r.id, new Set());
  chatHistory.set(r.id, []);
});

function broadcast(roomId, data, excludeWs) {
  const room = rooms.get(roomId);
  if (!room) return;
  const msg = JSON.stringify(data);
  room.forEach((client) => {
    if (client !== excludeWs && client.readyState === 1) {
      client.send(msg);
    }
  });
}

function broadcastAll(data, excludeWs) {
  wss.clients.forEach((client) => {
    if (client !== excludeWs && client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
}

function getOnlineUsers() {
  const list = [];
  users.forEach((user) => {
    list.push({ id: user.id, name: user.name, status: "online" });
  });
  return list;
}

function getRoomList() {
  return DEFAULT_ROOMS.map((r) => ({
    id: r.id,
    name: r.name,
    participantCount: rooms.get(r.id)?.size || 0,
  }));
}

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (raw) => {
    let data;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      return;
    }

    switch (data.type) {
      case "register": {
        const userId = data.userId || `user-${Date.now()}`;
        const userName = data.name || "익명";
        users.set(ws, { id: userId, name: userName, roomIds: new Set() });

        // Auto-join all rooms
        DEFAULT_ROOMS.forEach((r) => {
          rooms.get(r.id).add(ws);
          users.get(ws).roomIds.add(r.id);
        });

        // Send initial data
        ws.send(
          JSON.stringify({
            type: "registered",
            userId,
            name: userName,
            rooms: getRoomList(),
            users: getOnlineUsers(),
          })
        );

        // Send chat history for each room
        DEFAULT_ROOMS.forEach((r) => {
          const history = chatHistory.get(r.id) || [];
          ws.send(
            JSON.stringify({
              type: "history",
              roomId: r.id,
              messages: history.slice(-100), // last 100
            })
          );
        });

        // Notify others
        broadcastAll(
          {
            type: "user_joined",
            user: { id: userId, name: userName, status: "online" },
            users: getOnlineUsers(),
          },
          ws
        );

        // System message
        DEFAULT_ROOMS.forEach((r) => {
          const sysMsg = {
            id: `sys-${Date.now()}-${r.id}`,
            senderId: "system",
            senderName: "시스템",
            content: `${userName}님이 입장했습니다.`,
            timestamp: Date.now(),
            type: "system",
            roomId: r.id,
          };
          chatHistory.get(r.id).push(sysMsg);
          broadcast(r.id, { type: "message", roomId: r.id, message: sysMsg }, ws);
        });
        break;
      }

      case "message": {
        const user = users.get(ws);
        if (!user) return;

        const msg = {
          id: data.id || `msg-${Date.now()}`,
          senderId: user.id,
          senderName: user.name,
          content: data.content,
          timestamp: Date.now(),
          type: "text",
          roomId: data.roomId,
        };

        const history = chatHistory.get(data.roomId);
        if (history) {
          history.push(msg);
          // Keep only last 500 messages per room
          if (history.length > 500) history.splice(0, history.length - 500);
        }

        // Broadcast to everyone in room (including sender for confirmation)
        const room = rooms.get(data.roomId);
        if (room) {
          const payload = JSON.stringify({ type: "message", roomId: data.roomId, message: msg });
          room.forEach((client) => {
            if (client.readyState === 1) {
              client.send(payload);
            }
          });
        }
        break;
      }

      case "typing": {
        const user = users.get(ws);
        if (!user) return;
        broadcast(
          data.roomId,
          {
            type: "typing",
            roomId: data.roomId,
            userId: user.id,
            userName: user.name,
          },
          ws
        );
        break;
      }
    }
  });

  ws.on("close", () => {
    const user = users.get(ws);
    if (user) {
      // Remove from all rooms
      user.roomIds.forEach((roomId) => {
        rooms.get(roomId)?.delete(ws);

        // System message
        const sysMsg = {
          id: `sys-${Date.now()}-${roomId}`,
          senderId: "system",
          senderName: "시스템",
          content: `${user.name}님이 퇴장했습니다.`,
          timestamp: Date.now(),
          type: "system",
          roomId,
        };
        chatHistory.get(roomId)?.push(sysMsg);
        broadcast(roomId, { type: "message", roomId, message: sysMsg });
      });

      users.delete(ws);

      // Notify others
      broadcastAll({
        type: "user_left",
        userId: user.id,
        users: getOnlineUsers(),
      });
    }
    console.log("Client disconnected");
  });
});

console.log(`WebSocket server running on ws://0.0.0.0:${PORT}`);
