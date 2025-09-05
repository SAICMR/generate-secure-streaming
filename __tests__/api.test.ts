import request from 'supertest';
import { app } from '../src/setup/app';

describe('API smoke', () => {
  let token = '';
  let mediaId = '';

  it('signup + login', async () => {
    const signup = await request(app).post('/auth/signup').send({ email: 't@e.co', password: 'pass' });
    expect([201, 409]).toContain(signup.status);
    const res = await request(app).post('/auth/login').send({ email: 't@e.co', password: 'pass' }).expect(200);
    token = res.body.token;
    expect(token).toBeTruthy();
  });

  it('resume upload accepts file-less request gracefully', async () => {
    await request(app).post('/resume/upload').expect(201);
  });

  it('media endpoints require auth', async () => {
    await request(app).post('/media').expect(401);
  });
});

