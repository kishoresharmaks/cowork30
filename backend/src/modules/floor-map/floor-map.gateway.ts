import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { corsOriginDelegate } from '../../shared/utils/cors.util';

@WebSocketGateway({
  cors: {
    origin: corsOriginDelegate,
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
