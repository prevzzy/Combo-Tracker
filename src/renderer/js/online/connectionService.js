import {
  requestSendingWsMessage,
  requestServerHosting,
  requestConnectingToServer,
  requestServerShutdown,
  requestDisconnectingFromServer,
} from '../events/outgoingIpcEvents';
import { WS_CLIENT_MESSAGE_TYPES, WS_SERVER_MESSAGE_TYPES } from '../../../main/onlineCT/wsServer/wsMessageTypes';
import { updateDisplayedPlayerList, renderPlayersComboData, setDisplayedRoomId } from '../ui/onlineCT/uiOnlineCT'
import * as MemoryController from '../game/memory'
import { isLocalPlayer } from './playerInfoFlags';

let isHost = false;
let isConnected = false;
let playerList = [];
let playerName = '';

const messageHandlersByType = new Map([
  [WS_SERVER_MESSAGE_TYPES.COMBOS_UPDATE, updatePlayerCombos],
  [WS_CLIENT_MESSAGE_TYPES.NEW_COMBO_DATA, updatePlayerCombos],
  [WS_SERVER_MESSAGE_TYPES.PLAYER_LIST_UPDATE, updatePlayerList],
  [WS_SERVER_MESSAGE_TYPES.CONNECTED, onConnected]
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

export function getObservedPlayerName() {
  return !isLocalPlayer(MemoryController.getObservedPlayerFlags()) && MemoryController.getObservedPlayerName()
}

export function changeOnlineCTConnectionStatus(newIsConnected) {
  isConnected = newIsConnected;
}

export function connectToOnlineCT(isHosting, name, roomId, onConnectedCallback) {
  // TODO: error handling
  if (isHosting) {
    requestServerHosting(name)
  } else {
    requestConnectingToServer(name, roomId)
  }
  playerName = name;

  setIsHost(isHosting);
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

  const observedPlayer = getObservedPlayerName();

  requestSendingWsMessage({
    type: WS_CLIENT_MESSAGE_TYPES.NEW_COMBO_DATA,
    payload: {
      comboData,
      playerName,
    }
  }, isHost)
}

// function sendComboEndedSignal ??

function updatePlayerCombos(newComboData) {
  if (!isConnectedToOnlineCT()) {
    return;
  }

  renderPlayersComboData(newComboData);
}

function onConnected(data) {
  setDisplayedRoomId(data.roomId);
}

function updatePlayerList(newPlayerList) {
  if (!isConnectedToOnlineCT()) {
    return;
  }

  playerList = newPlayerList.players
  updateDisplayedPlayerList(playerList);
}

export function handleNewOnlineCTMessage(message) {
  // console.log(message);
  // const messageTypes = Object.keys(message);
  // if (!messageTypes.length) {
  //   return;
  // }

  // messageTypes.forEach((messageType) => {
  //   const handler = messageHandlersByType.get(messageType);

  //   if (handler) {
  //     handler(message[messageType])
  //   }
  // })

  const handler = messageHandlersByType.get(message.type);

  console.log(message.payload);
  if (handler) {
    handler(message.payload)
  }
}
