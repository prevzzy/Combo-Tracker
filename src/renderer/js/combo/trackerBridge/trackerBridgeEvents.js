import { sendBalanceToStickyTimers } from '../../events/outgoingIpcEvents';
import { getBalance } from '../tracker';
import _ from 'lodash';
import { isStickyWindowVisible } from './helpers';

const BRIDGE_EVENTS = {
  BALANCE_STICKY_TIMERS: 'BALANCE_STICKY_TIMERS',
}

let lastSentData = {
  [BRIDGE_EVENTS.BALANCE_STICKY_TIMERS]: {}
}

const bridgeEventDataGetters = new Map([
  [BRIDGE_EVENTS.BALANCE_STICKY_TIMERS, getBalanceForStickyTimers]
])

const bridgeEventHandlers = new Map([
  [BRIDGE_EVENTS.BALANCE_STICKY_TIMERS, sendBalanceToStickyTimers],
])

export function handleSendingDataToListeners() {
  let data = {}

  getListenersToUpdate().forEach((eventKey) => {
    const dataGetter = bridgeEventDataGetters.get(eventKey);
    data = {
      ...data,
      [eventKey]: dataGetter()
    }
  })

  sendDataToListeners(data);
}

function sendDataToListeners(data) {
  Object.keys(data).forEach(eventKey => {
    const payload = data[eventKey]

    if (isNewDataSameAsLastSentData(eventKey, payload)) {
      return;
    }

    const handler = bridgeEventHandlers.get(eventKey);

    setLastSentData(eventKey, payload)
    handler(payload)
  })
}

function getListenersToUpdate() {
  const eventKeys = [];

  if (isStickyWindowVisible()) {
    eventKeys.push(BRIDGE_EVENTS.BALANCE_STICKY_TIMERS)
  }

  return eventKeys;
}

function setLastSentData(eventKey, data) {
  lastSentData = {
    ...lastSentData,
    [eventKey]: data
  }
}

function isNewDataSameAsLastSentData(eventKey, newData) {
  return _.isEqual(lastSentData[eventKey], newData)
}

function getBalanceForStickyTimers() {
  const { manualTime, grindTime } = getBalance();

  return { manualTime, grindTime }
}

