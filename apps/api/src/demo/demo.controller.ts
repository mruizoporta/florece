import { Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public, SkipTenant } from '../common/decorators/public.decorator';
import { DemoService } from './demo.service';

@ApiTags('demo')
@Controller('demo')
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Public()
  @SkipTenant()
  @Post('seed')
  seed() {
    return this.demoService.seed();
  }
}
