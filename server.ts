import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { DB } from "./server/db";
import { router as apiRouter } from "./server/routes";

// Initialize database
DB.init();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares to parse responses
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server running optimally" });
  });

  // Dual-Backend Capability: 
  // If SPRINGBOOT_ACTIVE is set to true, transparently proxy all REST API requests to port 8080 (Spring Boot).
  // Otherwise, fallback nicely to the built-in fast Node.js Express server.
  if (process.env.SPRINGBOOT_ACTIVE === "true") {
    console.log(">>> Spring Boot proxy GATEWAY ACTIVE. Forwarding /api traffic to http://127.0.0.1:8080/api");
    app.all("/api/*", async (req, res) => {
      const targetUrl = `http://127.0.0.1:8080${req.originalUrl}`;
      try {
        const headers: Record<string, string> = {};
        for (const [key, value] of Object.entries(req.headers)) {
          if (value !== undefined) {
            headers[key] = Array.isArray(value) ? value.join(", ") : value;
          }
        }
        headers["host"] = "127.0.0.1:8080";

        const fetchOptions: any = {
          method: req.method,
          headers,
        };

        if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
          fetchOptions.body = JSON.stringify(req.body);
        }

        const response = await fetch(targetUrl, fetchOptions);
        res.status(response.status);

        // Copy response headers
        response.headers.forEach((value, name) => {
          if (name.toLowerCase() !== "transfer-encoding") {
            res.setHeader(name, value);
          }
        });

        const textOutput = await response.text();
        res.send(textOutput);
      } catch (err: any) {
        console.error(`>>> Spring Boot Gateway Error feeding ${targetUrl}:`, err.message);
        res.status(502).json({
          error: "Spring Boot Service Unavailable",
          details: err.message,
          instruction: "Please start the Spring Boot Maven server on port 8080."
        });
      }
    });
  } else {
    // Mount Food Ordering System API Routes
    app.use("/api", apiRouter);
  }

  // Serve static assets or mount Vite Developer Server Middleware
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting developer server mode with Vite hot-reloading simulation...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting Production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical: Failed to bootstrap Food Ordering server:", err);
});
