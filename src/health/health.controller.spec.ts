import { HealthController } from './health.controller';
import { ServiceInfoService } from '../info/service-info.service';

describe('HealthController', () => {
  it('reports that the service is up and includes its IP', () => {
    const controller = new HealthController({
      getServiceInfo: () => ({
        name: 'react-cicd-bg',
        ip: '10.0.0.8',
        addresses: ['10.0.0.8'],
        hostname: 'api-box',
        port: 4001,
      }),
    } as ServiceInfoService);

    const body = controller.check();

    expect(body.ok).toBe(true);
    expect(body.service).toBe('react-cicd-bg');
    expect(body.ip).toBe('10.0.0.8');
    expect(body.hostname).toBe('api-box');
    expect(typeof body.uptime).toBe('number');
    expect(body.timestamp).toEqual(expect.any(String));
  });
});
