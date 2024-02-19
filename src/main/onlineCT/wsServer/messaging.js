import { WS_SERVER_MESSAGE_TYPES } from './wsMessageTypes';
import { getConnectedClients } from './wsServer';
import { WebSocket } from 'ws';

const BROADCAST_INTERVAL_VALUE = 1000;
let broadcastInterval;
let messageBuffer = {}; // type, data

/*
  {
    type: COMBO_UPDATE,
    data: {
      combos: { username: comboData }
    }
  }
*/

/*
  {
    type: PLAYER_LIST_UPDATE,
    data: {
      players: Array<string>
    }
  }
*/

// w message bufferze powinna być tylko jedna wiadomość danego typu
export function addMessageToBuffer(type, payload) {
  if (!broadcastInterval) {
    return;
  }

  if (!messageBuffer[type]) {
    messageBuffer[type] = {}
  }

  switch (type) {
    case WS_SERVER_MESSAGE_TYPES.COMBOS_UPDATE: {
      messageBuffer[type][payload.username] = { comboData: payload.comboData }
      return;
    }

    case WS_SERVER_MESSAGE_TYPES.PLAYER_LIST_UPDATE: {
      messageBuffer[type] = { players: payload }
      return;
    }

    default: {
      return;
    }
  }
}

export function broadcast(clients, message) {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export function setupBroadcastInterval(onMessageCallback) {
  console.log(broadcastInterval);
  if (broadcastInterval) {
    return;
  }

  broadcastInterval = setInterval(() => {
    const clients = getConnectedClients();
    if (!Object.keys(messageBuffer).length || !clients) {
      console.log('[SERVER]: no new messages in last interval')
      return;
    }

    console.log(`[SERVER]: ${Object.keys(messageBuffer).length} new messages in last interval. Broadcasting`)

    const batchedData = JSON.stringify(messageBuffer);
    messageBuffer = {};

// Convert the string to a Buffer
const buffer = Buffer.from(batchedData, 'utf-8');

// Get the size in bytes
const sizeInBytes = buffer.length;

console.log(`Size in bytes: ${sizeInBytes} bytes`);
    
    broadcast(clients, batchedData);
    // Also send data to host's renderer process
    onMessageCallback(batchedData)
  }, BROADCAST_INTERVAL_VALUE);
}

export function clearBroadcastInterval() {
  clearInterval(broadcastInterval);
  broadcastInterval = undefined;
}
