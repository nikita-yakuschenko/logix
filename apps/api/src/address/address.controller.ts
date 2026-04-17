import { Body, Controller, Post } from '@nestjs/common';
import { DadataService } from '../dadata/dadata.service';
import { SuggestAddressDto } from './dto/suggest-address.dto';

@Controller('address')
export class AddressController {
  constructor(private readonly dadata: DadataService) {}

  @Post('suggest')
  async suggest(@Body() dto: SuggestAddressDto) {
    return this.dadata.suggestAddress(dto.query);
  }
}
