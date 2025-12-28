import { SyncClient as TwilioSyncClient } from 'twilio-sync';
import { CT_OBSERVER_MAP_NAME } from '../onlineConstants';
import { getBearer } from '../../api/auth';

class TwilioSyncService {
  constructor() {
    this.syncClient = null,
    // this.ttl = 3600 // 1 hour for now
    this.ttl = 500000  // 1 hour for now
  }

  initializeSync() {
    return;
    // this.syncClient = new TwilioSyncClient(getBearer())
  }
  
  async registerUser(id) {
    if (!this.syncClient) {
      this.initializeSync();
    }
  
    // const stream = await this.manageStream('create_new');
    const stream = await this.manageStream('open_existing', process.env.OWN_STREAM_ID);
    console.log('own stream id', process.env.OWN_STREAM_ID)
    await this.addUser(id, stream.sid)

    return stream;
  }

  async manageStream(mode, id) {
    console.log(mode, id)
    const stream = await this.syncClient.stream({
      id,
      ttl: this.ttl,
      mode
    });

    return stream;
  }

  async getUsersMap() {
    const map = await this.syncClient.map(CT_OBSERVER_MAP_NAME);
    return map;
  }

  async addUser(userId, streamId) {
    const map = await this.getUsersMap();

    console.log('Trying adding user')
    // map.set(userId, { sid: streamId }, { ttl: this.ttl });
    console.log('Add user successful, item id:', userId);
  }
  
  async getUser(observedPlayerId) {
    const usersMap = await this.getUsersMap();
    const user = await usersMap.get(observedPlayerId);

    return user;
  }

  async removeFromUsersMap(userId) {
    const usersMap = await this.getUsersMap();
    usersMap.remove(userId);
  }
}

export default TwilioSyncService;
