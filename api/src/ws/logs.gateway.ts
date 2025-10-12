import { Logger } from "@nestjs/common";
import { OnGatewayConnection, OnGatewayInit, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

@WebSocketGateway({ cors: { origin: "*" } })
export class LogsGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(LogsGateway.name);

  @WebSocketServer()
  server!: Server;

  afterInit() {
    this.logger.log("WebSocket gateway initialized");
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  emitLog(projectId: string, message: string) {
    this.server.emit(`logs:${projectId}`, { message, timestamp: new Date().toISOString() });
  }
}
