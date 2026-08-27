export interface GatewayDepartmentNode {
  id: string;
  name: string;
}

export interface GatewayDepartmentMembership {
  department: GatewayDepartmentNode;
  isPrimary: boolean;
  path: GatewayDepartmentNode[];
}

export interface GatewayUser {
  id: string;
  uid: string;
  employeeNumber: string;
  employeeType: string;
  department: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  chineseName: string;
  englishName: string;
  authSubjectId: string;
  jobLevel: string;
  departments: GatewayDepartmentMembership[];
  sourceUpdatedAt: string;
  identitySource: string;
  departmentIds: string[];
  departmentNames: string[];
}

type HeaderRecord = Record<string, string | null | undefined>;
type HeaderSource = Pick<Headers, "get"> | HeaderRecord;

export class GatewayIdentityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GatewayIdentityError";
  }
}

function header(source: HeaderSource, name: string): string {
  if ("get" in source && typeof source.get === "function") {
    return source.get(name) ?? "";
  }
  const record = source as HeaderRecord;
  return record[name] ?? record[name.toLowerCase()] ?? "";
}

function payloadString(
  payload: Record<string, unknown>,
  key: string,
  maxLength = 255,
): string {
  const value = payload[key];
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed.length <= maxLength ? trimmed : "";
}

function decodeBase64UrlJson(encoded: string): Record<string, unknown> {
  try {
    const padded = encoded + "=".repeat((4 - (encoded.length % 4)) % 4);
    const raw = Buffer.from(
      padded.replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8");
    const payload: unknown = JSON.parse(raw);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      throw new Error("identity payload is not an object");
    }
    return payload as Record<string, unknown>;
  } catch {
    throw new GatewayIdentityError("invalid gateway identity");
  }
}

function decodeHeaderValue(value: string, percentEncoded: boolean): string {
  if (!value) return "";
  if (!percentEncoded) return value.trim();
  try {
    return decodeURIComponent(value).trim();
  } catch {
    throw new GatewayIdentityError("invalid percent-encoded gateway header");
  }
}

function safeHttpsUrl(value: string): string {
  if (!value || value.length > 2048) return "";
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !url.host || url.username || url.password) {
      return "";
    }
    return value;
  } catch {
    return "";
  }
}

function departmentNode(value: unknown): GatewayDepartmentNode | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const id = payloadString(record, "id");
  const name = payloadString(record, "name");
  if (!id && !name) return null;
  return { id, name };
}

function isDepartmentNode(
  value: GatewayDepartmentNode | null,
): value is GatewayDepartmentNode {
  return value !== null;
}

function parseDepartments(payload: Record<string, unknown>): {
  departments: GatewayDepartmentMembership[];
  departmentIds: string[];
  departmentNames: string[];
} {
  const raw = payload.departments;
  if (!Array.isArray(raw)) {
    return { departments: [], departmentIds: [], departmentNames: [] };
  }

  const ids = new Set<string>();
  const names = new Set<string>();
  const departments: GatewayDepartmentMembership[] = [];

  for (const item of raw.slice(0, 100)) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const record = item as Record<string, unknown>;
    const direct = departmentNode(record.department) ?? { id: "", name: "" };
    const path = Array.isArray(record.path)
      ? record.path.slice(0, 32).map(departmentNode).filter(isDepartmentNode)
      : [];

    for (const node of [direct, ...path]) {
      if (node.id) ids.add(node.id);
      if (node.name) names.add(node.name);
    }

    if (direct.id || direct.name || path.length > 0) {
      departments.push({
        department: direct,
        isPrimary: record.isPrimary === true,
        path,
      });
    }
  }

  return {
    departments,
    departmentIds: [...ids],
    departmentNames: [...names],
  };
}

function normalizeGatewayUser(payload: Record<string, unknown>): GatewayUser {
  const id = payloadString(payload, "id");
  if (!id) {
    throw new GatewayIdentityError("missing stable user id");
  }

  const parsedDepartments = parseDepartments(payload);
  const primaryDepartment =
    parsedDepartments.departments.find((item) => item.isPrimary)?.department
      .name ?? "";
  const firstDepartment =
    parsedDepartments.departments.find((item) => item.department.name)
      ?.department.name ?? "";
  const uid = payloadString(payload, "uid");
  const chineseName = payloadString(payload, "chinese_name");
  const englishName = payloadString(payload, "english_name");
  const displayName =
    payloadString(payload, "display_name") || chineseName || englishName || uid || id;
  const department =
    payloadString(payload, "department") || primaryDepartment || firstDepartment;

  return {
    id,
    uid,
    employeeNumber: payloadString(payload, "employee_number"),
    employeeType: payloadString(payload, "employee_type"),
    department,
    email: payloadString(payload, "email", 320),
    displayName,
    avatarUrl: safeHttpsUrl(payloadString(payload, "avatar_url", 2048)),
    chineseName,
    englishName,
    authSubjectId: payloadString(payload, "auth_subject_id"),
    jobLevel: payloadString(payload, "job_level"),
    departments: parsedDepartments.departments,
    sourceUpdatedAt: payloadString(payload, "source_updated_at"),
    identitySource: payloadString(payload, "identity_source"),
    departmentIds: parsedDepartments.departmentIds,
    departmentNames: parsedDepartments.departmentNames,
  };
}

function singleFieldPayload(source: HeaderSource): Record<string, unknown> {
  const percentEncoded =
    header(source, "X-User-Header-Encoding").toLowerCase() === "percent";
  return {
    id: decodeHeaderValue(header(source, "X-User-Id"), percentEncoded),
    uid: decodeHeaderValue(header(source, "X-User-Uid"), percentEncoded),
    employee_number: decodeHeaderValue(
      header(source, "X-User-Employee-Number"),
      percentEncoded,
    ),
    employee_type: decodeHeaderValue(
      header(source, "X-User-Employee-Type"),
      percentEncoded,
    ),
    department: decodeHeaderValue(
      header(source, "X-User-Department"),
      percentEncoded,
    ),
    email: decodeHeaderValue(header(source, "X-User-Email"), percentEncoded),
    display_name: decodeHeaderValue(
      header(source, "X-User-Display-Name"),
      percentEncoded,
    ),
    avatar_url: decodeHeaderValue(
      header(source, "X-User-Avatar-Url"),
      percentEncoded,
    ),
  };
}

export function parseGatewayUserFromHeaders(
  source: HeaderSource,
): GatewayUser | null {
  const encoded = header(source, "X-User-Base64");
  if (encoded) {
    return normalizeGatewayUser(decodeBase64UrlJson(encoded));
  }

  const payload = singleFieldPayload(source);
  if (!payload.id) return null;
  return normalizeGatewayUser(payload);
}
