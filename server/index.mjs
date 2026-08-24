import cors from "cors";
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnv() {
  const file = path.join(root, ".env");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx < 1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnv();

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@127.0.0.1:5433/flymasters";
const JWT_SECRET = process.env.JWT_SECRET || "flymasters-admin-dev-secret";
const PORT = Number(process.env.API_PORT || 8788);
const ADMIN_ID = "local-admin-1";

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: /supabase\.co|neon\.tech|amazonaws\.com/.test(DATABASE_URL) ? { rejectUnauthorized: false } : undefined,
});

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!password || !stored) return false;
  if (stored.startsWith("scrypt:")) {
    const parts = stored.split(":");
    const salt = parts[1];
    const hash = parts[2];
    if (!salt || !hash) return false;
    const next = scryptSync(password, salt, 64);
    const prev = Buffer.from(hash, "hex");
    return next.length === prev.length && timingSafeEqual(next, prev);
  }
  return stored === password;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}

async function ensureCounselorLogin(authId, passwordPlain) {
  const found = await pool.query("SELECT * FROM auth_users WHERE id = $1", [authId]);
  const auth = found.rows[0];
  if (!auth) return null;
  const profiles = await jsonTable("profiles");
  const profile = profiles.find((item) => String(item.user_id) === String(authId));
  const meta = auth.user_metadata || {};
  const email = String(auth.email || "").trim().toLowerCase();
  const hash = passwordPlain ? await bcrypt.hash(passwordPlain, 10) : auth.password;
  const id = isUuid(auth.id) ? auth.id : crypto.randomUUID();
  const created = await pool.query(
    `INSERT INTO counselor_users (id, email, password_hash, first_name, last_name, phone)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email) DO UPDATE SET
       password_hash = CASE WHEN $7 THEN EXCLUDED.password_hash ELSE counselor_users.password_hash END,
       first_name = COALESCE(NULLIF(EXCLUDED.first_name, ''), counselor_users.first_name),
       last_name = COALESCE(NULLIF(EXCLUDED.last_name, ''), counselor_users.last_name),
       phone = COALESCE(NULLIF(EXCLUDED.phone, ''), counselor_users.phone)
     RETURNING *`,
    [
      id,
      email,
      hash,
      profile?.first_name || meta.first_name || "",
      profile?.last_name || meta.last_name || "",
      profile?.phone || "",
      Boolean(passwordPlain),
    ],
  );
  return created.rows[0];
}

function emailsMatch(left, right) {
  const a = String(left || "").trim().toLowerCase();
  const b = String(right || "").trim().toLowerCase();
  if (!a || !b) return false;
  if (a === b) return true;
  const key = (value) => String(value || "").split("@")[0].replace(/[^a-z0-9]/g, "");
  const leftKey = key(a);
  const rightKey = key(b);
  return Boolean(leftKey && leftKey === rightKey && leftKey.length >= 4);
}

function mergeById(...lists) {
  const map = new Map();
  for (const list of lists) {
    for (const row of list || []) {
      if (row?.id == null) continue;
      map.set(String(row.id), row);
    }
  }
  return [...map.values()];
}

async function jsonTable(tableName) {
  const result = await pool.query("SELECT id, data FROM app_records WHERE table_name = $1", [tableName]);
  return result.rows.map((row) => {
    const data = row.data && typeof row.data === "object" ? row.data : {};
    return { ...data, id: data.id || row.id };
  });
}

async function jsonUpsert(tableName, data) {
  const id = String(data.id || crypto.randomUUID());
  const payload = { ...data, id };
  await pool.query(
    `INSERT INTO app_records (id, table_name, data)
     VALUES ($1, $2, $3::jsonb)
     ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, table_name = EXCLUDED.table_name, updated_at = now()`,
    [id, tableName, JSON.stringify(payload)],
  );
  return payload;
}

async function jsonDelete(id) {
  await pool.query("DELETE FROM app_records WHERE id = $1", [id]);
}

function signUser(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
}

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return res.status(401).json({ error: "Sign in required" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Session expired. Sign in again." });
  }
}

function publicUser(row, role) {
  const meta = row.user_metadata || {};
  return {
    id: String(row.id),
    email: row.email || "",
    firstName: row.first_name || meta.first_name || "",
    lastName: row.last_name || meta.last_name || "",
    phone: row.phone || "",
    role: role || "admin",
  };
}

function normalizeCountry(value) {
  return String(value || "").trim().toLowerCase();
}

function matchCounselorByCountry(counselors, countries) {
  const targets = (Array.isArray(countries) ? countries : []).map(normalizeCountry).filter(Boolean);
  if (!targets.length) return null;

  let best = null;
  let bestScore = 0;
  for (const counselor of counselors.filter((row) => row.is_active !== false)) {
    const specs = (counselor.specializations || []).map(normalizeCountry);
    let score = 0;
    for (const target of targets) {
      if (specs.some((spec) => spec === target || spec.includes(target) || target.includes(spec))) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = counselor;
    }
  }
  return best;
}

function asLead(row) {
  const portal = row.entity_type === "student" || ["student_site", "student_chat"].includes(String(row.lead_source || ""));
  return {
    ...row,
    id: String(row.id),
    user_id: row.user_id == null ? row.user_id : String(row.user_id),
    first_name: row.first_name || "",
    last_name: row.last_name || "",
    email: row.email || "",
    phone: row.phone || "",
    field_of_interest: row.field_of_interest || "",
    academic_score: row.academic_score || "",
    preferred_countries: Array.isArray(row.preferred_countries) ? row.preferred_countries : [],
    assigned_counselor_id: row.assigned_counselor_id == null ? null : String(row.assigned_counselor_id),
    assigned_telecaller_id: row.assigned_telecaller_id == null ? null : String(row.assigned_telecaller_id),
    entity_type: portal ? "student" : (row.entity_type || "lead"),
    lead_status: row.lead_status || (portal ? "converted" : "warm"),
    lead_stage: row.lead_stage || row.lead_status || (portal ? "converted" : "warm"),
    lead_source: row.lead_source || "manual",
    priority: row.priority || "medium",
    notes: row.notes || "",
    next_follow_up_date: row.next_follow_up_date || null,
    last_contact_date: row.last_contact_date || null,
    conversion_date: row.conversion_date || null,
    created_at: row.created_at || null,
  };
}

function asDocument(row) {
  const status = row.status === "pending" ? "uploaded" : (row.status || "uploaded");
  return {
    ...row,
    id: String(row.id),
    user_id: row.user_id == null ? row.user_id : String(row.user_id),
    document_type: row.document_type || "",
    file_name: row.file_name || "",
    file_path: row.file_path || "",
    file_size: Number(row.file_size || 0),
    mime_type: row.mime_type || "",
    status,
    archived: Boolean(row.archived),
    admin_comments: row.admin_comments || "",
    reviewed_at: row.reviewed_at || null,
    created_at: row.created_at || null,
  };
}

function asApplication(row) {
  let status = row.status || "draft";
  if (status === "submitted") status = "pending_counselor";
  return {
    ...row,
    id: String(row.id),
    user_id: row.user_id == null ? row.user_id : String(row.user_id),
    university_name: row.university_name || "",
    course_name: row.course_name || "",
    country: row.country || "",
    city: row.city || "",
    intake_term: row.intake_term || "",
    priority_level: row.priority_level || "medium",
    status,
    notes: row.notes || "",
    counselor_comments: row.counselor_comments || "",
    created_at: row.created_at || null,
  };
}

async function applySchema() {
  const sql = readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const statements = sql
    .split(";")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
  for (const statement of statements) {
    await pool.query(statement);
  }
  await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS counselor_attendance_one_per_day ON counselor_attendance (counselor_id, date)").catch(() => {});
  await pool.query("CREATE UNIQUE INDEX IF NOT EXISTS counselor_salary_one_per_month ON counselor_salary_records (counselor_id, month, year)").catch(() => {});
}

async function ensureAdminUser() {
  const found = await pool.query("SELECT * FROM auth_users WHERE lower(email) = 'admin@local.test'");
  let user = found.rows[0];
  if (!user) {
    await pool.query(
      "INSERT INTO auth_users (id, email, password, user_metadata) VALUES ($1, $2, $3, $4::jsonb)",
      [ADMIN_ID, "admin@local.test", hashPassword("admin123"), JSON.stringify({ first_name: "Fly", last_name: "Admin" })],
    );
    user = { id: ADMIN_ID, email: "admin@local.test" };
  }
  const roles = await jsonTable("user_roles");
  if (!roles.some((row) => String(row.user_id) === String(user.id))) {
    await jsonUpsert("user_roles", { id: "role-a1", user_id: String(user.id), role: "admin" });
  }
  const profiles = await jsonTable("profiles");
  if (!profiles.some((row) => String(row.user_id) === String(user.id))) {
    await jsonUpsert("profiles", {
      id: "profile-a1",
      user_id: String(user.id),
      first_name: "Fly",
      last_name: "Admin",
      phone: "",
      country: "India",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
}

async function studentDirectory() {
  const profiles = await jsonTable("profiles");
  let users = [];
  try {
    const result = await pool.query("SELECT id, email, user_metadata FROM auth_users");
    users = result.rows;
  } catch {
    users = [];
  }
  return users.map((user) => {
    const profile = profiles.find((row) => String(row.user_id) === String(user.id));
    const meta = user.user_metadata || {};
    return {
      id: String(user.id),
      user_id: String(user.id),
      email: user.email || "",
      first_name: profile?.first_name || meta.first_name || "",
      last_name: profile?.last_name || meta.last_name || "",
      phone: profile?.phone || "",
      country: profile?.country || "",
    };
  });
}

async function roleFor(userId) {
  const roles = await jsonTable("user_roles");
  const found = roles.find((row) => String(row.user_id) === String(userId));
  return found?.role || "student";
}

function accountRole(roles, authUsers, userId, email) {
  const id = String(userId || "");
  const mail = String(email || "").trim().toLowerCase();
  const byId = roles.find((row) => String(row.user_id) === id);
  if (byId?.role) return byId.role;
  if (!mail) return null;
  const auth = authUsers.find((row) => String(row.email || "").trim().toLowerCase() === mail);
  if (!auth) return null;
  return roles.find((row) => String(row.user_id) === String(auth.id))?.role || "student";
}

async function publishCounselorAccount(row, passwordPlain) {
  const email = String(row.email || "").trim().toLowerCase();
  if (!email) return;
  const now = new Date().toISOString();
  const existing = await pool.query("SELECT id FROM auth_users WHERE lower(email) = $1", [email]).catch(() => ({ rows: [] }));
  let authId = existing.rows[0]?.id ? String(existing.rows[0].id) : "";
  const meta = JSON.stringify({
    first_name: row.first_name || "",
    last_name: row.last_name || "",
  });
  if (!authId) {
    authId = String(row.id);
    await pool.query(
      `INSERT INTO auth_users (id, email, password, user_metadata)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (email) DO UPDATE SET user_metadata = EXCLUDED.user_metadata`,
      [authId, email, hashPassword(passwordPlain || crypto.randomUUID()), meta],
    );
  } else {
    await pool.query("UPDATE auth_users SET user_metadata = $2::jsonb WHERE id = $1", [authId, meta]);
  }
  const confirmed = await pool.query("SELECT id FROM auth_users WHERE lower(email) = $1", [email]);
  if (confirmed.rows[0]?.id) authId = String(confirmed.rows[0].id);

  const roles = await jsonTable("user_roles");
  const current = roles.find((item) => String(item.user_id) === authId);
  if (current?.role !== "admin" && current?.role !== "super_admin") {
    await jsonUpsert("user_roles", { id: current?.id || `role-${authId}`, user_id: authId, role: "counselor" });
  }

  const profiles = await jsonTable("profiles");
  const profile = profiles.find((item) => String(item.user_id) === authId) || { id: `profile-${authId}`, user_id: authId };
  await jsonUpsert("profiles", {
    ...profile,
    user_id: authId,
    first_name: row.first_name || profile.first_name || "",
    last_name: row.last_name || profile.last_name || "",
    phone: row.phone || profile.phone || "",
    country: profile.country || "India",
    created_at: profile.created_at || now,
    updated_at: now,
  });

  const counselors = await jsonTable("counselors");
  const counselor = counselors.find((item) => String(item.user_id) === authId || String(item.user_id) === String(row.id))
    || { id: `counselor-${authId}`, user_id: authId };
  await jsonUpsert("counselors", {
    ...counselor,
    user_id: authId,
    is_active: true,
    specializations: row.specializations?.length ? row.specializations : (counselor.specializations || []),
    created_at: counselor.created_at || now,
    updated_at: now,
  });
}

async function syncPortalCounselors() {
  const sqlUsers = await pool.query(
    "SELECT id, email, first_name, last_name, phone, bio, specializations FROM counselor_users",
  );
  for (const row of sqlUsers.rows) {
    try {
      await publishCounselorAccount(row);
    } catch (error) {
      console.warn("Could not sync counselor", row.first_name, row.last_name, error.message);
    }
  }
}

async function loadCounselors() {
  await syncPortalCounselors().catch((error) => {
    console.warn("Counselor sync failed:", error.message);
  });
  const [sqlUsers, jsonCounselors, roles, profiles, authUsers] = await Promise.all([
    pool.query("SELECT id, email, first_name, last_name, phone, bio, specializations, created_at FROM counselor_users ORDER BY created_at DESC"),
    jsonTable("counselors"),
    jsonTable("user_roles"),
    jsonTable("profiles"),
    pool.query("SELECT id, email, user_metadata, created_at FROM auth_users").catch(() => ({ rows: [] })),
  ]);

  const counselorIds = new Set(
    roles.filter((row) => row.role === "counselor").map((row) => String(row.user_id)),
  );
  const counselorEmails = new Set(
    authUsers.rows
      .filter((row) => counselorIds.has(String(row.id)))
      .map((row) => String(row.email || "").trim().toLowerCase())
      .filter(Boolean),
  );

  const byKey = new Map();
  const put = (row, required = false) => {
    const email = String(row.email || "").trim().toLowerCase();
    const id = String(row.id || row.auth_user_id || "");
    const role = accountRole(roles, authUsers.rows, id, email);
    if (!required) {
      if (role === "admin" || role === "super_admin") return;
      if (role && role !== "counselor" && !counselorIds.has(id) && !counselorEmails.has(email)) return;
      if (!counselorIds.has(id) && !counselorEmails.has(email)) return;
    }
    const key = email || `id:${id}`;
    const current = byKey.get(key) || {};
    const uuidId = [id, current.id, row.auth_user_id, current.auth_user_id].find((value) => isUuid(value));
    const loginId = [current.auth_user_id, row.auth_user_id, current.id, id].find((value) => value && !isUuid(value));
    byKey.set(key, {
      id: uuidId || current.id || id,
      auth_user_id: loginId || row.auth_user_id || current.auth_user_id || id,
      email: email || current.email || "",
      first_name: row.first_name || current.first_name || "",
      last_name: row.last_name || current.last_name || "",
      phone: row.phone || current.phone || "",
      bio: row.bio || current.bio || "",
      specializations: row.specializations?.length ? row.specializations : (current.specializations || []),
      is_active: row.is_active == null ? (current.is_active ?? true) : Boolean(row.is_active),
      role: "counselor",
      created_at: current.created_at || row.created_at || null,
    });
  };

  for (const row of sqlUsers.rows) put(row, true);

  for (const role of roles.filter((row) => row.role === "counselor")) {
    const auth = authUsers.rows.find((item) => String(item.id) === String(role.user_id));
    const profile = profiles.find((item) => String(item.user_id) === String(role.user_id));
    const portal = sqlUsers.rows.find((item) => String(item.email || "").trim().toLowerCase() === String(auth?.email || "").trim().toLowerCase());
    const meta = auth?.user_metadata || {};
    put({
      id: role.user_id,
      auth_user_id: role.user_id,
      email: auth?.email || portal?.email || "",
      first_name: portal?.first_name || meta.first_name || profile?.first_name || "",
      last_name: portal?.last_name || meta.last_name || profile?.last_name || "",
      phone: portal?.phone || profile?.phone || "",
      bio: portal?.bio || "",
      specializations: portal?.specializations || [],
      created_at: auth?.created_at || portal?.created_at,
    }, true);
  }

  for (const row of jsonCounselors) {
    const auth = authUsers.rows.find((item) => String(item.id) === String(row.user_id));
    const profile = profiles.find((item) => String(item.user_id) === String(row.user_id));
    const portal = sqlUsers.rows.find((item) => String(item.email || "").trim().toLowerCase() === String(auth?.email || "").trim().toLowerCase());
    const meta = auth?.user_metadata || {};
    put({
      id: row.user_id || row.id,
      auth_user_id: row.user_id,
      email: auth?.email || portal?.email || "",
      first_name: portal?.first_name || meta.first_name || profile?.first_name || "",
      last_name: portal?.last_name || meta.last_name || profile?.last_name || "",
      phone: portal?.phone || profile?.phone || "",
      specializations: row.specializations || portal?.specializations || [],
      is_active: row.is_active !== false,
      created_at: row.created_at,
    });
  }

  return [...byKey.values()];
}

async function loadUsers() {
  const [authUsers, roles, profiles, sqlCounselors] = await Promise.all([
    pool.query("SELECT id, email, user_metadata, created_at FROM auth_users ORDER BY created_at DESC"),
    jsonTable("user_roles"),
    jsonTable("profiles"),
    pool.query("SELECT id, email, first_name, last_name, phone, created_at FROM counselor_users").catch(() => ({ rows: [] })),
  ]);
  const portalByEmail = new Map(
    sqlCounselors.rows.map((row) => [String(row.email || "").trim().toLowerCase(), row]),
  );
  const users = authUsers.rows.map((user) => {
    const email = String(user.email || "").trim().toLowerCase();
    const portal = portalByEmail.get(email);
    let role = roles.find((row) => String(row.user_id) === String(user.id))?.role || "student";
    if (portal && role !== "admin" && role !== "super_admin") role = "counselor";
    const profile = profiles.find((row) => String(row.user_id) === String(user.id));
    const meta = user.user_metadata || {};
    return {
      id: String(user.id),
      email: user.email,
      first_name: portal?.first_name || profile?.first_name || meta.first_name || "",
      last_name: portal?.last_name || profile?.last_name || meta.last_name || "",
      phone: portal?.phone || profile?.phone || "",
      country: profile?.country || "",
      role,
      is_active: profile?.is_active !== false,
      created_at: user.created_at,
    };
  });
  for (const row of sqlCounselors.rows) {
    const email = String(row.email || "").trim().toLowerCase();
    if (users.some((user) => String(user.email || "").trim().toLowerCase() === email)) continue;
    users.push({
      id: String(row.id),
      email: row.email,
      first_name: row.first_name || "",
      last_name: row.last_name || "",
      phone: row.phone || "",
      country: "",
      role: "counselor",
      is_active: true,
      created_at: row.created_at,
    });
  }
  return users;
}

function loadTelecallers(users) {
  return users
    .filter((user) => user.role === "telecaller")
    .map((user) => ({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      is_active: user.is_active !== false,
      created_at: user.created_at || null,
    }));
}

async function applyLeadPatch(id, patch, counselors = []) {
  if (patch.lead_status === "converted" || patch.entity_type === "student") {
    patch.entity_type = "student";
    patch.lead_stage = "converted";
    patch.lead_status = "converted";
    patch.conversion_date = patch.conversion_date || new Date().toISOString();
    if (!patch.assigned_counselor_id) {
      const jsonLeads = await jsonTable("student_leads");
      const current = jsonLeads.find((row) => String(row.id) === String(id)) || {};
      const countries = patch.preferred_countries || current.preferred_countries || [];
      const matched = matchCounselorByCountry(counselors, countries);
      if (matched) {
        patch.assigned_counselor_id = matched.id;
        patch.status = "assigned";
      }
    }
  }

  if (isUuid(id)) {
    const keys = Object.keys(patch).filter((key) => key !== "preferred_countries" || Array.isArray(patch.preferred_countries));
    if (keys.length) {
      const sets = keys.map((key, index) => `${key} = $${index + 2}`);
      const values = keys.map((key) => patch[key]);
      await pool.query(`UPDATE student_leads SET ${sets.join(", ")} WHERE id = $1`, [id, ...values]).catch(() => {});
    }
  }

  const jsonLeads = await jsonTable("student_leads");
  const shared = jsonLeads.find((row) => String(row.id) === String(id)) || { id };
  await jsonUpsert("student_leads", { ...shared, ...patch, id: shared.id || id });
  return { ...shared, ...patch, id: shared.id || id };
}

async function loadState() {
  const [
    sqlLeads,
    jsonLeads,
    sqlDocs,
    jsonDocs,
    jsonApps,
    sqlShort,
    jsonShort,
    sqlConv,
    jsonConv,
    sqlMsg,
    jsonMsg,
    sqlLeave,
    sqlAtt,
    sqlSalary,
    jsonNotes,
    sqlNotes,
    jsonUnis,
    jsonChecks,
    jsonChat,
    jsonChatMsgs,
    directory,
    counselors,
    users,
  ] = await Promise.all([
    pool.query("SELECT * FROM student_leads ORDER BY created_at DESC").catch(() => ({ rows: [] })),
    jsonTable("student_leads"),
    pool.query("SELECT * FROM documents ORDER BY created_at DESC").catch(() => ({ rows: [] })),
    jsonTable("documents"),
    jsonTable("applications"),
    pool.query("SELECT * FROM university_shortlists ORDER BY created_at DESC").catch(() => ({ rows: [] })),
    jsonTable("university_shortlists"),
    pool.query("SELECT * FROM private_conversations ORDER BY last_message_at DESC NULLS LAST").catch(() => ({ rows: [] })),
    jsonTable("private_conversations"),
    pool.query("SELECT * FROM private_messages ORDER BY created_at ASC").catch(() => ({ rows: [] })),
    jsonTable("private_messages"),
    pool.query("SELECT * FROM counselor_leave_requests ORDER BY applied_on DESC").catch(() => ({ rows: [] })),
    pool.query(
      `SELECT id, counselor_id, date::text AS date, clock_in::text AS clock_in, clock_out::text AS clock_out, total_hours, status
       FROM counselor_attendance ORDER BY date DESC`,
    ).catch(() => ({ rows: [] })),
    pool.query("SELECT * FROM counselor_salary_records ORDER BY year DESC, month DESC").catch(() => ({ rows: [] })),
    jsonTable("notifications"),
    pool.query("SELECT * FROM notifications ORDER BY created_at DESC").catch(() => ({ rows: [] })),
    jsonTable("universities"),
    jsonTable("document_checklists"),
    jsonTable("chat_sessions"),
    jsonTable("chat_messages"),
    studentDirectory(),
    loadCounselors(),
    loadUsers(),
  ]);

  const leads = mergeById(
    sqlLeads.rows.map(asLead),
    jsonLeads.map(asLead),
  ).map((lead) => {
    const person = directory.find((item) => item.user_id === String(lead.user_id) || emailsMatch(item.email, lead.email));
    if (!person) return lead;
    return {
      ...lead,
      first_name: lead.first_name || person.first_name,
      last_name: lead.last_name || person.last_name,
      email: lead.email || person.email,
      phone: lead.phone || person.phone,
    };
  });

  const studentIds = new Set(users.filter((row) => row.role === "student").map((row) => row.id));
  for (const person of directory) {
    if (!studentIds.has(person.user_id)) continue;
    if (leads.some((lead) => String(lead.user_id) === person.user_id || emailsMatch(lead.email, person.email))) continue;
    leads.push(asLead({
      id: person.user_id,
      user_id: person.user_id,
      email: person.email,
      first_name: person.first_name,
      last_name: person.last_name,
      phone: person.phone,
      assigned_counselor_id: null,
      lead_source: "student_site",
      entity_type: "student",
      created_at: new Date().toISOString(),
    }));
  }

  return {
    users,
    counselors,
    telecallers: loadTelecallers(users),
    leads,
    documents: mergeById(sqlDocs.rows.map(asDocument), jsonDocs.map(asDocument)),
    applications: jsonApps.map(asApplication),
    shortlists: mergeById(sqlShort.rows, jsonShort).map((row) => ({
      ...row,
      id: String(row.id),
      student_id: row.student_id == null ? row.student_id : String(row.student_id),
      counselor_id: row.counselor_id == null ? row.counselor_id : String(row.counselor_id),
      university_name: row.university_name || "",
      course_name: row.course_name || "",
      location: row.location || "",
      counselor_notes: row.counselor_notes || "",
      status: row.status || "recommended",
      created_at: row.created_at || null,
    })),
    conversations: mergeById(sqlConv.rows, jsonConv).map((row) => ({
      ...row,
      id: String(row.id),
      student_id: String(row.student_id),
      counselor_id: String(row.counselor_id),
    })),
    messages: mergeById(sqlMsg.rows, jsonMsg).map((row) => ({
      ...row,
      id: String(row.id),
      conversation_id: String(row.conversation_id),
      sender_id: String(row.sender_id),
      receiver_id: String(row.receiver_id),
      message: row.message || "",
      is_read: Boolean(row.is_read),
    })),
    leave: sqlLeave.rows,
    attendance: sqlAtt.rows.map((row) => ({
      ...row,
      clock_in: row.clock_in ? String(row.clock_in).slice(0, 8) : null,
      clock_out: row.clock_out ? String(row.clock_out).slice(0, 8) : null,
      date: String(row.date || "").slice(0, 10),
      total_hours: row.total_hours == null ? null : Number(row.total_hours),
    })),
    salary: sqlSalary.rows.map((row) => ({ ...row, net_salary: Number(row.net_salary || 0) })),
    notifications: mergeById(
      sqlNotes.rows.map((row) => ({ ...row, message: row.message || row.body || "" })),
      jsonNotes,
    ),
    universities: jsonUnis,
    checklists: jsonChecks.sort((a, b) => Number(a.display_order || 0) - Number(b.display_order || 0)),
    chatSessions: jsonChat,
    chatMessages: jsonChatMsgs,
  };
}

async function notify(userId, title, message, type = "info", actionUrl = "") {
  if (!userId) return;
  const now = new Date().toISOString();
  const row = {
    id: crypto.randomUUID(),
    user_id: String(userId),
    title,
    message,
    type,
    action_url: actionUrl,
    created_at: now,
    is_read: false,
  };
  await jsonUpsert("notifications", row);
  if (isUuid(userId)) {
    await pool.query(
      "INSERT INTO notifications (id, user_id, title, message, is_read, created_at) VALUES ($1,$2,$3,$4,false,now()) ON CONFLICT (id) DO NOTHING",
      [row.id, userId, title, message],
    ).catch(() => {});
  }
}

const app = express();
app.use(cors());
app.use(express.json({ limit: "12mb" }));

app.get("/api/health", async (_req, res) => {
  try {
    const info = await pool.query("SELECT current_database() AS database, current_user AS db_user");
    res.json({ ok: true, database: "connected", info: info.rows[0] });
  } catch (error) {
    res.status(503).json({ ok: false, error: error.message || "PostgreSQL is not connected" });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const firstName = String(req.body.firstName || "").trim();
    const lastName = String(req.body.lastName || "").trim();
    const phone = String(req.body.phone || "").trim();
    if (!email || password.length < 6) {
      return res.status(400).json({ error: "Email and a password of at least 6 characters are required." });
    }
    if (!firstName || !lastName) {
      return res.status(400).json({ error: "First name and last name are required." });
    }
    const existing = await pool.query("SELECT id FROM auth_users WHERE lower(email) = $1", [email]);
    if (existing.rows[0]) {
      return res.status(400).json({ error: "An account with this email already exists. Sign in instead." });
    }
    const id = `admin-${crypto.randomUUID()}`;
    await pool.query(
      "INSERT INTO auth_users (id, email, password, user_metadata) VALUES ($1,$2,$3,$4::jsonb)",
      [id, email, hashPassword(password), JSON.stringify({ first_name: firstName, last_name: lastName })],
    );
    await jsonUpsert("user_roles", { id: `role-${id}`, user_id: id, role: "admin" });
    await jsonUpsert("profiles", {
      id: `profile-${id}`,
      user_id: id,
      first_name: firstName,
      last_name: lastName,
      phone,
      country: "India",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    const user = publicUser({ id, email, first_name: firstName, last_name: lastName, phone }, "admin");
    res.json({ token: signUser(user), user });
  } catch (error) {
    res.status(500).json({ error: error.message || "Could not create account" });
  }
});

app.post("/api/auth/signin", async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const found = await pool.query("SELECT * FROM auth_users WHERE lower(email) = $1", [email]);
    const row = found.rows[0];
    if (!row || !verifyPassword(password, row.password)) {
      return res.status(401).json({ error: "Wrong email or password." });
    }
    if (!String(row.password).startsWith("scrypt:")) {
      const next = hashPassword(password);
      await pool.query("UPDATE auth_users SET password = $2 WHERE id = $1", [row.id, next]);
      row.password = next;
    }
    const role = await roleFor(row.id);
    if (role !== "admin" && role !== "super_admin") {
      return res.status(403).json({ error: "Admin access required. Use the student or counselor portal instead." });
    }
    const profiles = await jsonTable("profiles");
    const profile = profiles.find((item) => String(item.user_id) === String(row.id));
    const user = publicUser({ ...row, first_name: profile?.first_name, last_name: profile?.last_name, phone: profile?.phone }, role);
    res.json({ token: signUser(user), user });
  } catch (error) {
    res.status(500).json({ error: error.message || "Could not sign in" });
  }
});

app.get("/api/me", auth, async (req, res) => {
  const found = await pool.query("SELECT * FROM auth_users WHERE id = $1", [req.user.id]);
  if (!found.rows[0]) return res.status(401).json({ error: "Account not found" });
  const role = await roleFor(req.user.id);
  if (role !== "admin" && role !== "super_admin") return res.status(403).json({ error: "Admin access required" });
  const profiles = await jsonTable("profiles");
  const profile = profiles.find((item) => String(item.user_id) === String(req.user.id));
  res.json({ user: publicUser({ ...found.rows[0], first_name: profile?.first_name, last_name: profile?.last_name, phone: profile?.phone }, role) });
});

app.get("/api/state", auth, async (_req, res) => {
  try {
    res.json(await loadState());
  } catch (error) {
    res.status(500).json({ error: error.message || "Could not load admin data" });
  }
});

app.post("/api/leads", auth, async (req, res) => {
  const studentId = crypto.randomUUID();
  const countries = String(req.body.countries || "").split(",").map((item) => item.trim()).filter(Boolean);
  const telecallerId = req.body.telecallerId || null;
  const payload = {
    id: crypto.randomUUID(),
    user_id: studentId,
    email: String(req.body.email || "").trim().toLowerCase(),
    phone: req.body.phone || "",
    first_name: req.body.firstName || "",
    last_name: req.body.lastName || "",
    preferred_countries: countries,
    field_of_interest: req.body.field || "",
    academic_score: req.body.score || "",
    lead_status: "warm",
    lead_stage: "warm",
    lead_source: req.body.source || "manual",
    priority: req.body.priority || "medium",
    assigned_telecaller_id: telecallerId,
    assigned_counselor_id: null,
    entity_type: "lead",
    status: telecallerId ? "assigned" : "new",
    notes: req.body.notes || "",
    created_at: new Date().toISOString(),
  };
  if (isUuid(payload.id) && isUuid(studentId)) {
    await pool.query(
      `INSERT INTO student_leads (
        id, user_id, email, phone, first_name, last_name, preferred_countries, field_of_interest,
        academic_score, lead_status, lead_stage, lead_source, assigned_telecaller_id, assigned_counselor_id, entity_type, status, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'warm','warm',$10,$11,NULL,'lead',$12,$13)
      ON CONFLICT (id) DO NOTHING`,
      [
        payload.id, studentId, payload.email, payload.phone, payload.first_name, payload.last_name, countries,
        payload.field_of_interest, payload.academic_score, payload.lead_source,
        isUuid(telecallerId) ? telecallerId : null, payload.status, payload.notes,
      ],
    ).catch(() => {});
  }
  await jsonUpsert("student_leads", payload);
  if (telecallerId) {
    await notify(telecallerId, "New lead assigned", `${payload.first_name} ${payload.last_name} was assigned to you.`, "info", "/admin/leads");
  }
  res.json(payload);
});

app.patch("/api/leads/:id", auth, async (req, res) => {
  const allowed = [
    "lead_status", "lead_stage", "notes", "next_follow_up_date", "last_contact_date",
    "conversion_date", "entity_type", "assigned_counselor_id", "assigned_telecaller_id", "status", "priority",
    "first_name", "last_name", "email", "phone", "field_of_interest", "academic_score", "preferred_countries",
  ];
  const entries = Object.entries(req.body).filter(([key]) => allowed.includes(key));
  if (!entries.length) return res.json({ ok: true });
  const patch = Object.fromEntries(entries);
  const jsonLeads = await jsonTable("student_leads");
  const current = jsonLeads.find((row) => String(row.id) === String(req.params.id));
  const currentlyLead = current && current.entity_type !== "student" && current.lead_status !== "converted";
  if (currentlyLead) {
    patch.assigned_counselor_id = null;
  }
  const state = await loadState();
  const updated = await applyLeadPatch(req.params.id, patch, state.counselors);
  if (patch.assigned_telecaller_id) {
    await notify(patch.assigned_telecaller_id, "Lead assigned", "A student lead was assigned to you.", "info", "/admin/leads");
  }
  if (updated.assigned_counselor_id && (patch.lead_status === "converted" || patch.entity_type === "student")) {
    await notify(updated.assigned_counselor_id, "Student assigned", `${updated.first_name || "A student"} was assigned to you based on country preference.`, "info", "/counselor/students");
  }
  if (patch.assigned_counselor_id && patch.lead_status !== "converted" && patch.entity_type !== "student") {
    await notify(patch.assigned_counselor_id, "Student assigned", "A converted student was assigned to you.", "info", "/counselor/students");
  }
  res.json({ ok: true, lead: updated });
});

app.post("/api/leads/:id/convert", auth, async (req, res) => {
  const state = await loadState();
  const jsonLeads = await jsonTable("student_leads");
  const current = jsonLeads.find((row) => String(row.id) === String(req.params.id));
  if (!current) return res.status(404).json({ error: "Lead not found." });
  const patch = {
    lead_status: "converted",
    lead_stage: "converted",
    entity_type: "student",
    conversion_date: new Date().toISOString(),
    last_contact_date: new Date().toISOString(),
    preferred_countries: current.preferred_countries,
  };
  const updated = await applyLeadPatch(req.params.id, patch, state.counselors);
  if (updated.assigned_counselor_id) {
    await notify(updated.assigned_counselor_id, "Student assigned", `${updated.first_name || "A student"} was auto-assigned to you by country.`, "info", "/counselor/students");
  }
  res.json({ ok: true, lead: updated });
});

app.post("/api/leads/bulk-assign", auth, async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(String) : [];
  const counselorId = req.body.counselorId ? String(req.body.counselorId) : "";
  const autoByCountry = Boolean(req.body.autoByCountry);
  if (!ids.length) return res.status(400).json({ error: "Select at least one student." });
  const state = await loadState();
  let count = 0;
  for (const id of ids) {
    const jsonLeads = await jsonTable("student_leads");
    const lead = jsonLeads.find((row) => String(row.id) === id);
    if (!lead) continue;
    const converted = lead.entity_type === "student" || lead.lead_status === "converted";
    if (!converted) continue;
    let targetCounselorId = counselorId;
    if (autoByCountry) {
      const matched = matchCounselorByCountry(state.counselors, lead.preferred_countries || []);
      targetCounselorId = matched?.id || counselorId;
    }
    if (!targetCounselorId) continue;
    await applyLeadPatch(id, { assigned_counselor_id: targetCounselorId, status: "assigned" }, state.counselors);
    count += 1;
  }
  if (counselorId && !autoByCountry) {
    await notify(counselorId, "Students assigned", `${count} student(s) were assigned to you.`, "info", "/counselor/students");
  }
  res.json({ ok: true, count });
});

app.post("/api/leads/bulk-assign-telecaller", auth, async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids.map(String) : [];
  const telecallerId = req.body.telecallerId ? String(req.body.telecallerId) : "";
  if (!ids.length || !telecallerId) return res.status(400).json({ error: "Select leads and a telecaller." });
  for (const id of ids) {
    const jsonLeads = await jsonTable("student_leads");
    const lead = jsonLeads.find((row) => String(row.id) === id);
    if (!lead || lead.entity_type === "student" || lead.lead_status === "converted") continue;
    await applyLeadPatch(id, { assigned_telecaller_id: telecallerId, status: "assigned" });
  }
  await notify(telecallerId, "Leads assigned", `${ids.length} lead(s) were assigned to you.`, "info", "/admin/leads");
  res.json({ ok: true, count: ids.length });
});

app.patch("/api/documents/:id", auth, async (req, res) => {
  const status = String(req.body.status || "").trim();
  const comments = req.body.comments == null ? undefined : String(req.body.comments);
  if (!["uploaded", "approved", "rejected", "pending"].includes(status)) {
    return res.status(400).json({ error: "Status must be approved or rejected." });
  }
  const now = new Date().toISOString();
  if (isUuid(req.params.id)) await pool.query("UPDATE documents SET status = $2 WHERE id = $1", [req.params.id, status]).catch(() => {});
  const docs = await jsonTable("documents");
  const found = docs.find((row) => String(row.id) === String(req.params.id));
  if (found) {
    await jsonUpsert("documents", {
      ...found,
      status,
      admin_comments: comments !== undefined ? comments : found.admin_comments,
      reviewed_by: req.user.id,
      reviewed_at: now,
      updated_at: now,
    });
    await notify(
      found.user_id,
      status === "approved" ? "Document approved" : "Document rejected",
      comments || (status === "approved"
        ? `${found.document_type} was approved.`
        : `${found.document_type} was rejected. Please upload a corrected file.`),
      status === "approved" ? "success" : "error",
      "/student/documents",
    );
  }
  res.json({ ok: true });
});

app.get("/api/documents/:id/file", auth, async (req, res) => {
  const docs = await jsonTable("documents");
  const found = docs.find((row) => String(row.id) === String(req.params.id));
  if (!found?.file_path) return res.status(404).json({ error: "File not found" });
  const file = await pool.query("SELECT data_url FROM app_storage WHERE path = $1", [found.file_path]);
  if (!file.rows[0]?.data_url) return res.status(404).json({ error: "File not found" });
  res.json({ fileName: found.file_name || "document", dataUrl: file.rows[0].data_url });
});

app.patch("/api/applications/:id", auth, async (req, res) => {
  const status = String(req.body.status || "").trim();
  const comments = req.body.comments == null ? "" : String(req.body.comments);
  if (!["counselor_approved", "returned", "offer", "rejected", "submitted", "pending_counselor"].includes(status)) {
    return res.status(400).json({ error: "Invalid application status." });
  }
  const apps = await jsonTable("applications");
  const found = apps.find((row) => String(row.id) === String(req.params.id));
  if (!found) return res.status(404).json({ error: "Application not found" });
  const now = new Date().toISOString();
  await jsonUpsert("applications", {
    ...found,
    status,
    counselor_comments: comments || found.counselor_comments,
    reviewed_at: now,
    updated_at: now,
  });
  await notify(
    found.user_id,
    status === "returned" ? "Application returned" : "Application updated",
    comments || `Your ${found.university_name} application is now ${status.replaceAll("_", " ")}.`,
    status === "returned" ? "warning" : "info",
    "/student/applications",
  );
  res.json({ ok: true });
});

app.patch("/api/leave/:id", auth, async (req, res) => {
  const status = String(req.body.status || "");
  if (!["approved", "rejected", "pending"].includes(status)) return res.status(400).json({ error: "Invalid leave status." });
  const comments = String(req.body.comments || "");
  const updated = await pool.query(
    "UPDATE counselor_leave_requests SET status = $2 WHERE id = $1 RETURNING *",
    [req.params.id, status],
  ).catch(() => ({ rows: [] }));
  const row = updated.rows[0];
  if (row?.counselor_id) {
    await notify(row.counselor_id, `Leave ${status}`, comments || `Your leave request was ${status}.`, status === "approved" ? "success" : "warning", "/counselor/leave");
  }
  res.json({ ok: true, row });
});

app.post("/api/salary", auth, async (req, res) => {
  const counselorId = String(req.body.counselorId || "");
  const month = String(req.body.month || "");
  const year = Number(req.body.year || new Date().getFullYear());
  const net = Number(req.body.netSalary || 0);
  const notes = String(req.body.notes || "");
  if (!counselorId || !month) return res.status(400).json({ error: "Counselor, month, and amount are required." });
  if (!isUuid(counselorId)) return res.status(400).json({ error: "This counselor record is not linked to HR tables yet." });
  const row = await pool.query(
    `INSERT INTO counselor_salary_records (counselor_id, month, year, net_salary, notes)
     VALUES ($1,$2,$3,$4,$5)
     ON CONFLICT (counselor_id, month, year) DO UPDATE SET net_salary = EXCLUDED.net_salary, notes = EXCLUDED.notes
     RETURNING *`,
    [counselorId, month, year, net, notes],
  );
  await notify(counselorId, "Salary posted", `${month} ${year}: ₹${net}`, "info", "/counselor/salary");
  res.json(row.rows[0]);
});

app.put("/api/users/:id/role", auth, async (req, res) => {
  const role = String(req.body.role || "");
  if (!["student", "telecaller", "counselor", "admin", "super_admin"].includes(role)) {
    return res.status(400).json({ error: "Invalid role." });
  }
  const roles = await jsonTable("user_roles");
  const existing = roles.find((row) => String(row.user_id) === String(req.params.id));
  await jsonUpsert("user_roles", { id: existing?.id || `role-${req.params.id}`, user_id: req.params.id, role });
  if (role === "counselor") {
    const counselors = await jsonTable("counselors");
    const found = counselors.find((row) => String(row.user_id) === String(req.params.id));
    await jsonUpsert("counselors", {
      id: found?.id || `counselor-${req.params.id}`,
      user_id: req.params.id,
      is_active: true,
      specializations: found?.specializations || ["Study Abroad"],
      created_at: found?.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    await ensureCounselorLogin(req.params.id).catch(() => {});
  }
  res.json({ ok: true });
});

app.put("/api/users/:id/password", auth, async (req, res) => {
  const password = String(req.body.password || "");
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters." });
  await pool.query("UPDATE auth_users SET password = $2 WHERE id = $1", [req.params.id, hashPassword(password)]);
  const role = (await jsonTable("user_roles")).find((row) => String(row.user_id) === String(req.params.id))?.role;
  const counselor = await pool.query("SELECT id FROM counselor_users WHERE email = (SELECT email FROM auth_users WHERE id = $1)", [req.params.id]).catch(() => ({ rows: [] }));
  if (counselor.rows[0]) {
    await pool.query("UPDATE counselor_users SET password_hash = $2 WHERE id = $1", [counselor.rows[0].id, await bcrypt.hash(password, 10)]);
  } else if (role === "counselor") {
    await ensureCounselorLogin(req.params.id, password).catch(() => {});
  }
  res.json({ ok: true });
});

app.post("/api/users", auth, async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "changeme123");
  const firstName = String(req.body.firstName || "").trim();
  const lastName = String(req.body.lastName || "").trim();
  const role = String(req.body.role || "student");
  const phone = String(req.body.phone || "");
  if (!email || password.length < 6) return res.status(400).json({ error: "Email and a password of at least 6 characters are required." });
  if (!["student", "telecaller", "counselor", "admin", "super_admin"].includes(role)) return res.status(400).json({ error: "Invalid role." });
  const existing = await pool.query("SELECT id FROM auth_users WHERE lower(email) = $1", [email]);
  if (existing.rows[0]) return res.status(400).json({ error: "An account with this email already exists." });
  const id = role === "counselor" ? crypto.randomUUID() : `user-${crypto.randomUUID()}`;
  await pool.query(
    "INSERT INTO auth_users (id, email, password, user_metadata) VALUES ($1,$2,$3,$4::jsonb)",
    [id, email, hashPassword(password), JSON.stringify({ first_name: firstName, last_name: lastName })],
  );
  await jsonUpsert("user_roles", { id: `role-${id}`, user_id: id, role });
  await jsonUpsert("profiles", {
    id: `profile-${id}`,
    user_id: id,
    first_name: firstName,
    last_name: lastName,
    phone,
    country: req.body.country || "India",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (role === "counselor") {
    const hash = await bcrypt.hash(password, 10);
    const created = await pool.query(
      `INSERT INTO counselor_users (id, email, password_hash, first_name, last_name, phone)
       VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         phone = EXCLUDED.phone
       RETURNING *`,
      [isUuid(id) ? id : crypto.randomUUID(), email, hash, firstName, lastName, phone],
    );
    await jsonUpsert("counselors", {
      id: `counselor-${id}`,
      user_id: id,
      is_active: true,
      specializations: String(req.body.specializations || "Study Abroad").split(",").map((item) => item.trim()).filter(Boolean),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    res.json({ ok: true, id, counselorId: created.rows[0]?.id });
    return;
  }
  res.json({ ok: true, id });
});

app.post("/api/universities", auth, async (req, res) => {
  const payload = {
    id: req.body.id || `uni-${crypto.randomUUID()}`,
    name: String(req.body.name || "").trim(),
    country: String(req.body.country || "").trim(),
    city: String(req.body.city || "").trim(),
    ranking: Number(req.body.ranking || 0),
    is_active: req.body.is_active !== false,
    is_tie_up: Boolean(req.body.is_tie_up),
    website_url: String(req.body.website_url || ""),
    tuition: req.body.tuition || "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (!payload.name) return res.status(400).json({ error: "University name is required." });
  await jsonUpsert("universities", payload);
  res.json(payload);
});

app.patch("/api/universities/:id", auth, async (req, res) => {
  const rows = await jsonTable("universities");
  const found = rows.find((row) => String(row.id) === String(req.params.id));
  if (!found) return res.status(404).json({ error: "University not found" });
  const next = { ...found, ...req.body, id: found.id, updated_at: new Date().toISOString() };
  await jsonUpsert("universities", next);
  res.json(next);
});

app.delete("/api/universities/:id", auth, async (req, res) => {
  await jsonDelete(req.params.id);
  res.json({ ok: true });
});

app.post("/api/checklists", auth, async (req, res) => {
  const payload = {
    id: req.body.id || `dc-${crypto.randomUUID()}`,
    document_type: String(req.body.document_type || "").trim(),
    description: String(req.body.description || ""),
    is_required: req.body.is_required !== false,
    is_active: req.body.is_active !== false,
    max_file_size_mb: Number(req.body.max_file_size_mb || 20),
    allowed_file_types: Array.isArray(req.body.allowed_file_types)
      ? req.body.allowed_file_types
      : String(req.body.allowed_file_types || "pdf").split(",").map((item) => item.trim()).filter(Boolean),
    country: req.body.country || "All",
    countries: req.body.countries || ["All"],
    degree_type: req.body.degree_type || "All",
    degree_types: req.body.degree_types || ["All"],
    display_order: Number(req.body.display_order || 99),
  };
  if (!payload.document_type) return res.status(400).json({ error: "Document type is required." });
  await jsonUpsert("document_checklists", payload);
  res.json(payload);
});

app.patch("/api/checklists/:id", auth, async (req, res) => {
  const rows = await jsonTable("document_checklists");
  const found = rows.find((row) => String(row.id) === String(req.params.id));
  if (!found) return res.status(404).json({ error: "Checklist item not found" });
  await jsonUpsert("document_checklists", { ...found, ...req.body, id: found.id });
  res.json({ ok: true });
});

app.post("/api/notifications", auth, async (req, res) => {
  const userId = String(req.body.userId || "");
  const title = String(req.body.title || "").trim();
  const message = String(req.body.message || "").trim();
  if (!userId || !title) return res.status(400).json({ error: "Recipient and title are required." });
  await notify(userId, title, message, req.body.type || "info", req.body.actionUrl || "");
  res.json({ ok: true });
});

app.post("/api/notifications/broadcast", auth, async (req, res) => {
  const title = String(req.body.title || "").trim();
  const message = String(req.body.message || "").trim();
  const audience = String(req.body.audience || "students");
  if (!title) return res.status(400).json({ error: "Title is required." });
  const users = await loadUsers();
  const targets = users.filter((user) => {
    if (audience === "all") return true;
    if (audience === "students") return user.role === "student";
    if (audience === "counselors") return user.role === "counselor";
    return false;
  });
  for (const user of targets) {
    await notify(user.id, title, message, "info");
  }
  const counselors = await loadCounselors();
  if (audience === "counselors" || audience === "all") {
    for (const counselor of counselors) {
      if (isUuid(counselor.id) && !targets.some((user) => user.id === counselor.id || user.email === counselor.email)) {
        await notify(counselor.id, title, message, "info");
      }
    }
  }
  res.json({ ok: true, count: targets.length });
});

async function start() {
  await applySchema();
  await ensureAdminUser();
  app.listen(PORT, () => {
    console.log(`Fly Masters admin API on http://127.0.0.1:${PORT}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
