import { listIpv4, ServiceInfoService } from './service-info.service';

describe('listIpv4', () => {
  it('keeps external IPv4 addresses and skips loopback and IPv6', () => {
    const addresses = listIpv4({
      lo: [{ address: '127.0.0.1', family: 'IPv4', internal: true }],
      eth0: [
        { address: '10.9.8.7', family: 'IPv4', internal: false },
        { address: 'fe80::1', family: 'IPv6', internal: false },
        { address: '10.9.8.8', family: 4, internal: false },
      ],
    });

    expect(addresses).toEqual(['10.9.8.7', '10.9.8.8']);
  });
});

describe('ServiceInfoService', () => {
  const service = new ServiceInfoService();
  const nets = {
    eth0: [{ address: '10.0.0.2', family: 'IPv4', internal: false }],
  };

  it('uses the detected address when no public IP is configured', () => {
    expect(service.getServiceInfo({}, nets)).toMatchObject({
      name: 'react-cicd-bg',
      ip: '10.0.0.2',
      addresses: ['10.0.0.2'],
      port: 4001,
    });
  });

  it('prefers SERVICE_PUBLIC_IP and still lists the detected address', () => {
    const info = service.getServiceInfo({ SERVICE_PUBLIC_IP: ' 18.60.99.194 ' }, nets);
    expect(info.ip).toBe('18.60.99.194');
    expect(info.addresses).toEqual(['18.60.99.194', '10.0.0.2']);
  });

  it('does not duplicate a public IP that is already detected', () => {
    const info = service.getServiceInfo({ SERVICE_PUBLIC_IP: '10.0.0.2' }, nets);
    expect(info.addresses).toEqual(['10.0.0.2']);
  });

  it('falls back to loopback when the host has no external IPv4', () => {
    expect(service.getServiceInfo({}, {}).ip).toBe('127.0.0.1');
    expect(service.getServiceInfo({}, {}).addresses).toEqual(['127.0.0.1']);
  });

  it('reads a valid port and ignores a bad one', () => {
    expect(service.getServiceInfo({ PORT: '4100' }, nets).port).toBe(4100);
    expect(service.getServiceInfo({ PORT: 'nope' }, nets).port).toBe(4001);
    expect(service.getServiceInfo({ PORT: '0' }, nets).port).toBe(4001);
  });

  it('includes the machine hostname', () => {
    expect(service.getServiceInfo({}, nets).hostname.length).toBeGreaterThan(0);
  });

  it('uses a looked-up public IP ahead of the private NIC address', async () => {
    const lookedUp = new ServiceInfoService();
    await lookedUp.refreshPublicIp({}, async () => '175.101.13.163');

    const info = lookedUp.getServiceInfo({}, nets);
    expect(info.ip).toBe('175.101.13.163');
    expect(info.addresses).toEqual(['175.101.13.163', '10.0.0.2']);
  });
});
