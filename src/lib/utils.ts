export function displayName(first?: string, last?: string, fallback = "User") {
  const name = [first, last].filter(Boolean).join(" ").trim();
  return name || fallback;
}

export function initials(first?: string, last?: string, email?: string) {
  const a = first?.[0] || email?.[0] || "U";
  const b = last?.[0] || "";
  return (a + b).toUpperCase();
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function counselorLabel(
  counselors: Array<{ id: string; auth_user_id?: string | null; first_name?: string; last_name?: string; email?: string }>,
  id?: string | null,
) {
  if (!id) return "Unassigned";
  const found = counselors.find((row) => row.id === id || row.auth_user_id === id);
  if (!found) return "Counselor";
  return displayName(found.first_name, found.last_name, found.email || "Counselor");
}

export function telecallerLabel(
  telecallers: Array<{ id: string; first_name?: string; last_name?: string; email?: string }>,
  id?: string | null,
) {
  if (!id) return "Unassigned";
  const found = telecallers.find((row) => row.id === id);
  if (!found) return "Telecaller";
  return displayName(found.first_name, found.last_name, found.email || "Telecaller");
}

function normalizeCountry(value: string) {
  return value.trim().toLowerCase();
}

export function suggestCounselorForCountries(
  counselors: Array<{ id: string; auth_user_id?: string | null; first_name?: string; last_name?: string; email?: string; specializations?: string[]; is_active?: boolean }>,
  countries: string[],
) {
  const targets = countries.map(normalizeCountry).filter(Boolean);
  if (!targets.length) return null;

  let best: (typeof counselors)[number] | null = null;
  let bestScore = 0;

  for (const counselor of counselors.filter((row) => row.is_active !== false)) {
    const specs = (counselor.specializations || []).map(normalizeCountry);
    let score = 0;
    for (const target of targets) {
      if (specs.some((spec) => spec === target || spec.includes(target) || target.includes(spec))) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      best = counselor;
    }
  }

  return best;
}

export function isConvertedStudent(lead: { entity_type?: string; lead_status?: string }) {
  return lead.entity_type === "student" || lead.lead_status === "converted";
}

export function personName(
  people: Array<{ user_id?: string; id?: string; first_name?: string; last_name?: string; email?: string }>,
  id?: string | null,
) {
  if (!id) return "Unknown";
  const found = people.find((row) => row.user_id === id || row.id === id);
  return found ? displayName(found.first_name, found.last_name, found.email || "Student") : "Student";
}

/**
 * A counselor is referenced by either its own id or its auth_user_id, depending on
 * whether the row came from counselor_users or from the auth/roles tables.
 */
export function counselorOwns(
  counselor: { id: string; auth_user_id?: string | null },
  counselorId?: string | null,
) {
  if (!counselorId) return false;
  return counselorId === counselor.id || (counselor.auth_user_id ? counselorId === counselor.auth_user_id : false);
}

/**
 * Documents, applications, shortlists and conversations key off a student id that may
 * be either the lead's user_id or the lead's own id. Always check both.
 */
export function studentOwns(student: { id: string; user_id?: string }, ownerId?: string | null) {
  if (!ownerId) return false;
  return ownerId === student.user_id || ownerId === student.id;
}