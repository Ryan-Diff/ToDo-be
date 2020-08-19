const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});

//GET
app.get('/api/todo', async(req, res) => {
  const data = await client.query(`SELECT * from todo
  WHERE todo.owner_id=${req.userId}`);

  res.json(data.rows);
});

//GET specific task
app.get('/api/todo/:id', async(req, res) => {
  const todoId = req.params.id;
  const userId = req.userId;
  const data = await client.query(`
    SELECT * from todo
    WHERE todo.id=$1 AND todo.owner_id=$2;
  `, [todoId, userId]);

  res.json(data.rows[0]);
});

//POST
app.post('/api/todo', async(req, res) => {
  try {
    const newTask = {
      task: req.body.todo,
      completed: req.body.completed,
    };
    
    const data = await client.query(`
    INSERT INTO todo(task, completed, owner_id)
    VALUES($1, $2, $3)
    RETURNING *
    `, [newTask.task, newTask.completed, req.userId]);

    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// delete todo
app.delete('/api/todo/:id', async(req, res) => {
  const todoId = req.params.id;
  const userId = req.userId;
  const data = await client.query(`
    DELETE from todo
    WHERE todo.id=$1 AND todo.owner_id=$2;
  `, [todoId, userId]);
  
  res.json(data.rows[0]);
});


//PUT
app.put('/api/todo/:id', async(req, res) => {
  const todoId = req.params.id;
  try {
    const updatedTodo = {
      task: req.body.task,
      completed: req.body.completed,
    };
  
    const data = await client.query(`
      UPDATE todo
        SET task=$1, completed=$2
        WHERE todo.id = $3 AND todo.owner_id = $4
        RETURNING *
  `, [updatedTodo.task, updatedTodo.completed, todoId, req.userId]); 
    
    res.json(data.rows[0]);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }});


app.use(require('./middleware/error'));

module.exports = app;
