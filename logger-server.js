#!/usr/bin/env node

import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8081 });

console.log("🚀 Logger server running on ws://localhost:8081");

wss.on("connection", ws => {
  console.log("🔌 Navegador conectado al logger");

  ws.on("message", msg => {
    try {
      const { type, args } = JSON.parse(msg);
      const formatted = args
        .map(a => (typeof a === "object" ? JSON.stringify(a, null, 2) : a))
        .join(" ");

      // Add timestamp
      const timestamp = new Date().toLocaleTimeString();

      switch (type) {
        case "log":
          console.log(`${timestamp} [LOG] ${formatted}`);
          break;
        case "info":
          console.info(`${timestamp} [INFO] ${formatted}`);
          break;
        case "warn":
          console.warn(`${timestamp} [WARN] ${formatted}`);
          break;
        case "error":
          console.error(`${timestamp} [ERROR] ${formatted}`);
          break;
        case "debug":
          console.debug(`${timestamp} [DEBUG] ${formatted}`);
          break;
        default:
          console.log(`${timestamp} [${type.toUpperCase()}] ${formatted}`);
      }
    } catch (e) {
      console.error("❌ Error parsing message:", e);
    }
  });

  ws.on("close", () => {
    console.log("🔌 Navegador desconectado del logger");
  });

  ws.on("error", (error) => {
    console.error("❌ WebSocket error:", error);
  });
});

wss.on("error", (error) => {
  console.error("❌ Logger server error:", error);
});

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Cerrando logger server...");
  wss.close(() => {
    console.log("✅ Logger server cerrado");
    process.exit(0);
  });
});