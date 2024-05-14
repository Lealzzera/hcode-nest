import { IsJWT, IsString, IsStrongPassword } from 'class-validator';

export class AuthResetDTO {
  @IsString()
  @IsStrongPassword({
    minLength: 8,
  })
  password: string;

  @IsJWT()
  token: string;
}
