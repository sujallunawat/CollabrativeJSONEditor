// server.js
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const Y = require('yjs');

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

const rooms = new Map();

function ensureRoom(roomId) {
  if (!rooms.has(roomId)) {
    const ydoc = new Y.Doc();
    rooms.set(roomId, { doc: ydoc, clients: new Set() });
  }
  return rooms.get(roomId);
}

function safeSend(ws, obj) {
  try {
    ws.send(JSON.stringify(obj));
  } catch (e) {
    console.error('safeSend error', e);
  }
}

function toBase64(uint8) {
  return Buffer.from(uint8).toString('base64');
}
function fromBase64(base64) {
  return Buffer.from(base64, 'base64');
}

wss.on('connection', (ws) => {
  ws.id = uuidv4();
  ws.roomId = null;
  ws.clientName = null;

 
  safeSend(ws, { type: 'hello', clientId: ws.id });

  ws.on('message', (message) => {
    let msg;
    try { msg = JSON.parse(message); } catch (e) {
      return safeSend(ws, { type: 'error', message: 'Invalid JSON' });
    }

    const { type } = msg;

  
    if (type === 'create_room') {
      const newRoomId = uuidv4();
      ensureRoom(newRoomId);
      console.log(`Room created: ${newRoomId}`);
      return safeSend(ws, { type: 'room_created', roomId: newRoomId });
    }

    // join room
    if (type === 'join') {
      const roomId = msg.room;
      const clientName = msg.name || 'Anonymous';
      if (!roomId) return safeSend(ws, { type: 'error', message: 'Missing room' });
      if (!rooms.has(roomId)) return safeSend(ws, { type: 'error', message: 'Room not found' });

      const room = ensureRoom(roomId);
      room.clients.add(ws);
      ws.roomId = roomId;
      ws.clientName = clientName;

      // console.log(` ${ws.clientName} (${ws.id})  ${roomId}`);

      try {
        const stateUpdate = Y.encodeStateAsUpdate(room.doc);
        const base64 = toBase64(stateUpdate);
        safeSend(ws, { type: 'full_state_crdt', room: roomId, update: base64 });
      } catch (e) {
        console.error('encodeStateAsUpdate error', e);
        safeSend(ws, { type: 'error', message: 'Failed to send full state' });
      }
      return;
    }


    if (type === 'update_crdt') {
      const roomId = msg.room || ws.roomId;
      if (!roomId) return safeSend(ws, { type: 'error', message: 'Not in a room' });

      const room = rooms.get(roomId);
      if (!room) return safeSend(ws, { type: 'error', message: 'Room not found' });
      if (!msg.update) return safeSend(ws, { type: 'error', message: 'Missing update' });

      try {
        const updateBuf = fromBase64(msg.update);
        Y.applyUpdate(room.doc, updateBuf);

        
        for (const client of room.clients) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            safeSend(client, {
              type: 'remote_update_crdt',
              room: roomId,
              update: msg.update,
              clientId: ws.id,
              clientName: ws.clientName
            });
          }
        }

        safeSend(ws, { type: 'ack', room: roomId });
      } catch (e) {
        console.error('applyUpdate error', e);
        safeSend(ws, { type: 'error', message: 'Failed to apply update' });
      }
      return;
    }

    // request full state on demand
    if (type === 'get_state') {
      const roomId = msg.room || ws.roomId;
      if (!roomId) return safeSend(ws, { type: 'error', message: 'Not in a room' });
      const room = rooms.get(roomId);
      if (!room) return safeSend(ws, { type: 'error', message: 'Room not found' });
      try {
        const stateUpdate = Y.encodeStateAsUpdate(room.doc);
        const base64 = toBase64(stateUpdate);
        safeSend(ws, { type: 'full_state_crdt', room: roomId, update: base64 });
      } catch (e) {
        safeSend(ws, { type: 'error', message: 'Failed to get state' });
      }
      return;
    }

    safeSend(ws, { type: 'error', message: 'Unknown message type' });
  });

  ws.on('close', () => {
    const roomId = ws.roomId;
    if (roomId && rooms.has(roomId)) {
      const room = rooms.get(roomId);
      room.clients.delete(ws);
      console.log(`Client ${ws.clientName || ws.id} disconnected from ${roomId}. remaining: ${room.clients.size}`);
    } else {
      console.log(`Client ${ws.id} disconnected`);
    }
  });
});

console.log(`Yjs WebSocket server running on ws://localhost:${PORT}`);
