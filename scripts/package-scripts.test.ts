import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

type PackageJson = {
  scripts?: Record<string, string>;
};

const packageJson = JSON.parse(
  readFileSync(join(process.cwd(), "package.json"), "utf8"),
) as PackageJson;

function scriptRefreshesPrismaClient(scriptName: string): boolean {
  const scripts = packageJson.scripts ?? {};
  return /prisma generate/.test(scripts[`pre${scriptName}`] ?? "") ||
    /prisma generate/.test(scripts[scriptName] ?? "");
}

test("scheduler refreshes the ignored Prisma client before loading knowledge models", () => {
  assert.equal(scriptRefreshesPrismaClient("scheduler"), true);
});

test("bank sync scripts refresh the ignored Prisma client before loading latest schema models", () => {
  for (const scriptName of [
    "sync:banks",
    "sync:question-banks",
    "sync:questions-only",
    "sync:knowledge-banks",
  ]) {
    assert.equal(scriptRefreshesPrismaClient(scriptName), true, scriptName);
  }
});
