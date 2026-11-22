import { isPublicIpv4, lookupPublicIpv4 } from './public-ip';

describe('isPublicIpv4', () => {
  it('accepts a public address', () => {
    expect(isPublicIpv4('175.101.13.163')).toBe(true);
    expect(isPublicIpv4('18.60.99.194')).toBe(true);
  });

  it('rejects loopback and private ranges', () => {
    expect(isPublicIpv4('127.0.0.1')).toBe(false);
    expect(isPublicIpv4('10.0.0.2')).toBe(false);
    expect(isPublicIpv4('192.168.1.44')).toBe(false);
    expect(isPublicIpv4('172.16.0.4')).toBe(false);
    expect(isPublicIpv4('localhost')).toBe(false);
  });
});

describe('lookupPublicIpv4', () => {
  it('returns the first public address', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => '175.101.13.163\n',
    });

    await expect(lookupPublicIpv4(fetchImpl as unknown as typeof fetch)).resolves.toBe('175.101.13.163');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('tries the next service when the first answer is private or fails', async () => {
    const fetchImpl = jest
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ ok: true, text: async () => '8.8.8.8' });

    await expect(lookupPublicIpv4(fetchImpl as unknown as typeof fetch)).resolves.toBe('8.8.8.8');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('returns null when every lookup fails', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, text: async () => '' });
    await expect(lookupPublicIpv4(fetchImpl as unknown as typeof fetch)).resolves.toBeNull();
  });
});
