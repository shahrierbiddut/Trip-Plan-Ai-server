import "dotenv/config";
import { auth } from "./src/config/auth";
import { toNodeHandler } from "better-auth/node";
import http from "http";

const handler = toNodeHandler(auth);

const server = http.createServer((req, res) => {
  console.log("Req URL:", req.url);
  handler(req, res);
  // Wait to see if handler writes to res.
  setTimeout(() => {
    if (!res.headersSent) {
      console.log("Headers not sent!");
      res.end("Not Handled");
    }
  }, 100);
});

server.listen(5001, () => console.log("Test server on 5001"));
