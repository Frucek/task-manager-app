const request = require('supertest');
const app = require('./server'); // Pazljivo: server.js izvozi app
const db = require('./db');

// Pred testi očisti bazo
beforeEach((done) => {
  db.run('DELETE FROM tasks', done);
});

describe('Task API', () => {
  test('GET /api/tasks returns empty array initially', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('POST /api/tasks creates a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test task', priority: 'high' });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Test task');
    expect(res.body.priority).toBe('high');
  });

  test('POST /api/tasks requires title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ priority: 'high' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Title is required');
  });

  test('GET /api/tasks returns created tasks', async () => {
    await request(app).post('/api/tasks').send({ title: 'Task1' });
    await request(app).post('/api/tasks').send({ title: 'Task2' });
    const res = await request(app).get('/api/tasks');
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(2);
  });

  test('PUT /api/tasks/:id toggles completed', async () => {
    const create = await request(app).post('/api/tasks').send({ title: 'Task' });
    const id = create.body.id;
    const res = await request(app).put(`/api/tasks/${id}`).send({ completed: true });
    expect(res.statusCode).toBe(200);
    expect(res.body.completed).toBe(true);
  });

  test('PUT /api/tasks/:id returns 404 if task not found', async () => {
    const res = await request(app).put('/api/tasks/9999').send({ completed: true });
    expect(res.statusCode).toBe(404);
  });

  test('DELETE /api/tasks/:id deletes a task', async () => {
    const create = await request(app).post('/api/tasks').send({ title: 'To delete' });
    const id = create.body.id;
    const del = await request(app).delete(`/api/tasks/${id}`);
    expect(del.statusCode).toBe(204);
    const get = await request(app).get('/api/tasks');
    expect(get.body.length).toBe(0);
  });

  test('DELETE /api/tasks/:id returns 404 if task not found', async () => {
    const res = await request(app).delete('/api/tasks/9999');
    expect(res.statusCode).toBe(404);
  });

  test('POST /api/tasks uses default priority medium', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'No priority' });
    expect(res.body.priority).toBe('medium');
  });

  test('GET /api/tasks returns tasks in descending order', async () => {
    await request(app).post('/api/tasks').send({ title: 'First' });
    await request(app).post('/api/tasks').send({ title: 'Second' });
    const res = await request(app).get('/api/tasks');
    expect(res.body[0].title).toBe('Second');
    expect(res.body[1].title).toBe('First');
  });
});