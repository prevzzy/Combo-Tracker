import { testFlag } from '../utils/helpers';

const IS_LOCAL_PLAYER_FLAG = 0x00000001;
const PLAYER_CONNECTED_FLAG = 0x00000020;
const OBSERVING_FLAG = 0x00010000;

// most flags work only for local player, but they are still useful to determine when to display other player data
export function isLocalPlayer(playerFlags) {
  return testFlag(playerFlags, IS_LOCAL_PLAYER_FLAG);
}

export function isObserving(playerFlags) { 
  return testFlag(playerFlags, PLAYER_CONNECTED_FLAG);
}

export function isFullyConnected(playerFlags) {
  return testFlag(playerFlags, OBSERVING_FLAG);
}
