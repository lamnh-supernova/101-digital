import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'reviewer@simpleinvoice.test' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  email: string;

  @ApiProperty({ example: 'ReviewerPass123!' })
  @IsString()
  @MinLength(1, { message: 'password should not be empty' })
  password: string;
}
