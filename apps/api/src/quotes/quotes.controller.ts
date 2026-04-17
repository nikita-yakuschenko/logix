import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QuotesService } from './quotes.service';

@Controller('quotes')
export class QuotesController {
  constructor(private readonly quotes: QuotesService) {}

  @Post('preview')
  preview(@Body() dto: CreateQuoteDto) {
    return this.quotes.preview(dto);
  }

  @Post()
  create(@Body() dto: CreateQuoteDto) {
    return this.quotes.create(dto);
  }

  @Get()
  list(@Query('take') take?: string) {
    const n = take ? parseInt(take, 10) : 30;
    return this.quotes.listRecent(Number.isFinite(n) ? n : 30);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.quotes.findById(id);
  }
}
