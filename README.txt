#This project is a realtime collaborative JSON/text editor built using Yjs (CRDT framework) and a Node.js WebSocket server. Multiple clients can join a room, edit shared data, and automatically stay in sync.

-------------------------
1. Requirements
-------------------------
- Node.js 16+
- npm
- Live Server (VS Code extension or any static server)

-------------------------
2. Install Server Dependencies
-------------------------
npm install

-------------------------
3. Run the WebSocket Server
-------------------------
node server.js

Server runs on: ws://localhost:8080

-------------------------
4. Run the Client (HTML)
-------------------------
Open client/client.html using Live Server.

-------------------------
5. Test Collaboration
-------------------------

- Open the client in two different tabs or browsers.
- In the first tab:
  • Click "Create Room".
  • Copy the generated Room ID.
- In the second tab:
  • Paste the Room ID.
  • Click "Join Room".
- Now both clients are connected to the same CRDT document.

Patch Testing:
- In either tab:
  • Select a patch type from the dropdown.
  • Enter/edit JSON patch data.
  • Click "Send update".
- The patch is applied locally and synced to all connected clients immediately.

-------------------------
6. Architecture Decisions 
-------------------------
- Yjs chosen for its mature CRDT design, efficient encoding, small update size, and deterministic merges.
- Per-room Y.Doc instances keep collaboration isolated and avoid global state conflicts.
- JSON-based WebSocket messages used for easier debugging, so binary CRDT updates are Base64-encoded.
- Server is stateless except for in-memory Y.Docs; no persistence layer included for simplicity.

-------------------------
7. How Conflict Resolution Works
-------------------------
- Yjs uses CRDT structs with per-client clocks, ensuring deterministic ordering without locks.
- Concurrent edits are merged based on struct identifiers, ensuring no hard conflicts or overwrites.
- Delete sets ensure removed items don't reappear after merges.
- Full state is sent once via encodeStateAsUpdate(); subsequent updates are incremental.
- applyUpdate() integrates remote changes without diffs, patches, or version tracking overhead.

-------------------------
8. Project Structure
-------------------------
project/
  server/
    server.js
    package.json
  client/
    client.html
    client.js
