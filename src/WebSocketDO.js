module.exports = class WebSocketDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;

    this.sessions = [];
  }

  async fetch (request) {
    const path = new URL(request.url).pathname;

    if (!path == '/websocket' || request.headers.get('Upgrade') != 'websocket') {
      return new Response('Not found', {
        status: 404,
        headers: {
          pathname: path,
          upgrade: request.headers.get('Upgrade') || '',
        },
      });
    }

    const pair = new WebSocketPair();
    const webSocket = pair[1];
    webSocket.accept();
    
    const session = { webSocket };

    this.sessions.push(session);

    webSocket.addEventListener('message', async msg => {

      try {
        const data = JSON.parse(msg.data);

        if (!session.clientId && data.clientId) {
          session.clientId = data.clientId;
  
          // send a little welcome
          webSocket.send(
            JSON.stringify({
              ready: true,
            })
          );
        } else {
          // it's a normal message - echo for now
          this.broadcast(JSON.stringify(data));
        } 
      }
      catch(err) {
        webSocket.send(`Error ${err.stack} \r\n${err.message} \r\n${err.description}`);
      }
      // if we have no clientId and receive one, assign it to the session
      // clients changing id will be ignored
    });

    const closeOrErrorHandler = evt => {
      // remove closed or error session, mark as quit and will be removed on next send
      session.quit = true;
    };

    webSocket.addEventListener('close', closeOrErrorHandler);
    webSocket.addEventListener('error', closeOrErrorHandler);

    // Don't forget to return the other pair
    return new Response(null, { status: 101, webSocket: pair[0] });
  };

  broadcast(message, excludeClientId) {
    // Assume JSON
    this.sessions = this.sessions.filter(session => {
      if (session.quit) {
        return false;
      }

      // skip exluded client
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