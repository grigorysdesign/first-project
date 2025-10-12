import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import * as request from "supertest";

import { AppModule } from "../src/app.module";

describe("AppController (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://app:app_password@localhost:5432/simplereplit";
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("creates project and stores files", async () => {
    const createResponse = await request(app.getHttpServer())
      .post("/api/projects")
      .send({ name: "Test project", stack: "python" })
      .expect(201);

    const projectId = createResponse.body.projectId;
    expect(projectId).toBeDefined();

    await request(app.getHttpServer())
      .post(`/api/projects/${projectId}/file`)
      .send({ path: "README.md", content: "Hello" })
      .expect(201);

    const filesResponse = await request(app.getHttpServer()).get(`/api/projects/${projectId}/files`).expect(200);
    expect(Array.isArray(filesResponse.body)).toBe(true);
  });
});
