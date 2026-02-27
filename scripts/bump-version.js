#!/usr/bin/env node
import fs from "node:fs";

const type = process.argv[2];
if (!["major", "minor", "patch"].includes(type)) {
  console.error("Invalid release type. Use major | minor | patch");
  process.exit(1);
}

function bump(version, type) {
  let [major, minor, patch] = version.split(".").map(Number);

  if (type === "major") return `${major + 1}.0.0`;
  if (type === "minor") return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function updateFile(file, newVersion) {
  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  data.version = newVersion;
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
const newVersion = bump(pkg.version, type);

updateFile("package.json", newVersion);
updateFile("manifest.json", newVersion);

console.log(`Version bumped to ${newVersion}`);
