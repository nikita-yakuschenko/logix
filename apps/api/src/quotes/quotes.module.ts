import { Module } from '@nestjs/common';
import { GeocodingService } from '../geocoding/geocoding.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ROUTING_PROVIDER } from '../routing/routing.types';
import { StubRoutingService } from '../routing/stub-routing.service';
import { VehicleTypesController } from '../vehicle-types/vehicle-types.controller';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';

@Module({
  imports: [PrismaModule],
  controllers: [QuotesController, VehicleTypesController],
  providers: [
    GeocodingService,
    QuotesService,
    StubRoutingService,
    { provide: ROUTING_PROVIDER, useExisting: StubRoutingService },
  ],
})
export class QuotesModule {}
