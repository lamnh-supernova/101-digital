import { ApiProperty } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty() id: string;
  @ApiProperty() email: string;
  @ApiProperty() fullname: string;
}

export class LoginResponseDto {
  @ApiProperty() accessToken: string;
  @ApiProperty() expiresIn: number;
  @ApiProperty({ type: UserProfileDto }) user: UserProfileDto;
}
