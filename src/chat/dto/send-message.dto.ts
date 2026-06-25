import { IsString, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsString()
  content: string;

  // Target user ID — omit to send a support message to all admins
  @IsString()
  @IsOptional()
  receiverId?: string;
}
