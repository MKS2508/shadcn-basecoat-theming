export default function BrowserLoggerPlugin() {
  return {
    name: "vite:browser-logger",
    transformIndexHtml(html) {
      if (process.env.NODE_ENV !== "development") return html;

      return html.replace(
        "</body>",
        `
        <script>
          (function () {
            let ws = null;
            let reconnectInterval = null;
            let messageQueue = [];

            function connect() {
              try {
                ws = new WebSocket("ws://localhost:8081");
                
                ws.onopen = function() {
                  console.log("🔌 Conectado al logger server");
                  // Send queued messages after a small delay to ensure connection is ready
                  setTimeout(() => {
                    while (messageQueue.length > 0) {
                      const message = messageQueue.shift();
                      if (ws && ws.readyState === WebSocket.OPEN) {
                        ws.send(message);
                      }
                    }
                  }, 10);
                  if (reconnectInterval) {
                    clearInterval(reconnectInterval);
                    reconnectInterval = null;
                  }
                };

                ws.onclose = function() {
                  console.log("🔌 Desconectado del logger server");
                  // Attempt to reconnect every 2 seconds
                  if (!reconnectInterval) {
                    reconnectInterval = setInterval(() => {
                      console.log("🔄 Intentando reconectar al logger...");
                      connect();
                    }, 2000);
                  }
                };

                ws.onerror = function(error) {
                  console.log("❌ Error en WebSocket logger:", error);
                };
              } catch (error) {
                console.log("❌ No se pudo conectar al logger server");
              }
            }

            function send(type, ...args) {
              const message = JSON.stringify({ type, args });
              
              if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(message);
              } else {
                // Queue message if not connected
                messageQueue.push(message);
                if (messageQueue.length > 100) {
                  messageQueue.shift(); // Remove oldest if queue gets too long
                }
              }
            }

            // Intercept console methods
            ["log", "error", "warn", "info", "debug"].forEach(level => {
              const original = console[level];
              console[level] = (...args) => {
                send(level, ...args);
                original.apply(console, args);
              };
            });

            // Intercept window errors
            window.addEventListener('error', function(event) {
              send('error', 'Uncaught Error:', event.error ? event.error.stack : event.message);
            });

            // Intercept unhandled promise rejections
            window.addEventListener('unhandledrejection', function(event) {
              send('error', 'Unhandled Promise Rejection:', event.reason);
            });

            // Connect on page load
            connect();
          })();
        </script>
        </body>
        `
      );
    }
  };
}