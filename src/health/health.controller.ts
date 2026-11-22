import { Controller, Get } from '@nestjs/common';
import { ServiceInfoService } from '../info/service-info.service';

@Controller()
export class HealthController {
  constructor(private readonly serviceInfo: ServiceInfoService) {}

  @Get('health')
  check() {
    const info = this.serviceInfo.getServiceInfo();
    return {
      ok: true,
      service: info.name,
      ip: info.ip,
      hostname: info.hostname,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
