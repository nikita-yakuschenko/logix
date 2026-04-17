import { Module } from '@nestjs/common';
import { DadataService } from '../dadata/dadata.service';
import { AddressController } from './address.controller';

@Module({
  controllers: [AddressController],
  providers: [DadataService],
  exports: [DadataService],
})
export class AddressModule {}
