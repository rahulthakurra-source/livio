import { supabase } from "./supabaseClient.js";

const APP_STATE_TABLE = "app_state";
const APP_STATE_ID = "legacy-global";

const DEFAULT_APP_STATE = {
  activeId: "",
  roles: [],
  perms: {},
  resets: {},
};

function normalizeAppState(state = {}) {
  return {
    activeId: typeof state.activeId === "string" ? state.activeId : "",
    roles: Array.isArray(state.roles) ? [...state.roles] : [],
    perms: state.perms && typeof state.perms === "object" ? { ...state.perms } : {},
    resets: state.resets && typeof state.resets === "object" ? { ...state.resets } : {},
  };
}

export async function getAppState() {
  const { data, error } = await supabase
    .from(APP_STATE_TABLE)
    .select("payload")
    .eq("id", APP_STATE_ID)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data?.payload) {
    return { ...DEFAULT_APP_STATE };
  }

  return normalizeAppState(data.payload);
}

export async function saveAppState(state = {}) {
  const payload = normalizeAppState(state);
  const { error } = await supabase
    .from(APP_STATE_TABLE)
    .upsert({
      id: APP_STATE_ID,
      payload,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    throw error;
  }

  return payload;
}
