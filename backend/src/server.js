import cors from "cors";
import express from "express";
import { config } from "./config.js";
import {
  createEmptyProject,
  createProject,
  deleteProject,
  getProjectById,
  listProjects,
  updateProject,
} from "./projectStore.js";
import {
  createUser,
  deleteUser,
  listUsers,
  loginUser,
  updateUser,
} from "./userStore.js";

const app = express();

app.use(
  cors({
    origin: config.frontendOrigin,
    credentials: false,
  }),
);
app.use(express.json({ limit: "25mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "livio-backend" });
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required." });
    }

    const user = await loginUser(username, password);
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

app.get("/api/projects", async (_req, res, next) => {
  try {
    const projects = await listProjects();
    res.json({ projects });
  } catch (error) {
    next(error);
  }
});

app.get("/api/projects/template", (_req, res) => {
  res.json({ project: createEmptyProject() });
});

app.get("/api/projects/:projectId", async (req, res, next) => {
  try {
    const project = await getProjectById(req.params.projectId);
    res.json({ project });
  } catch (error) {
    next(error);
  }
});

app.post("/api/projects", async (req, res, next) => {
  try {
    const project = await createProject(req.body || {});
    res.status(201).json({ project });
  } catch (error) {
    next(error);
  }
});

app.put("/api/projects/:projectId", async (req, res, next) => {
  try {
    const project = await updateProject(req.params.projectId, req.body || {});
    res.json({ project });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/projects/:projectId", async (req, res, next) => {
  try {
    await deleteProject(req.params.projectId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.get("/api/users", async (_req, res, next) => {
  try {
    const users = await listUsers();
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

app.post("/api/users", async (req, res, next) => {
  try {
    const user = await createUser(req.body || {});
    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
});

app.put("/api/users/:userId", async (req, res, next) => {
  try {
    const user = await updateUser(req.params.userId, req.body || {});
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

app.delete("/api/users/:userId", async (req, res, next) => {
  try {
    await deleteUser(req.params.userId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({
    error: error.message || "Unexpected server error.",
  });
});

app.listen(config.port, () => {
  console.log(`Livio backend listening on http://localhost:${config.port}`);
});
