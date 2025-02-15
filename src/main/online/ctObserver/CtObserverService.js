import TwilioSyncService from './TwilioSyncService';

const actionOK = {
  status: 0,
  message: 'OK'
}

function actionNotOK(message) {
  return {
    status: 1,
    message
  }
}

class CtObserverService {
  constructor() {
    this.twilioSyncService = new TwilioSyncService();
    this.userId = undefined;
    this.ownStream = undefined;
    this.subscribedStream = undefined;
    this.onMessage = undefined;
    // this.ttl = 3600 // 1 hour for now
    this.ttl = 500000  // 1 hour for now
  }

  async register(id, onMessage) {
    return

    // TODO: unused for now

    try {
      if (this.ownStream) {
        // this.closeOwnStream();
      }

      this.ownStream = await this.twilioSyncService.registerUser(id);
  
      this.userId = id;
      this.onMessage = onMessage;

      return actionOK;
    } catch(error) {
      const errorMessage = `REGISTER TO CT OBSERVER ERROR ${error}`
      console.error(errorMessage);
      return actionNotOK(errorMessage)
    }
  }

  async subscribe(observedPlayerId) {
    return

    // TODO: unused for now
  
    try {
      console.log(observedPlayerId)
      const userItem = await this.twilioSyncService.getUser(observedPlayerId);
      if (!userItem) {
        return actionNotOK('User not found')
      }

      const stream = await this.twilioSyncService.manageStream('open_existing', process.env.SUBSCRIBED_STREAM_ID);
      console.log('SUBSCRIBED_STREAM_ID', process.env.SUBSCRIBED_STREAM_ID)

      // const stream = await this.twilioSyncService.manageStream('open_existing', userItem.data.sid);
      console.log('SUBSCRIBED TO', stream.sid)

      stream.on('messagePublished', (event) => this.getMessage(event.message));
      stream.on('removed', () => this.unsubscribe());

      this.subscribedStream = stream;
      return actionOK;
    } catch(error) {
      const errorMessage = `ERROR SUBSCRIBING TO A STREAM ${observedPlayerId}, ${error}`
      console.error(errorMessage)
      return actionNotOK(errorMessage) 
    }
  }

  sendMessage(message) {
    return

    // TODO: unused for now
  
    try {
      console.log('SENDING MESSAGE: ', message);
      this.ownStream.publishMessage(message);
    } catch(error) {
      console.error('SENDING MESSAGE ERROR: ', error);
    }
  }

  getMessage(message) {
    console.log('GETTING MESSAGE: ', message);
  
    this.onMessage(message.data)
  }

  async unsubscribe() {
    try {
      if (!this.subscribedStream) {
        console.log('UNSUBSCRIBE STREAM ERROR', 'No subscribed stream')
        return actionOK;
      }
  
      // this.subscribedStream.close()
      return actionOK;
    } catch(error) {
      const errorMessage = `UNSUBSCRIBE FROM STREAM ERROR: ${error}`
      console.error(errorMessage)
      return actionNotOK(errorMessage)
    }
  }

  async closeOwnStream() {
    try {
      if (!this.ownStream) {
        return;
      }

      // await this.ownStream.removeStream();
      this.ownStream = null;
    } catch(error) {
      console.error('CLOSE STREAM ERROR: ', error)
    }
  }

  async unregister() {
    try {
      if (this.userId) {
        // todo: uncomment
        // this.closeOwnStream();
        // this.twilioSyncService.removeFromUsersMap(this.userId);
      } else {
        console.log('EXIT CT OBSERVER ERROR: No userId')
      }
  
      return actionOK;
    } catch(error) {
      const errorMessage = `UNREGISTER FROM CT OBSERVER ERROR: Failed to remove self from users map: ${error}`
      console.error(errorMessage)
      return actionNotOK(errorMessage)
    }
  }
}

const ctObserverService = new CtObserverService();

export default ctObserverService;
