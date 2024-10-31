const request = require('supertest');
const express = require('express');
const app = require('../src/server/index.js'); 

let server;

beforeAll((done) => {
  server = app.listen(3001, done);
});

afterAll((done) => {
  server.close(done) 
});

describe('Weather API', () => {
  describe('POST /weather', () => {
    it('should return 400 for bad request (missing parameters)', async () => {
      const response = await request(app).post('/weather').send({});
      expect(response.status).toBe(400);
    });

    it('should return 200 and valid response for correct parameters', async () => {
      const response = await request(app).post('/weather').send({ city: 'Hanoi', diffDate: 2 });
      expect(response.status).toBe(200);
      expect(response.body).toBeInstanceOf(Object);
      expect(response.body.apiType).toBeDefined();
      // Add more assertions as necessary
    });
  });
});
