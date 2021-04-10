module.exports = class WebSocketDO {
  contructor(state, env) {
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

    webSocket.send('Welcome');

    const session = { webSocket };

    // PROBLEM: this line blows up because sessions is undefined...
    this.sessions.push(session);

    webSocket.addEventListener('message', async msg => {
      /*  if (session.quit) {
        // Whoops, when trying to send to this WebSocket in the past, it threw an exception and
        // we marked it broken. But somehow we got another message? I guess try sending a
        // close(), which might throw, in which case we'll try to send an error, which will also
        // throw, and whatever, at least we won't accept the message. (This probably can't
        // actually happen. This is defensive coding.)
        webSocket.close(1011, 'WebSocket broken');
      } */

      // if we have no clientId and receive one, assign it to the session
      // clients changing id will be ignored
      if (!session.clientId && data.clientId) {
        session.clientId === data.clientId;

        // send a little welcome
        webSocket.send(
          JSON.stringify({
            ready: true,
          })
        );
      } else {
        // it's a normal message - echo for now
        webSocket.send('Hi!');
      }
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
        session.webSocket.send(JSON.stringify(message));
        return true;
      } catch (error) {
        session.quit = true;
        return false;
      }
    });
  }
};
