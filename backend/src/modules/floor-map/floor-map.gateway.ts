import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';

const WS_ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://localhost:4000',
  ...(process.env.NODE_ENV === 'production' ? [] : ['http://localhost:3000']),
].filter(Boolean);

@WebSocketGateway({
  cors: {
    origin: WS_ALLOWED_ORIGINS,
    credentials: true,
  },
})
export class FloorMapGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('subscribe_floor_updates')
  handleSubscribe(@MessageBody() data: { branchId: number }) {
    return { event: 'subscribed', branchId: data.branchId };
  }

  notifyDeskStatusChange(deskId: number, status: string) {
    this.server.emit('desk_status_changed', { deskId, status });
  }
}
