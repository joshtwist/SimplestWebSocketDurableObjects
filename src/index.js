const WebSocketDO = require('./WebSocketDO');
const HTML = require('./html.js');

exports.WebSocketDO = WebSocketDO;

async function handleErrors(request, func) {
  try {
    return await func();
  } catch (err) {
    if (request.headers.get('Upgrade') == 'websocket') {
      // Annoyingly, if we return an HTTP error in response to a WebSocket request, Chrome devtools
      // won't show us the response body! So... let's send a WebSocket response with an error
      // frame instead.
      let pair = new WebSocketPair();
      pair[1].accept();
      pair[1].send(JSON.stringify({ error: err.stack, message: err.message }));
      pair[1].close(1011, 'Uncaught exception during session setup');
      return new Response(null, { status: 101, webSocket: pair[0] });
    } else {
      return new Response(err.stack, { status: 500 });
    }
  }
}

exports.handlers = {
  async fetch(request, env) {
    return await handleErrors(request, async () => {
      return handleRequest(request, env);
    });
  },
};

async function handleRequest(request, env) {
  const path = new URL(request.url).pathname;

  if (path === '/') {
    // Serve our HTML at the root path.
    return new Response(HTML.HTML, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
  } else if (path === '/websocket') {
    const id = env.WEBSOCKETDO.idFromName('A');
    const obj = env.WEBSOCKETDO.get(id);
    const response = obj.fetch(request);
    return response;
  } else {
    return new Response('Not found', { status: 404, headers: { pathname: path } });
  }
}
