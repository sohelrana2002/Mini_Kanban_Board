import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { errorHandler } from "./middlewares/errorHandler";

// Routes Import
import authRoutes from "./routes/auth.routes";
import boardRoutes from "./routes/board.routes";
import columnRoutes from "./routes/column.routes";
import taskRoutes from "./routes/task.routes";

dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://mini-kanban-board-icuv.onrender.com",
  "https://kanban-client1.netlify.app",
];

// Any Codespaces-forwarded frontend URL, e.g. https://xxxx-3000.app.github.dev
const codespacesOriginPattern = /^https:\/\/.*-3000\.app\.github\.dev$/;

const corsOptions = {
  origin: function (origin: any, callback: any) {
    if (
      !origin ||
      allowedOrigins.includes(origin) ||
      codespacesOriginPattern.test(origin)
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET, POST, PUT, DELETE, PATCH, HEAD",
  credentials: true,
  // optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/columns", columnRoutes);
app.use("/api/tasks", taskRoutes);

// Default Route
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    message: "Server is Live",
  });
});

// Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Server is running" });
});

// Global Error Handler
app.use(errorHandler);

export default app;
