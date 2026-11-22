import { Test } from '@nestjs/testing';
import { clearCalls, recordCall } from '../common/call-log';
import { InfoResolver } from './info.resolver';
import { ServiceInfoService } from './service-info.service';
import { UsersService } from './users.service';

describe('InfoResolver', () => {
  const serviceInfo = {
    name: 'react-cicd-bg',
    ip: '10.8.0.4',
    addresses: ['10.8.0.4'],
    hostname: 'api-box',
    port: 4001,
  };
  let resolver: InfoResolver;

  beforeEach(async () => {
    clearCalls();
    const moduleRef = await Test.createTestingModule({
      providers: [
        InfoResolver,
        {
          provide: ServiceInfoService,
          useValue: { getServiceInfo: () => serviceInfo },
        },
        UsersService,
      ],
    }).compile();
    resolver = moduleRef.get(InfoResolver);
  });

  it('returns the service IP', () => {
    expect(resolver.service()).toEqual(serviceInfo);
  });

  it('returns temporary users and one user by id', () => {
    expect(resolver.users()).toHaveLength(3);
    expect(resolver.user('1')?.email).toBe('asha@example.com');
    expect(resolver.user('missing')).toBeNull();
  });

  it('returns calls that have already been logged', () => {
    recordCall({
      method: 'POST',
      path: '/graphql',
      ip: '127.0.0.1',
      operation: 'Dashboard',
      receivedAt: '2026-11-22T07:00:00.000Z',
    });

    expect(resolver.calls()[0]).toMatchObject({ operation: 'Dashboard', path: '/graphql' });
  });
});
