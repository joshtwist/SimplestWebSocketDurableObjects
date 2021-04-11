exports.HTML = `<html>
<body>
  <h1>Cloudflare Workers DurableObject Basic WebSockets</h1>
  <input type="text" id="text_input" /><br/>
  <button id="send_button">Send</button> <br/>
  <div id="output_div"></div>
  <script type="text/javascript">

    function uuidv4() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }

    let currentWebSocket = null;
    const clientId = uuidv4();
    const hostname = window.location.host;

    const outputDiv = document.getElementById('output_div');
    const sendButton = document.getElementById('send_button');
    const textInput = document.getElementById('text_input');

    function join() {
      const ws = new WebSocket("wss://" + hostname + "/websocket");
      let rejoined = false;
      const startTime = Date.now();

      ws.addEventListener("open", event => {
        currentWebSocket = ws;
      });

      ws.addEventListener("message", event => {
        const data = event.data;

        // write output somewhere
        const p = document.createElement("p");
        p.innerText = data;
        outputDiv.appendChild(p);
      });

      ws.addEventListener("close", event => {
        console.log("WebSocket closed, reconnecting:", event.code, event.reason);
        rejoin();
      });

      ws.addEventListener("error", event => {
        console.log("WebSocket  error, reconnecting:", event);
        rejoin();
      });

      const rejoin = async () => {
        if (! rejoined) {
          rejoined = true;
          currentWebSocket = null;

          let timeSinceLastJoin = Date.now() - startTime;
          if (timeSinceLastJoin < 5000) {
            await new Promise(resolve => setTimeout(resolve, 5000 - timeSinceLastJoin));
          }

          join();
        }
      }
    }

    sendButton.addEventListener("click", event => {
      const text = textInput.value;
      const data = { text, clientId };
      currentWebSocket.send(JSON.stringify(data));
      textInput.value = "";
    });

    join();

      

  </script>

  
</body>
</html>`;
