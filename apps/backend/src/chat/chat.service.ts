// apps/backend/src/chat/chat.service.ts

import { Injectable } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { MessageService } from './message.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly conversationService: ConversationService,
    private readonly messageService: MessageService,
  ) {}
}
