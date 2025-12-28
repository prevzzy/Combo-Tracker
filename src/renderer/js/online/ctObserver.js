import { isComboInProgress } from '../combo/tracker';
import { log } from '../debug/debugHelpers';
import { getHookedGameProcessName } from '../game/gameProcessService';
import { isTrackingRethawed, isTrackingThugPro } from '../game/interGameUtils';
import * as MemoryController from '../game/memory'
import { isConnectedToGameServer, isLocalPlayer } from './onlineUtils';
import { GAMES_BY_PROCESS_NAME } from '../utils/constants';
import { requestCtObserverRegister, requestCtObserverUnregister, requestSubscribingToPlayer, requestUnsubscribingFromPlayer } from '../events/outgoingIpcEvents';

const intervals = {
  checkForOwnSkaterIntervalId: null,
  listenForObservedPlayerIntervalId: null,
  ctObserverMainLoopIntervalId: null,
}

let currentCtObservedPlayerId = null;
let isCtObserverRunning = false;

function isCtObserverActionOK(status) {
  return status === 0;
}

function setIsCtObserverRunning(value) {
  isCtObserverRunning = value;
}

function shouldSendCtObserverMessage() {
  // jakos sprawdzic czy ma observerow?

  return true
}

function hasGameServerConnection() {
  return (isTrackingRethawed() || isTrackingThugPro()) && isConnectedToGameServer();
}

// TODO: teoretycznie jest szansa, że podczas wychodzenia jednego gracza z np. id 1, wejdzie kolejny gracz, któremu przypisane zostanie id 1, zanim jeszcze poprzedni gracz zostanie wypisany z gry. można chyba po prostu spróbować się zarejestrować jako to id w main processie, a jak się nie uda to spróbować ponownie po chwili? ta chwila by musiała być tak samo długa jak auto odłączanie gościa

function canBeRegisteredAsPlayer(ownSkaterObject) {
  // If the server is maxed out (f.e. 8/8 players) and you join as an observer, the game still asigns your skater an id and sets it as "in world". Revert penalty and graffiti tag count get bugged so also check that.
  // TODO: sprawdzic dla rethawed
  const ASSUMED_MAX_VALUE = 10000
  const graffitiTagsCount = MemoryController.getGraffitiTagsCount();
  const revertPenalty = MemoryController.getRevertPenalty(); 

  const hasJoinedAFullServer = graffitiTagsCount > ASSUMED_MAX_VALUE ||
    revertPenalty > ASSUMED_MAX_VALUE ||
    revertPenalty < -ASSUMED_MAX_VALUE

  log(`hasJoinedAFullServer: ${hasJoinedAFullServer}`)

  return !!(!hasJoinedAFullServer &&
    ownSkaterObject &&
    MemoryController.isSkaterInWorld(ownSkaterObject));
}

function checkForOwnSkaterLoop() {
  intervals.checkForOwnSkaterIntervalId = setInterval(() => {
    const ownSkaterObject = MemoryController.getOwnSkaterAddress();
    
    if (canBeRegisteredAsPlayer(ownSkaterObject)) {
      clearIntervalAndNullId('checkForOwnSkaterIntervalId');
      const id = getCtObserverId(ownSkaterObject);
      handleRegistering(id);
    }
  }, 1000);
}

function getCtObserverPlayerId(game, joinId, skaterObject) {
  const ownSkaterId = MemoryController.getSkaterId(skaterObject);

  const id = `${game}-${joinId}-${ownSkaterId}`

  return id;
}

function getCtObserverNonPlayerId(game, joinId) {
  // observer can't be observed and also doesn't have a skaterId so just add a random bit
  const randomPart = (Math.random() * 10000).toFixed()
  const id = `${game}-${joinId}-observer-${randomPart}`

  return id;
}

function getCtObserverId(skaterObject) {
  const game = GAMES_BY_PROCESS_NAME[getHookedGameProcessName()];
  const joinId = MemoryController.getJoinId();

  const id = skaterObject
    ? getCtObserverPlayerId(game, joinId, skaterObject)
    : getCtObserverNonPlayerId(game, joinId);
  const idFormatted = id.toLowerCase().replace(' ', '');

  return idFormatted;
}

async function handleCtObserverConnectionInit() {
  log('handleCtObserverConnectionInit')
  try {
    setIsCtObserverRunning(true);
  
    const ownSkaterObject = MemoryController.getOwnSkaterAddress();
    const shouldRegisterAsPlayer = canBeRegisteredAsPlayer(ownSkaterObject);
  
    if (!shouldRegisterAsPlayer) {
      checkForOwnSkaterLoop();
    }
  
    const id = getCtObserverId(shouldRegisterAsPlayer && ownSkaterObject);
    await handleRegistering(id);
    listenForObservedPlayer();
  } catch(error) {
    console.error(error);
    disconnectFromCtObserver();
  }
}


async function handleRegistering(id) {
  log(`handleRegistering - ${id}`)
  
  const { status, message } = await requestCtObserverRegister(id)

  if (!isCtObserverActionOK(status)) {
    throw new Error(`handleRegistering - Failed registering, reason: ${message}`)
  }
}

function listenForObservedPlayer() {
  intervals.listenForObservedPlayerIntervalId = setInterval(async () => {
    if (isComboInProgress()) {
      log('listenForObservedPlayer - combo in progress')
      return;
    }

    try {
      const observedPlayer = MemoryController.getObservedPlayerObjectAddress();
      const observedPlayerSkaterObject = MemoryController.getObservedPlayerSkaterAddress(observedPlayer);
      const observedPlayerCtId = getCtObserverId(observedPlayerSkaterObject)
      const observedPlayerName = MemoryController.getObservedPlayerName(observedPlayer);
      
      if (observedPlayerCtId === currentCtObservedPlayerId) {
        log(`listenForObservedPlayer - still ctObserving player ${observedPlayerCtId}`)
        return;
      }
      
      clearIntervalAndNullId('listenForObservedPlayerIntervalId');
      await unsubscribeFromCurrentObservedPlayer();
      
      const flags = MemoryController.getObservedPlayerFlags(observedPlayer);
      if (!observedPlayer || isLocalPlayer(flags)) {
        log('listenForObservedPlayer - observed player is local player')
      } else {
        log(`listenForObservedPlayer - new observed player is ${observedPlayerCtId} (${observedPlayerName})`)
  
        await subscribeToObservedPlayer(observedPlayerCtId);
      }
  
      listenForObservedPlayer();
    } catch(error) {
      clearIntervalAndNullId('listenForObservedPlayerIntervalId');
      listenForObservedPlayer();
      console.error('listenForObservedPlayer -', error);
    }
  }, 100);
}

async function subscribeToObservedPlayer(id) {
  currentCtObservedPlayerId = id; // set currentCtObservedPlayerId regardless of success/failure, so the user has to change players to trigger the change
  const { status, message } = await requestSubscribingToPlayer(id)
  
  if (isCtObserverActionOK(status)) {
    log(`listenForObservedPlayer - ctObserver connected to ${currentCtObservedPlayerId}`)
  } else {
    throw new Error(message);
  }
}

async function unsubscribeFromCurrentObservedPlayer() {
  if (!currentCtObservedPlayerId) {
    return;
  }

  log('unsubscribeFromCurrentObservedPlayer', currentCtObservedPlayerId)
  const { status, message } = await requestUnsubscribingFromPlayer()
  currentCtObservedPlayerId = null;

  if (!isCtObserverActionOK(status)) {
    throw new Error(message);
  }
}

function mainCtObserverLogic() {
  log('ctObserverMainLoop - running')
  try {
    const hasConnection = hasGameServerConnection();
    log(`ctObserverMainLoop - hasConnection - ${hasConnection}`)
  
    if (!isCtObserverRunning && hasConnection) {
      handleCtObserverConnectionInit();
    } else if (isCtObserverRunning && !hasConnection) {
      disconnectFromCtObserver();
    }
  } catch(error) {
    disconnectFromCtObserver();
    console.error(error);
  }
}

function runCtObserver() {
  log('runCtObserver')
  if (intervals.ctObserverMainLoopIntervalId) {
    log('runCtObserver - ctObserver already running')
    return;
  }

  mainCtObserverLogic()

  intervals.ctObserverMainLoopIntervalId = setInterval(() => {
    mainCtObserverLogic()
  }, 2000);
}

async function disconnectFromCtObserver() {
  log('disconnectFromCtObserver')

  setIsCtObserverRunning(false);
  clearIntervalAndNullId('checkForOwnSkaterIntervalId');
  clearIntervalAndNullId('listenForObservedPlayerIntervalId');
  await requestCtObserverUnregister();
}

async function stopCtObserver() {
  log('stopCtObserver')

  clearIntervalAndNullId('ctObserverMainLoopIntervalId');
  disconnectFromCtObserver();
  await requestCtObserverUnregister();
}

function clearIntervalAndNullId(intervalIdName) {
  clearInterval(intervals[intervalIdName])
  intervals[intervalIdName] = null
}

export {
  stopCtObserver,
  runCtObserver,
  shouldSendCtObserverMessage,
}
