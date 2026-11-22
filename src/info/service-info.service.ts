import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { hostname, networkInterfaces } from 'os';
import { ServiceInfo } from './models/service-info.model';
import { isPublicIpv4, lookupPublicIpv4 } from './public-ip';

const SERVICE_NAME = 'react-cicd-bg';
const DEFAULT_PORT = 4001;

interface AddressEntry {
  address: string;
  family: string | number;
  internal: boolean;
}

export function listIpv4(
  nets: Record<string, AddressEntry[] | undefined> = networkInterfaces() as Record<
    string,
    AddressEntry[] | undefined
  >,
): string[] {
  const addresses: string[] = [];
  for (const entries of Object.values(nets)) {
    for (const entry of entries ?? []) {
      const family = String(entry.family);
      if ((family === 'IPv4' || family === '4') && !entry.internal && entry.address) {
        addresses.push(entry.address);
      }
    }
  }
  return addresses;
}

@Injectable()
export class ServiceInfoService implements OnModuleInit {
  private readonly logger = new Logger(ServiceInfoService.name);
  private publicIp: string | null = null;

  async onModuleInit(): Promise<void> {
    if (process.env.NODE_ENV === 'test') {
      const configured = process.env.SERVICE_PUBLIC_IP?.trim();
      this.publicIp = configured && isPublicIpv4(configured) ? configured : null;
      return;
    }
    await this.refreshPublicIp();
  }

  async refreshPublicIp(
    env: NodeJS.ProcessEnv = process.env,
    lookup: () => Promise<string | null> = lookupPublicIpv4,
  ): Promise<string | null> {
    const configured = env.SERVICE_PUBLIC_IP?.trim();
    if (configured && isPublicIpv4(configured)) {
      this.publicIp = configured;
      return this.publicIp;
    }
    try {
      this.publicIp = await lookup();
    } catch (error) {
      this.publicIp = null;
      this.logger.warn(`Public IP lookup failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
    if (this.publicIp) {
      this.logger.log(`Public IP is ${this.publicIp}`);
    }
    return this.publicIp;
  }

  getServiceInfo(
    env: NodeJS.ProcessEnv = process.env,
    nets?: Record<string, AddressEntry[] | undefined>,
  ): ServiceInfo {
    const detected = listIpv4(nets);
    const configured = env.SERVICE_PUBLIC_IP?.trim();
    const configuredPublic = configured && isPublicIpv4(configured) ? configured : undefined;
    const ip = configuredPublic || this.publicIp || detected.find(isPublicIpv4) || configured || detected[0] || '127.0.0.1';
    const addresses = uniqueAddresses(ip, detected);
    const portValue = Number(env.PORT ?? DEFAULT_PORT);
    return {
      name: SERVICE_NAME,
      ip,
      addresses,
      hostname: hostname(),
      port: Number.isFinite(portValue) && portValue > 0 ? portValue : DEFAULT_PORT,
    };
  }
}

function uniqueAddresses(configured: string | undefined, detected: string[]): string[] {
  const addresses = configured ? [configured, ...detected] : [...detected];
  const unique = addresses.filter((address, index) => addresses.indexOf(address) === index);
  return unique.length > 0 ? unique : ['127.0.0.1'];
}
