import request from 'supertest';
import { describe, it, expect } from 'vitest';
import app from '../src/server.js';

describe('API Sanity', () => {
  it('GET /api/health returns success', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('success', true);
  });
});
