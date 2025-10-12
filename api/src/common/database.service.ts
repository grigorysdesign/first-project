import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool, QueryResult } from "pg";
import { newDb } from "pg-mem";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool!: Pool;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const connectionString = this.configService.get<string>("databaseUrl");
    if (connectionString) {
      this.pool = new Pool({ connectionString });
      try {
        await this.pool.query("SELECT 1");
        this.logger.log("Connected to PostgreSQL database");
        return;
      } catch (error) {
        this.logger.warn(`Failed to connect to PostgreSQL at ${connectionString}: ${String(error)}`);
        await this.pool.end().catch(() => undefined);
      }
    }
    await this.bootstrapInMemoryDatabase();
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  async query<T extends QueryResult>(text: string, params?: unknown[]): Promise<T> {
    return (await this.pool.query(text, params)) as T;
  }

  private async bootstrapInMemoryDatabase() {
    const db = newDb({ autoCreateForeignKeyIndices: true });
    db.public.registerFunction({
      name: "now",
      returns: "timestamp",
      implementation: () => new Date()
    });

    db.public.none(`
      CREATE TABLE users (
        id UUID PRIMARY KEY,
        email TEXT UNIQUE,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE projects (
        id UUID PRIMARY KEY,
        owner_id UUID REFERENCES users(id),
        name TEXT NOT NULL,
        stack TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      );

      CREATE TABLE files (
        id UUID PRIMARY KEY,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        path TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        UNIQUE (project_id, path)
      );

      CREATE TABLE runs (
        id UUID PRIMARY KEY,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        status TEXT NOT NULL,
        port INT,
        logs TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        finished_at TIMESTAMPTZ
      );

      CREATE TABLE deployments (
        id UUID PRIMARY KEY,
        project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
        url TEXT,
        status TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    const adapter = db.adapters.createPg();
    this.pool = new adapter.Pool() as unknown as Pool;
    this.logger.warn("Falling back to in-memory database (pg-mem). Data will not persist.");
  }
}
