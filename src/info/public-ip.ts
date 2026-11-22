const PUBLIC_IP_URLS = ['https://api.ipify.org', 'https://checkip.amazonaws.com'];

export function isPublicIpv4(value: string): boolean {
  if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(value)) {
    return false;
  }
  const parts = value.split('.').map((part) => Number(part));
  if (parts.some((part) => part > 255)) {
    return false;
  }
  const [first, second] = parts;
  if (first === 0 || first === 10 || first === 127) {
    return false;
  }
  if (first === 192 && second === 168) {
    return false;
  }
  if (first === 172 && second >= 16 && second <= 31) {
    return false;
  }
  if (first === 169 && second === 254) {
    return false;
  }
  return true;
}

export async function lookupPublicIpv4(
  fetchImpl: typeof fetch = globalThis.fetch,
): Promise<string | null> {
  for (const url of PUBLIC_IP_URLS) {
    try {
      const response = await fetchImpl(url, { signal: AbortSignal.timeout(2500) });
      if (!response.ok) {
        continue;
      }
      const text = (await response.text()).trim().replace(/^"|"$/g, '');
      if (isPublicIpv4(text)) {
        return text;
      }
    } catch {
      continue;
    }
  }
  return null;
}
