# Realtime Collaborative JSON/Text Editor (Yjs + Node.js WebSocket)

This project is a realtime collaborative JSON/text editor built using **Yjs (CRDT framework)** and a **Node.js WebSocket server**. Multiple clients can join a room, edit shared data, and automatically stay in sync.

## 📌 1. Requirements
- Node.js 16+
- npm
- Live Server (VS Code extension or any static server)

## 📌 2. Install Server Dependencies
```bash
npm install
```

## 📌 3. Run the WebSocket Server
```bash
node server.js
```
Server runs on: `ws://localhost:8080`

## 📌 4. Run the Client (HTML)
Open `client/client.html` using **Live Server**.

## 📌 5. Test Collaboration
- Open the client in two different tabs or browsers.
- In the first tab:
  - Click **Create Room**
  - Copy the generated **Room ID**
- In the second tab:
  - Paste the Room ID
  - Click **Join Room**
- Both clients are now connected to the same CRDT document.

### Patch Testing
- Select a patch type from the dropdown.
- Enter/edit JSON patch data.
- Click **Send update**.
- The patch is applied locally and synced to all connected clients.

## 📌 6. Architecture Decisions
- Yjs chosen for mature CRDT design, efficient encoding, and deterministic merges.
- Per-room `Y.Doc` keeps collaboration isolated.
- JSON-based WebSocket messages (Yjs updates Base64-encoded).
- Server is stateless except in-memory `Y.Doc`s.

## 📌 7. How Conflict Resolution Works
- Uses CRDT structs with per-client clocks for deterministic ordering.
- Concurrent edits auto-merge without conflicts.
- Delete sets ensure removed items don't reappear.
- Full state synced using `encodeStateAsUpdate()`, later updates incremental.
- `applyUpdate()` merges remote changes automatically.

## 📌 8. Project Structure
```
project/
  server/
    server.js
    package.json
  client/
    client.html
    client.js
```
