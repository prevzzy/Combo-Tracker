import {
  requestSendingWsMessage,
  requestServerHosting,
  requestConnectingToServer,
  requestServerShutdown,
  requestDisconnectingFromServer,
} from '../events/outgoingIpcEvents';
import { WS_CLIENT_MESSAGE_TYPES, WS_SERVER_MESSAGE_TYPES } from '../../../main/onlineCT/wsServer/wsMessageTypes';
import { updateDisplayedPlayerList, renderPlayersComboData } from '../ui/onlineCT/uiOnlineCT'

let isHost = false;
let isConnected = false;
let playerList = [];

const messageHandlersByType = new Map([
  [WS_SERVER_MESSAGE_TYPES.COMBOS_UPDATE, updatePlayerCombos],
  [WS_SERVER_MESSAGE_TYPES.PLAYER_LIST_UPDATE, updatePlayerList]
])

function restart() {
  isHost = false;
  isConnected = false;
  playerList = [];
}

export function setIsHost(value) {
  isHost = value
}

export function isConnectedToOnlineCT() {
  return isConnected;
}

export function changeOnlineCTConnectionStatus(newIsConnected) {
  isConnected = newIsConnected;
}

export function connectToOnlineCT(isHost, username, roomCode, onConnectedCallback) {
  // TODO: error handling - ogólnie to trzeba by było czekać na response po dołączeniu/zahostowaniu z icp eventu i wtedy callbackiem na to reagować
  if (isHost) {
    requestServerHosting(username)
  } else {
    requestConnectingToServer(username, roomCode)
  }

  setIsHost(isHost);
  changeOnlineCTConnectionStatus(true);
  onConnectedCallback();
}

export function disconnectFromOnlineCT(onDisconnectedCallback) {
  changeOnlineCTConnectionStatus(false);

  if (isHost) {
    requestServerShutdown();
  } else {
    requestDisconnectingFromServer();
  }

  restart();
  onDisconnectedCallback();
}

// score, multiplier, base, balance position
export function sendNewComboData(comboData) {
  if (!isConnectedToOnlineCT()) {
    return;
  }

  requestSendingWsMessage({
    type: WS_CLIENT_MESSAGE_TYPES.NEW_COMBO_DATA,
    payload: comboData
  }, isHost)
}

// function sendComboEndedSignal ??

function updatePlayerCombos(newComboData) {
  if (!isConnectedToOnlineCT()) {
    return;
  }

  renderPlayersComboData(newComboData);
}

function updatePlayerList(newPlayerList) {
  if (!isConnectedToOnlineCT()) {
    return;
  }

  playerList = newPlayerList.players
  updateDisplayedPlayerList(playerList);
}

export function handleNewOnlineCTMessage(message) {
  const messageTypes = Object.keys(message);
  if (!messageTypes.length) {
    return;
  }

  messageTypes.forEach((messageType) => {
    const handler = messageHandlersByType.get(messageType);

    if (handler) {
      handler(message[messageType])
    }
  })
}
