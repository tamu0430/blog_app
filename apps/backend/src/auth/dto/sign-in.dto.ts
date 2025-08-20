import { IsNotEmpty } from 'class-validator';

// TODO: validation
export class SignInDto {
  username: string;

  @IsNotEmpty()
  password: string;
}
