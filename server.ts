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

  // Mount Food Ordering System API Routes
  app.use("/api", apiRouter);

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
