import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { clearCalls } from '../src/common/call-log';
import { configureApp } from '../src/configure-app';

describe('API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  beforeEach(() => {
    clearCalls();
  });

  afterAll(async () => {
    await app.close();
  });

  const graphql = (query: string, operationName?: string) =>
    request(app.getHttpServer())
      .post('/graphql')
      .send({ query, operationName });

  it('GET /health returns ok and the service IP', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.service).toBe('react-cicd-bg');
    expect(response.body.ip).toEqual(expect.any(String));
    expect(response.body.ip.length).toBeGreaterThan(0);
  });

  it('graphql returns the service IP and temporary users', async () => {
    const response = await graphql(
      '{ service { name ip hostname port } users { id name email role city temporary } }',
    ).expect(200);

    expect(response.body.data.service.name).toBe('react-cicd-bg');
    expect(response.body.data.service.ip).toEqual(expect.any(String));
    expect(response.body.data.service.port).toBe(Number(process.env.PORT ?? 4001));
    expect(response.body.data.users).toHaveLength(3);
    expect(response.body.data.users[0]).toMatchObject({
      name: 'Asha Rao',
      temporary: true,
    });
  });

  it('graphql user(id) returns one user or null', async () => {
    const found = await graphql('{ user(id: "2") { name city } }').expect(200);
    expect(found.body.data.user).toEqual({ name: 'Ravi Kumar', city: 'Bengaluru' });

    const missing = await graphql('{ user(id: "999") { name } }').expect(200);
    expect(missing.body.data.user).toBeNull();
  });

  it('graphql rejects an unknown field', async () => {
    const response = await graphql('{ users { nope } }');
    expect([200, 400]).toContain(response.status);
    expect(response.body.errors.length).toBeGreaterThan(0);
  });

  it('logs the call and exposes it from graphql', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);
    const response = await graphql('query Dashboard { calls { method path operation } }', 'Dashboard').expect(200);

    const calls = response.body.data.calls as Array<{ method: string; path: string; operation: string | null }>;
    expect(calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ method: 'GET', path: '/health' }),
        expect.objectContaining({ method: 'POST', path: '/graphql', operation: 'Dashboard' }),
      ]),
    );
  });
});
