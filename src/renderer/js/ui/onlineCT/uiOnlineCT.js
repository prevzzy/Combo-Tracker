import { createElementFromTemplate, setActiveNavigationClasses, setItemDisplay } from '../uiHelpers';
import { connectToOnlineCT, disconnectFromOnlineCT } from '../../online/connectionService';
import { drawHighscoreStats } from '../uiHighscores';
import { setErrorIconByStatus } from '../globalError';
import { log } from '../../debug/debugHelpers';
import { requestShowingOverlay } from '../../events/outgoingIpcEvents';

let isHosting = true;
let isConnecting = false;
let playersComboElementsByName = new Map()

const hostRoomOption = document.getElementById('host-room-option')
const connectToRoomOption = document.getElementById('connect-to-room-option')
const usernameInput = document.getElementById('online-username-input')
const roomIdInput = document.getElementById('online-room-id-input')
const submitLoginButton = document.getElementById('online-submit-login-button')
const onlineLoginPanelView = document.getElementById('online-login-panel')
const onlineRoomView = document.getElementById('online-room')
const onlineRoomScoreboardBody = document.getElementById('online-scoreboard-body')
const onlineConnectionType = document.getElementById('online-connection-type')
const onlineDisconnectButton = document.getElementById('online-disconnect-button')
const overlayButton = document.getElementById('overlay-window-button')
const roomIdElement = document.getElementById('online-room-id');

function init() {
  hostRoomOption.addEventListener('click', (e) => { onLoginTypeChange(e, true) });
  connectToRoomOption.addEventListener('click', (e) => { onLoginTypeChange(e, false) });
  submitLoginButton.addEventListener('click', onSubmitLoginClick);
  onlineDisconnectButton.addEventListener('click', onDisconnectButtonClick)
  overlayButton.addEventListener('click', requestShowingOverlay)
}

function restart() {
  playersComboElementsByName = new Map()
  goToOnlineLoginPanelView()
  onlineRoomScoreboardBody.innerHTML = ''
}

function onLoginTypeChange(e, isHostValue) {
  if (isConnecting) {
    return;
  }

  [hostRoomOption, connectToRoomOption].forEach((option) => {
    setActiveNavigationClasses(option, e.currentTarget);
  })

  isHosting = isHostValue;

  if (isHosting) {
    setItemDisplay(roomIdInput.parentElement, 'none');
    submitLoginButton.textContent = 'Host room';
  } else {
    setItemDisplay(roomIdInput.parentElement, 'block');
    submitLoginButton.textContent = 'Connect to room';
  }
}

function onSubmitLoginClick(e) {
  // TODO: validate inputs, append validation boxes with adjustTextInputUI
  let roomCode;
  const username = usernameInput.value;
  
  if (!isHosting) {
    roomCode = roomIdInput.value;
  }

  // go to connectionService
  isConnecting = true;
  submitLoginButton.disabled = true;
  try {
    connectToOnlineCT(isHosting, username, roomCode, goToOnlineRoomView);
  } catch(error) {
    // TODO: display errors and such
  } finally {
    // change ui
    isConnecting = false;
    submitLoginButton.disabled = false;

    onlineConnectionType.textContent = isHosting ? 'as host' : 'as user'
  }
}

function onDisconnectButtonClick() {
  onlineDisconnectButton.disabled = true;
  disconnectFromOnlineCT(restart);
  onlineDisconnectButton.disabled = false;
}

function goToOnlineRoomView() {
  setItemDisplay(onlineLoginPanelView, 'none');
  setItemDisplay(onlineRoomView, 'block');
}

function goToOnlineLoginPanelView() {
  setItemDisplay(onlineRoomView, 'none');
  setItemDisplay(onlineLoginPanelView, 'block');
}

function updateDisplayedPlayerList(playerList) {
  const disconnectedPlayers = findElementsInFirstArrayNotInSecond(
    Array.from(playersComboElementsByName.keys()),
    playerList,
  )
  const newlyConnectedPlayers = findElementsInFirstArrayNotInSecond(
    playerList,
    Array.from(playersComboElementsByName.keys()),
  )

  removePlayerComboElements(disconnectedPlayers);
  addNewPlayerComboElements(newlyConnectedPlayers);
}

function removePlayerComboElements(disconnectedPlayers) {
  disconnectedPlayers.forEach(playerName => {
    const playerElementToRemove = playersComboElementsByName.get(playerName);
    
    if (playerElementToRemove) {
      playersComboElementsByName.delete(playerName);
      playerElementToRemove.remove();
    }
  })
}

function addNewPlayerComboElements(newlyConnectedPlayers) {
  const newPlayerListElementsArray = newlyConnectedPlayers.map(playerName => {
    const playerElement = createElementFromTemplate('online-player').firstElementChild;

    playerElement.querySelector('.online-player-name').textContent = playerName
    const waitingIconElement = playerElement.querySelector('.online-player-waiting-for-combo-icon');

    setErrorIconByStatus(waitingIconElement, 2)
    setPlayerComboElement(playerName, playerElement)

    return playerElement;
  })
  
  onlineRoomScoreboardBody.append(...newPlayerListElementsArray)
}

function setPlayerComboElement(playerName, playerElement) {
  playersComboElementsByName.set(playerName, playerElement);
}

function setDisplayedRoomId(roomId) {
  roomIdElement.textContent = roomId;
}

function findElementsInFirstArrayNotInSecond(array1, array2) {
  return array1.map(item1 => {
    if (!array2.find(item2 => item2 === item1)) {
      return item1;
    }
  }).filter(Boolean);
}

function renderPlayersComboData(updatedCombo) {
  const {
    playerName,
    comboData,
  } = updatedCombo

  // Object.keys(updatedCombo).forEach(playerName => {
    if (!playersComboElementsByName.has(playerName)) {
      log(`${playerName} couldn't be found in current online players list`)
      return;
    }

    const playerElement = playersComboElementsByName.get(playerName);
    const waitingForComboElement = playerElement.lastElementChild;

    if (waitingForComboElement && waitingForComboElement.style.display === 'flex') {
      setItemDisplay(waitingForComboElement, 'none')
    }

    drawHighscoreStats(playerElement, comboData)
  // });
}

export {
  init,
  updateDisplayedPlayerList,
  renderPlayersComboData,
  setDisplayedRoomId,
}
