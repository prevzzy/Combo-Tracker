import http from 'http';
import { WebSocketServer } from 'ws';
import {
  addMessageToBuffer,
  setupBroadcastInterval,
  clearBroadcastInterval,
} from './messaging'
import { WS_CLIENT_MESSAGE_TYPES, WS_SERVER_MESSAGE_TYPES } from './wsMessageTypes';

let server;
let wss;
let hostUsername;

const sockets = new Set();

function getCurrentPlayerList() {
  return [
    hostUsername,
    ...Array.from(sockets).map(socket => socket.username)
  ]
}

export function getConnectedClients() {
  return wss && wss.clients;
}

function setupServer(server, username) {
  wss = new WebSocketServer({ server });
  hostUsername = username;

  wss.on('connection', (socket) => {
    console.log('[SERVER] NEW CONNECTION')
  
    socket.on('message', (message) => {
      handleMessageByType(message, socket, false)
    });

    socket.once('close', () => {
      console.log('[SERVER] PLAYER DISCONNECTED')
      console.log('before', sockets);
      sockets.delete(socket);
      console.log('after', sockets);

      addMessageToBuffer(
        WS_SERVER_MESSAGE_TYPES.PLAYER_LIST_UPDATE,
        getCurrentPlayerList()
      )
    });
  });
}

export function hostServer(username, onMessageCallback) {

  console.log(server);
  server = http.createServer();

  const port = 6969;
  const message = `[SERVER] ONLINE ON ${port}`
  setupServer(server, username);
  server.listen(port, () => {
    setupBroadcastInterval(onMessageCallback);
  });

  return message;
}

export function shutdownServer() {
  if (!server) {
    return;
  }

  clearBroadcastInterval();

  sockets.forEach(socket => {
    socket.close();
    sockets.delete(socket);
  });
  
  wss.close(() => {
    console.log('[SERVER] WSS SHUT DOWN');
    server.close(() => { console.log('[SERVER] HTTP SHUT DOWN') });

    server = undefined;
    wss = undefined;
    hostUsername = undefined;
  })
}

export function handleMessageByType(message, socket, isHost) {
  try {
    const { type, payload } = JSON.parse(message);

    switch (type) {
      case WS_CLIENT_MESSAGE_TYPES.LOGIN: {
        socket.username = payload.username;
        sockets.add(socket);

        addMessageToBuffer(
          WS_SERVER_MESSAGE_TYPES.PLAYER_LIST_UPDATE,
          getCurrentPlayerList()
        )
        return;
      }

      case WS_CLIENT_MESSAGE_TYPES.NEW_COMBO_DATA: {
        const username = isHost ? hostUsername : socket.username;

        addMessageToBuffer(
          WS_SERVER_MESSAGE_TYPES.COMBOS_UPDATE,
          { 
            username,
            comboData: payload,
          }
        )
        return;
      }

      default: {
        console.log(`[SERVER] unknown message type ${type}`)
        return;
      }
    }
  } catch(error) {
    console.log(error);
  }
}
