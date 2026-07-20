// apps/backend/src/users/dto/update-otp-channel.dto.ts
import { IsEnum, IsNotEmpty } from 'class-validator';
import { OtpChannel } from '@prisma/client';

export class UpdateOtpChannelDto {
  @IsEnum(OtpChannel, {
    message: 'قناة OTP غير صحيحة. القنوات المدعومة: EMAIL أو TELEGRAM',
  })
  @IsNotEmpty({ message: 'قناة OTP مطلوبة' })
  channel!: OtpChannel;
}
