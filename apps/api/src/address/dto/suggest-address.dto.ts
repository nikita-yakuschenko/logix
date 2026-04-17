import { IsString, MaxLength, MinLength } from 'class-validator';

export class SuggestAddressDto {
  @IsString()
  @MinLength(2)
  @MaxLength(400)
  query!: string;
}
