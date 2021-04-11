module.exports = class WebSocketHelper {
  constructor() {
    this.messageHandlers = [];
    this.connectedHandlers = [];
    this.errorHandlers = [];
    this.closeHandlers = [];

    this.sessions = [];
  }

  async handleWebSocketUpgrade(request, clientId) {
    if (request.headers.get('Upgrade') !== 'websocket') {
      throw new Error(`Upgrade header not 'websocket' or not present.`);
    }

    const pair = new WebSocketPair();
    const webSocket = pair[1];
    webSocket.accept();

    const session = { webSocket, clientId };
    this.sessions.push(session);

    webSocket.addEventListener('message', async msg => {
      this.messageHandlers.forEach(handler => {
        handler(msg, session);
      });
    });

    webSocket.addEventListener('close', evt => {
      this.closeHandlers.forEach(handler => {
        handler(evt, session);
      });
    });

    webSocket.addEventListener('error', evt => {
      this.errorHandlers.forEach(handler => {
        handler(evt, session);
      });
    });

    this.connectedHandlers.forEach(handler => {
      handler(session);
    });

    // Don't forget to return the other pair with the response
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  onConnected(handler) {
    this.connectedHandlers.push(handler);
  }

  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  onError(handler) {
    this.errorHandlers.push(handler);
  }

  onClose(handler) {
    this.closeHandlers.push(handler);
  }

  sendToClientId(message, clientId) {
    const matches = this.sessions.filter(session => {
      return session.clientId && session.clientId;
    });

    if (matches !== 1) {
      throw new Error(`Invalid number of sessions (${matches.length}) matching clientId'${clientId}'`);
    }

    const session = matches[0];

    try {
      session.webSocket.send(message);
    } catch {
      session.quit = true;
    }
  }

  broadcast(message, excludeClientId) {
    // Assume JSON
    this.sessions = this.sessions.filter(session => {
      if (session.quit) {
        return false;
      }

      if (excludeClientId && session.clientId === excludeClientId) {
        return true;
      }

      try {
        session.webSocket.send(message);
        return true;
      } catch (error) {
        session.quit = true;
        return false;
      }
    });
  }
};
