import assert from "node:assert/strict";
import test from "node:test";
import {
  GatewayIdentityError,
  parseGatewayUserFromHeaders,
} from "./gateway-auth";

function encodeIdentity(payload: Record<string, unknown>): string {
  return Buffer.from(JSON.stringify(payload), "utf8")
    .toString("base64url")
    .replace(/=+$/, "");
}

test("parses Auth Hub base64 identity with directory memberships", () => {
  const user = parseGatewayUserFromHeaders({
    "x-user-base64": encodeIdentity({
      id: "authhub-stable-1",
      uid: "z100",
      employee_number: "E100",
      employee_type: "employee",
      chinese_name: "张三",
      email: "z100@example.test",
      avatar_url: "https://avatar.example.test/users/z100",
      departments: [
        {
          department: { id: "dept-fe", name: "前端组" },
          isPrimary: true,
          path: [
            { id: "dept-root", name: "总公司" },
            { id: "dept-rd", name: "研发部" },
          ],
        },
      ],
    }),
  });

  assert.equal(user?.id, "authhub-stable-1");
  assert.equal(user?.displayName, "张三");
  assert.equal(user?.department, "前端组");
  assert.deepEqual(user?.departmentIds, ["dept-fe", "dept-root", "dept-rd"]);
  assert.deepEqual(user?.departmentNames, ["前端组", "总公司", "研发部"]);
});

test("prefers base64 identity over forged single-field headers", () => {
  const user = parseGatewayUserFromHeaders({
    "x-user-base64": encodeIdentity({
      id: "authhub-stable-1",
      uid: "z100",
      display_name: "真实用户",
    }),
    "x-user-id": "attacker",
    "x-user-display-name": "伪造用户",
  });

  assert.equal(user?.id, "authhub-stable-1");
  assert.equal(user?.displayName, "真实用户");
});

test("parses percent encoded single-field fallback", () => {
  const user = parseGatewayUserFromHeaders({
    "x-user-header-encoding": "percent",
    "x-user-id": "stable-percent",
    "x-user-uid": "z200",
    "x-user-department": encodeURIComponent("咨询部"),
    "x-user-display-name": encodeURIComponent("李四"),
  });

  assert.equal(user?.id, "stable-percent");
  assert.equal(user?.uid, "z200");
  assert.equal(user?.department, "咨询部");
  assert.equal(user?.displayName, "李四");
});

test("rejects malformed base64 identity", () => {
  assert.throws(
    () => parseGatewayUserFromHeaders({ "x-user-base64": "not-json" }),
    GatewayIdentityError,
  );
});
