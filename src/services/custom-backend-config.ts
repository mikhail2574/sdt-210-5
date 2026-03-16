import path from "node:path";

export function getPersistentDemoDataFilePath() {
  return process.env.DEMO_DATA_FILE_PATH ?? path.join(process.cwd(), ".data", "week-06-demo-backend.json");
}
