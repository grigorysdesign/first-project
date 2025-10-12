import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { promises as fs } from "fs";
import * as path from "path";
import * as request from "supertest";

import { AppModule } from "../src/app.module";

describe("AppController (e2e)", () => {
  let app: INestApplication;
  const tempProjectsRoot = path.join(__dirname, "..", "..", "tmp-projects");

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://app:app_password@localhost:5432/simplereplit";
    process.env.PROJECTS_ROOT = tempProjectsRoot;
    await fs.rm(tempProjectsRoot, { recursive: true, force: true });
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await fs.rm(tempProjectsRoot, { recursive: true, force: true });
  });

  it("creates project and stores files", async () => {
    const createResponse = await request(app.getHttpServer())
      .post("/api/projects")
      .send({ name: "Test project", stack: "python" })
      .expect(201);

    const projectId = createResponse.body.projectId;
    expect(projectId).toBeDefined();
    expect(createResponse.body.project).toMatchObject({ name: "Test project", stack: "python" });

    await request(app.getHttpServer())
      .post(`/api/projects/${projectId}/file`)
      .send({ path: "README.md", content: "Hello" })
      .expect(201);

    const filesResponse = await request(app.getHttpServer()).get(`/api/projects/${projectId}/files`).expect(200);
    expect(Array.isArray(filesResponse.body)).toBe(true);
    expect(filesResponse.body.some((file: { path: string }) => file.path === "README.md")).toBe(true);

    const readResponse = await request(app.getHttpServer())
      .get(`/api/projects/${projectId}/file`)
      .query({ path: "README.md" })
      .expect(200);
    expect(readResponse.body.content).toBe("Hello");

    await request(app.getHttpServer())
      .patch(`/api/projects/${projectId}`)
      .send({ name: "Renamed project" })
      .expect(200);

    const projectDir = path.join(tempProjectsRoot, projectId);
    const storedFile = await fs.readFile(path.join(projectDir, "README.md"), "utf8");
    expect(storedFile).toBe("Hello");

    await request(app.getHttpServer()).delete(`/api/projects/${projectId}`).expect(200);
    const existsAfterDelete = await fs
      .access(projectDir)
      .then(() => true)
      .catch(() => false);
    expect(existsAfterDelete).toBe(false);
  });
});
