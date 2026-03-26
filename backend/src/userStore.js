import { randomUUID } from "node:crypto";
import { supabase } from "./supabaseClient.js";

const USERS_TABLE = "app_users";

function normalizeUser(user = {}) {
  return {
    id: user.id || `u_${randomUUID()}`,
    username: (user.username || "").trim(),
    password: user.password || "",
    role: user.role || "Manager",
    email: (user.email || "").trim(),
  };
}

function publicUser(user) {
  const normalized = normalizeUser(user);
  return {
    id: normalized.id,
    username: normalized.username,
    role: normalized.role,
    email: normalized.email,
  };
}

export async function loginUser(username, password) {
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select("id, username, password, role, email")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data || data.password !== password) {
    return null;
  }

  return publicUser(data);
}

export async function listUsers() {
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select("id, username, password, role, email")
    .order("username", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map(publicUser);
}

export async function listUsersRaw() {
  const { data, error } = await supabase
    .from(USERS_TABLE)
    .select("id, username, password, role, email")
    .order("username", { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map(normalizeUser);
}

export async function createUser(user) {
  const normalized = normalizeUser(user);

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .insert(normalized)
    .select("id, username, password, role, email")
    .single();

  if (error) {
    throw error;
  }

  return publicUser(data);
}

export async function updateUser(userId, updates) {
  const payload = normalizeUser({
    ...updates,
    id: userId,
  });

  const { data, error } = await supabase
    .from(USERS_TABLE)
    .update({
      username: payload.username,
      password: payload.password,
      role: payload.role,
      email: payload.email,
    })
    .eq("id", userId)
    .select("id, username, password, role, email")
    .single();

  if (error) {
    throw error;
  }

  return publicUser(data);
}

export async function deleteUser(userId) {
  const { error } = await supabase
    .from(USERS_TABLE)
    .delete()
    .eq("id", userId);

  if (error) {
    throw error;
  }
}

export async function replaceUsers(users = []) {
  const nextUsers = (Array.isArray(users) ? users : []).map(normalizeUser);

  const { data: existing, error: existingError } = await supabase
    .from(USERS_TABLE)
    .select("id");

  if (existingError) {
    throw existingError;
  }

  const nextIds = nextUsers.map((user) => user.id);
  const existingIds = (existing || []).map((user) => user.id);
  const deleteIds = existingIds.filter((id) => !nextIds.includes(id));

  if (deleteIds.length) {
    const { error: deleteError } = await supabase
      .from(USERS_TABLE)
      .delete()
      .in("id", deleteIds);

    if (deleteError) {
      throw deleteError;
    }
  }

  if (nextUsers.length) {
    const { error: upsertError } = await supabase
      .from(USERS_TABLE)
      .upsert(nextUsers);

    if (upsertError) {
      throw upsertError;
    }
  }

  return listUsersRaw();
}
