const WebSocketHelper = require('./webSocketHelper');

module.exports = class WebSocketDO {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    // The socket helper maintains state so it's important it is 
    // held at the scope of the durable object (and not the request).
    this.wsh = new WebSocketHelper();

    this.wsh.onMessage((msg, session) => {
      const data = JSON.parse(msg.data);
      if (data.clientId) {
        session.clientId = data.clientId;
      }
      this.wsh.broadcast(JSON.stringify(data), data.clientId);
    });

    this.sessions = [];
  }

  async fetch(request) {
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

    return await this.wsh.handleWebSocketUpgrade(request);
  }
};
