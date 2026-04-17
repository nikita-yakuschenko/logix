import { Module } from '@nestjs/common';
import { DepotController } from './depot.controller';

@Module({
  controllers: [DepotController],
})
export class DepotModule {}
