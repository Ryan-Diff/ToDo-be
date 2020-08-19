require('dotenv').config();

const { execSync } = require('child_process');

const fakeRequest = require('supertest');
const app = require('../lib/app');
const client = require('../lib/client');

describe('routes', () => {
  let token;
  const newTodo = {
    id: 4,
    task: 'Work on tests',
    completed: false,
    owner_id: 2,
  };

  beforeAll(async done => {
    execSync('npm run setup-db');
    client.connect();
    const signInData = await fakeRequest(app)
      .post('/auth/signup')
      .send({
        email: 'jon@user.com',
        password: '1234'
      });
    token = signInData.body.token;
    return done();
  });

  afterAll(done => {
    return client.end(done);
  });

  test('returns a new todo when creating new todo', async(done) => {
    const data = await fakeRequest(app)
      .post('/api/todo')
      .send(newTodo)
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);
    expect(data.body).toEqual(newTodo);
    done();
  });

  test('returns all todo items that belong to the user when hitting GET /api/todo', async(done) => {

    const expectation = [
      {
        id: 4,
        task: 'Work on tests',
        completed: false,
        owner_id: 2,
      },
      
    ];

    const data = await fakeRequest(app)
      .get('/api/todo')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(data.body).toEqual(expectation);
    done();
  });

  test('returns the matching todo item when hitting GET /api/todo/:id', async(done) => {

    const expectation = 
      {
        id: 4,
        task: 'Work on tests',
        completed: false,
        owner_id: 2,
      };

    const data = await fakeRequest(app)
      .get('/api/todo/4')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(data.body).toEqual(expectation);
    done();
  });

  test('returns nothing when hitting GET /api/todo/:id with an id that doesn\'t belong to the user', async(done) => {

    const expectation = '';

    const data = await fakeRequest(app)
      .get('/api/todo/3')
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(data.body).toEqual(expectation);
    done();
  });

  test('returns an error when trying to get without an authorization key', async(done) => {

    const expectation = 
      { 'error': 'no authorization found' };

    const data = await fakeRequest(app)
      .get('/api/todo')
      .expect('Content-Type', /json/)
      .expect(401);

    expect(data.body).toEqual(expectation);
    done();
  });

  test('returns an error when trying to post without an authorization key', async(done) => {

    const expectation = 
      { 'error': 'no authorization found' };

    const data = await fakeRequest(app)
      .post('/api/todo')
      .send(newTodo)
      .expect('Content-Type', /json/)
      .expect(401);

    expect(data.body).toEqual(expectation);
    done();
  });
  test('returns the new todo item when hitting PUT /api/todo/:id with updated info', async(done) => {

    const expectation = 
      {
        id: 4,
        task: 'Made tests work',
        completed: true,
        owner_id: 2,
      };
    
    const updatedTodo =  {
      id: 4,
      task: 'Made tests work',
      completed: true,
      owner_id: 2,
    };

    const data = await fakeRequest(app)
      .put('/api/todo/4')
      .send(updatedTodo)
      .set('Authorization', token)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(data.body).toEqual(expectation);
    done();
  });

  // test('returns nothing when trying to get after delete', async(done) => {

  //   const expectation = '';
    

  //   await fakeRequest(app)
  //     .delete('/api/todo/4')
  //     .set('Authorization', token)
  //     .expect('Content-Type', /json/)
  //     .expect(200);
  //   const data = await fakeRequest(app)
  //     .get('/api/todo/4')
  //     .set('Authorization', token)
  //     .expect('Content-Type', /json/)
  //     .expect(200);

  //   expect(data.body).toEqual(expectation);
  //   done();
  // });

});
