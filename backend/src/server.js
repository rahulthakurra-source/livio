import cors from "cors";
import express from "express";
import { config } from "./config.js";
import {
  createEmptyProject,
  createProject,
  deleteProject,
  getProjectById,
  listProjects,
  replaceProjects,
  updateProject,
} from "./projectStore.js";
import { getAppState, saveAppState } from "./appStateStore.js";
import {
  createUser,
  deleteUser,
  listUsers,
  listUsersRaw,
  loginUser,
  replaceUsers,
  updateUser,
} from "./userStore.js";

const app = express();

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  if (config.frontendOrigins.includes("*")) {
    return true;
  }

  return config.frontendOrigins.includes(origin);
}

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    },
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

app.get("/api/bootstrap", async (_req, res, next) => {
  try {
    const [projects, users, appState] = await Promise.all([
      listProjects(),
      listUsersRaw(),
      getAppState(),
    ]);

    res.json({
      db: {
        projects,
        activeId: appState.activeId || projects[0]?.id || "",
      },
      users,
      roles: appState.roles || [],
      perms: appState.perms || {},
      resets: appState.resets || {},
    });
  } catch (error) {
    next(error);
  }
});

app.put("/api/bootstrap", async (req, res, next) => {
  try {
    const payload = req.body || {};
    const db = payload.db && typeof payload.db === "object" ? payload.db : {};
    const projects = Array.isArray(db.projects) ? db.projects : [];
    const activeId = typeof db.activeId === "string" ? db.activeId : "";
    const users = Array.isArray(payload.users) ? payload.users : [];

    const [savedProjects, savedUsers, savedAppState] = await Promise.all([
      replaceProjects(projects),
      replaceUsers(users),
      saveAppState({
        activeId,
        roles: payload.roles,
        perms: payload.perms,
        resets: payload.resets,
      }),
    ]);

    res.json({
      db: {
        projects: savedProjects,
        activeId: savedAppState.activeId || savedProjects[0]?.id || "",
      },
      users: savedUsers,
      roles: savedAppState.roles,
      perms: savedAppState.perms,
      resets: savedAppState.resets,
    });
  } catch (error) {
    next(error);
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
