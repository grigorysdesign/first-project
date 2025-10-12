import * as path from "path";

export const configuration = () => ({
  env: process.env.APP_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
  redisUrl: process.env.REDIS_URL || "",
  s3: {
    endpoint: process.env.S3_ENDPOINT || "",
    accessKey: process.env.S3_ACCESS_KEY || "",
    secretKey: process.env.S3_SECRET_KEY || ""
  },
  ollamaUrl: process.env.OLLAMA_URL || "http://localhost:11434",
  runnerUrl: process.env.RUNNER_URL || "http://localhost:4000",
  projectsRoot:
    process.env.PROJECTS_ROOT ||
    path.resolve(process.cwd(), "..", "projects-data")
});
