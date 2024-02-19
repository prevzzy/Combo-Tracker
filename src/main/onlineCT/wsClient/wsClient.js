import { WebSocket } from 'ws';

let ws

export function connectToServer(onMessageCallback, onOpenCallback) {
  if (ws) {
    ws.close();
  }

  ws = new WebSocket('ws://localhost:6969');
  ws.onopen = () => {
    console.log('[CLIENT] CONNECTED')
    onOpenCallback()
  }
  ws.onerror = (error) => {
    console.log('[CLIENT] CONNECTION ERROR', error)
  }
  ws.onmessage = ({ data }) => {
    console.log('[CLIENT] NEW MESSAGE:', data)
    onMessageCallback(data)
  };
  ws.onclose = () => {
    console.log('[CLIENT] DISCONNECTED')
    ws = null;
  } 
}

export function sendWsClientMessage(message, messageSendingErrorCallback) {
  if (!ws) {
    console.log('[CLIENT]', 'SEND MESSAGE ERROR - No ws connection');
    messageSendingErrorCallback('no ws connection')
  }

  console.log('[CLIENT] SENDING:', message)
  
  try {
    ws.send(JSON.stringify(message));
  } catch(error) {
    messageSendingErrorCallback('[CLIENT] error sending message', error)
  }
}

export function disconnectFromServer() {
  if (!ws) {
    return;
  }

  ws.close()
}
