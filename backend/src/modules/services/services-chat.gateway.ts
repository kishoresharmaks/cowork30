import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ServicesChatGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('join_inquiry_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { inquiryId: number },
  ) {
    if (data && data.inquiryId) {
      const room = `inquiry_${data.inquiryId}`;
      client.join(room);
      return { event: 'joined_room', room };
    }
    return { event: 'error', message: 'Invalid inquiryId' };
  }

  @SubscribeMessage('leave_inquiry_room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { inquiryId: number },
  ) {
    if (data && data.inquiryId) {
      const room = `inquiry_${data.inquiryId}`;
      client.leave(room);
      return { event: 'left_room', room };
    }
    return { event: 'error', message: 'Invalid inquiryId' };
  }

  notifyNewMessage(inquiryId: number, message: any) {
    const room = `inquiry_${inquiryId}`;
    this.server.to(room).emit('new_inquiry_message', message);
    this.server.emit('global_inquiry_notification', { inquiryId, message });
  }

  notifyInquiryUpdate(inquiryId: number, updateType: string, inquiryData: any) {
    const room = `inquiry_${inquiryId}`;
    this.server.to(room).emit('inquiry_status_updated', {
      inquiryId,
      updateType,
      inquiry: inquiryData,
    });
    this.server.emit('global_inquiry_update', { inquiryId, updateType, inquiry: inquiryData });
  }
}
