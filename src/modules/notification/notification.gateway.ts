import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
// import { JwtService } from "@nestjs/jwt";
import { JwtService } from "../jwt/jwt.service";
import { Server, Socket } from "socket.io";
import { OnlineUserService } from "./online-user.service";

@WebSocketGateway({
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly onlineUserService: OnlineUserService,
  ) { }

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      const token = client.handshake.auth?.token;

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAccessToken(token);
      const userId = payload.id; // or payload.id
      client.data.userId = userId;
      client.join(`user-${userId}`);
      this.onlineUserService.add(userId, client.id);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    const userId = client.data.userId as number;
    this.onlineUserService.remove(userId, client.id);
  }

  notifyUser(userId: number, payload: any) {
    this.server.to(`user-${userId}`).emit("notification:new", payload);
  }

  notifyUsers(userIds: number[], payload: any) {
    userIds.forEach((id) => {
      this.server.to(`user-${id}`).emit("notification:new", payload);
    });
  }

  broadcast(payload: any) {
    this.server.emit("notification:broadcast", payload);
  }
}