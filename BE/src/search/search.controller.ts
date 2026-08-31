import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SearchService } from './search.service';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';

@Controller('search')
@ApiTags('Search')
@ApiCookieAuth('access_token')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(@Query('q') query: string, @Req() req: any) {
    return this.searchService.search(query, req.user.userId);
  }
}
