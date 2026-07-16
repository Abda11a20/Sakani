import { IsNotEmpty, IsString } from 'class-validator';

export class GenerateLinkCodeDto {
  @IsNotEmpty({ message: 'البريد الإلكتروني أو رقم الهاتف مطلوب لربط الحساب' })
  @IsString()
  identifier: string;
}
