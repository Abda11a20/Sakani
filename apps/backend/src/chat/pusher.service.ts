// apps/backend/src/chat/pusher.service.ts

import { Injectable } from '@nestjs/common';
import Pusher from 'pusher';

@Injectable()
export class PusherService {
  private pusher: Pusher;

  constructor() {
    this.pusher = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    });
  }

  async broadcastToConversation(conversationId: string, event: string, data: any) {
    const channelName = `private-conversation-${conversationId}`;
    return this.pusher.trigger(channelName, event, data);
  }

  authorizeChannel(socketId: string, channelName: string) {
    return this.pusher.authorizeChannel(socketId, channelName);
  }
}
