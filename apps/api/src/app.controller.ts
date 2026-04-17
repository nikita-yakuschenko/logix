import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('health')
  async health(): Promise<{
    status: string;
    service: string;
    database: 'ok' | 'error';
  }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', service: 'logix-api', database: 'ok' };
    } catch {
      return { status: 'ok', service: 'logix-api', database: 'error' };
    }
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
