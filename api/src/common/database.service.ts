import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool, QueryResult } from "pg";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool!: Pool;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const connectionString = this.configService.get<string>("databaseUrl");
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }
    this.pool = new Pool({ connectionString });
  }

  async onModuleDestroy() {
    if (this.pool) {
      await this.pool.end();
    }
  }

  async query<T extends QueryResult>(text: string, params?: unknown[]): Promise<T> {
    return (await this.pool.query(text, params)) as T;
  }
}
