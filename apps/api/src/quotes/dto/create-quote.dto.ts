import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class QuoteLineDto {
  @IsString()
  vehicleTypeId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CreateQuoteDto {
  /** Человекочитаемый адрес (населённый пункт, область и т.д.) — сервер сам получит координаты. */
  @IsOptional()
  @IsString()
  destinationAddress?: string;

  /** Координаты из подсказки Dadata (КЛАДР/ФИАС) — тогда сервер не дергает Nominatim. */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  destinationLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  destinationLng?: number;

  /** Номер договора / объект — на карте над адресом назначения. */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  contractReference?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuoteLineDto)
  lines!: QuoteLineDto[];

  /** Имя пользователя в интерфейсе (локально), кто выполнил расчёт. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  createdBy?: string;
}
