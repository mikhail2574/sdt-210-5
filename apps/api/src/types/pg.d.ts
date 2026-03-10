declare module "pg" {
  export class Client {
    constructor(config: {
      host?: string;
      port?: number;
      user?: string;
      password?: string;
      database?: string;
    });

    connect(): Promise<void>;
    end(): Promise<void>;
    query(queryText: string, values?: unknown[]): Promise<{ rowCount: number | null }>;
  }
}
