#!/usr/bin/env node
/*
 * PostToolUse hook (matcher: Bash).
 * Cuando una llamada a Bash ejecuta `openspec validate <cambio>` y la
 * validación es correcta, commitea automáticamente los artefactos de ese
 * cambio (proposal.md, specs/, design.md, tasks.md, .openspec.yaml) con un
 * mensaje generado a partir de la sección "Why" del proposal.
 *
 * Silencioso (exit 0, sin salida) ante cualquier caso que no aplique o
 * cualquier error: nunca debe bloquear el flujo normal de Claude Code.
 */

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function extractChangeName(command) {
  const marker = "openspec validate";
  const idx = command.indexOf(marker);
  if (idx === -1) return null;
  let rest = command.slice(idx + marker.length);
  const stop = rest.match(/(&&|\|\||[;|])/);
  if (stop) rest = rest.slice(0, stop.index);
  const tokens = rest.trim().split(/\s+/).filter(Boolean);
  if (tokens.some((t) => t === "--all" || t === "--changes" || t === "--specs")) {
    return null;
  }
  const nameToken = tokens.find((t) => !t.startsWith("-"));
  if (!nameToken) return null;
  return nameToken.replace(/^["']|["']$/g, "");
}

function looksValid(toolResponse) {
  try {
    const text = JSON.stringify(toolResponse ?? "");
    return /is valid/i.test(text);
  } catch {
    return false;
  }
}

function extractWhy(proposalText) {
  const lines = proposalText.split(/\r?\n/);
  let capturing = false;
  const collected = [];
  for (const line of lines) {
    if (/^##\s+Why\s*$/.test(line.trim())) {
      capturing = true;
      continue;
    }
    if (capturing && /^##\s+/.test(line.trim())) break;
    if (capturing) collected.push(line);
  }
  return collected.join(" ").replace(/\s+/g, " ").trim();
}

function main() {
  const raw = readStdin();
  if (!raw) return;

  let input;
  try {
    input = JSON.parse(raw);
  } catch {
    return;
  }

  const command = input?.tool_input?.command;
  if (typeof command !== "string") return;

  const changeName = extractChangeName(command);
  if (!changeName) return;

  if (!looksValid(input.tool_response)) return;

  let repoRoot;
  try {
    repoRoot = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return;
  }

  const relChangeDir = path.posix.join("openspec", "changes", changeName);
  const absChangeDir = path.join(repoRoot, "openspec", "changes", changeName);
  if (!fs.existsSync(absChangeDir)) return;

  const candidateRelPaths = [
    path.posix.join(relChangeDir, "proposal.md"),
    path.posix.join(relChangeDir, "specs"),
    path.posix.join(relChangeDir, "design.md"),
    path.posix.join(relChangeDir, "tasks.md"),
    path.posix.join(relChangeDir, ".openspec.yaml"),
  ].filter((relPath) => fs.existsSync(path.join(repoRoot, relPath)));

  if (candidateRelPaths.length === 0) return;

  let statusOut;
  try {
    statusOut = execFileSync(
      "git",
      ["status", "--porcelain", "--", ...candidateRelPaths],
      { cwd: repoRoot, encoding: "utf8" }
    );
  } catch {
    return;
  }
  if (!statusOut.trim()) return; // nada nuevo que commitear

  let resumen = "";
  const proposalPath = path.join(repoRoot, relChangeDir, "proposal.md");
  if (fs.existsSync(proposalPath)) {
    try {
      resumen = extractWhy(fs.readFileSync(proposalPath, "utf8"));
    } catch {
      resumen = "";
    }
  }
  if (!resumen) resumen = "Nueva propuesta de cambio generada con OpenSpec.";
  if (resumen.length > 400) resumen = resumen.slice(0, 397) + "...";

  try {
    execFileSync("git", ["add", "--", ...candidateRelPaths], {
      cwd: repoRoot,
    });
  } catch {
    return;
  }

  let staged;
  try {
    execFileSync("git", ["diff", "--cached", "--quiet", "--", ...candidateRelPaths], {
      cwd: repoRoot,
    });
    staged = false; // exit 0 => no diff staged
  } catch {
    staged = true; // exit != 0 => hay diferencias staged
  }
  if (!staged) return;

  const commitMessage = `openspec: propuesta "${changeName}"\n\n${resumen}\n\nOpenSpec-Autocommit: openspec validate`;

  try {
    execFileSync(
      "git",
      ["commit", "-m", commitMessage, "--", ...candidateRelPaths],
      { cwd: repoRoot }
    );
  } catch {
    return;
  }

  let sha = "";
  try {
    sha = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: repoRoot,
      encoding: "utf8",
    }).trim();
  } catch {
    sha = "";
  }

  const msg = `Auto-commit de OpenSpec: cambio "${changeName}" validado y commiteado${
    sha ? " (" + sha + ")" : ""
  }.`;
  process.stdout.write(JSON.stringify({ systemMessage: msg }) + "\n");
}

try {
  main();
} catch {
  // Nunca bloquear el flujo por un fallo del hook.
}
