import { SyncClient } from 'twilio-sync';
import fetch from 'node-fetch';
import randomstring from 'randomstring';
import { WS_SERVER_MESSAGE_TYPES } from './wsServer/wsMessageTypes';

class OnlineConnectionService {
  constructor() {
    this.syncClient = undefined;
    this.username = undefined;
    this.stream = undefined;
    this.onOpenConnection = undefined;
    this.onMessage = undefined;
    this.sendMessage = undefined;
    this.connectedUsers = new Set();
    this.ttl = 3600 // 12 hours
  }

  pageHandler(paginator, callback) {
    paginator.items.forEach(item => {
      callback(item)
    })
    return paginator.hasNextPage ? paginator.nextPage().then(pageHandler) : null;
  }

  async setupSyncClient(username) {
    const identity = username + '-' + Math.random() * 10000 + '-' + Date.now();
  
    const response = await fetch(process.env.FN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ identity })
    })
  
    const data = await response.json();
    const syncClient = new SyncClient(data.token);
  
    return syncClient;
  }

  async startOnlineCt(
    username,
    existingRoomId,
    onOpenConnection,
    onMessage,
  ) {
    try {
      if (!username) {
        throw new Error('No username provided');
      }
      if (!this.syncClient) {
        this.syncClient = await this.setupSyncClient(username)
      }

      console.log(username, existingRoomId);

      this.username = username;
      this.onOpenConnection = onOpenConnection;
      this.onMessage = onMessage;
      await this.joinOrCreateRoom(existingRoomId);
    } catch(error) {
      console.error('[ERROR STARTING ONLINE CT]', error)
    }
  }

  async joinOrCreateRoom(existingRoomId) {
    const roomId = existingRoomId || randomstring.generate({
      length: 4,
      charset: 'alphabetic',
      capitalization: 'uppercase'
    })
    
    try {
      const list = await this.syncClient.list({
        id: roomId,
        open: existingRoomId ? 'open_existing' : 'create_new',
        ttl: this.ttl
      })

      this.setupListEventListeners(list);
      this.setupRoomConnection(list);
      this.onOpenConnection(list.uniqueName);
    } catch(error) {
      console.error(`[ERROR ${existingRoomId ? 'JOINING' : 'CREATING'} ROOM]`, error)
    }
  }

  async setupListEventListeners(list) {
    list.on('itemAdded', async (event) => {
      try {
        console.log('[ITEM ADDED]', event.item.data, this.stream.sid)
        const item = event.item;
        
        // TODO: this this if should be uncommented and client's data should be displayed by renderer process. there's no need to subscribe to own stream if own combo data is already in the app anyway
        // if (item.data.sid !== this.stream.sid) {
          await this.subscribeToStream(item.data.sid);
        // }
  
        this.connectedUsers.add(item.data.name)
        this.onMessage({
          type: WS_SERVER_MESSAGE_TYPES.PLAYER_LIST_UPDATE,
          payload: {
            players: Array.from(this.connectedUsers),
          }
        });
        console.log(this.connectedUsers)
      } catch(error) {
        console.error('[ERROR IN ITEM ADDED LISTENER]', error)
      }
    })
  }

  async setupRoomConnection(list) {
    await this.createPlayerStream();

    try {
      await list.push({ name: this.username, sid: this.stream.sid })
    } catch (error) {
      console.error('[ERROR ADDING PLAYER]', error)
    }

    try {
      const paginator = await list.getItems({ from: 0, order: 'asc' })
   
      this.pageHandler(paginator, async (item) => {
        console.log('list getitems item', item.data.name);
        
        this.connectedUsers.add(item.data.name)
        // TODO: this this if should be uncommented and client's data should be displayed by renderer process. there's no need to subscribe to own stream if own combo data is already in the app anyway
        // if (item.data.sid !== this.stream.sid) {
          await this.subscribeToStream(item.data.sid);
        // }
      })

      console.log(this.connectedUsers)
      this.onMessage({
        type: WS_SERVER_MESSAGE_TYPES.PLAYER_LIST_UPDATE,
        payload: {
          players: Array.from(this.connectedUsers),
        }
      });
    } catch (error) {
      console.error('[ERROR GETTING ROOM PLAYERS]', error)
    }
  }

  async createPlayerStream() {
    try {
      const stream = await this.syncClient.stream({ ttl: this.ttl });
      this.stream = stream;
      return stream;
    } catch(error) {
      console.error('[ERROR CREATING PLAYER STREAM]', error);
    }
  }

  async subscribeToStream(streamName) {
    try {
      const stream = await this.syncClient.stream({ id: streamName, ttl: this.ttl });

      stream.on('messagePublished', (event) => this.getStreamMessage(event.message))
    } catch(error) {
      console.error(`[ERROR SUBSCRIBING TO A STREAM ${streamName}]`, stream)
    }
  }

  sendStreamMessage(message) {
    console.log('SENDING MESSAGE: ', message);

    this.stream.publishMessage(message);
  }
  
  getStreamMessage(message) {
    console.log('GETTING MESSAGE: ', message);
  
    this.onMessage(message.data)
  }

  async exitOnline() {
    if (!this.syncClient) {
      return
    }
    
    try {
      await this.syncClient.shutdown();
      this.syncClient = undefined;
      this.onOpenConnection = undefined;
      this.onMessage = undefined;
      this.sendMessage = undefined;
    } catch(error) {
      console.error(error);
    }
  }
}

const onlineConnectionService = new OnlineConnectionService();

export default onlineConnectionService;
