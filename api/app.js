const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { mongoose } = require('./db/mongoose'); // Import the mongoose connection
const { List } = require('./db/models/list.model'); // Import the List model
const { Task } = require('./db/models/task.model'); // Import the Task model
const { User } = require('./db/models/user.model'); // Import the User model


const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:4200' 
}));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "GET,POST,OPTIONS,PUT,PATCH,DELETE");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Verify Refresh Token Middleware (verifythe session)
let verifySession = (req, res, next) => {
  // grab the refresh token and _id from the request header
  let refreshToken = req.header('x-refresh-token');
  let _id = req.header('_id');

  User.findByIdAndToken(_id, refreshToken).then((user) => {
      if (!user) {
          // user not found
          return Promise.reject({
              'error': 'User not found. Make sure that the refresh token and user id are correct'
          });
      }
      //user found
      req.user_id = user._id;
      req.userObject = user;
      req.refreshToken = refreshToken;

      let isSessionValid = false;
      user.sessions.forEach((session) => {
          if (session.token === refreshToken) {
              // check if the session has expired
              if (User.hasRefreshTokenExpired(session.expiresAt) === false) {
                  // refresh token has not expired
                  isSessionValid = true;
              }
          }
      });
      if (isSessionValid) {
          //continue with processing this web request
          next();
      } else {
          return Promise.reject({
              'error': 'Refresh token has expired or the session is invalid'
          })
      }

  }).catch((e) => {
      res.status(401).send(e);
  })
}


app.get('/lists', async (req, res) => {
  try {
    const lists = await List.find({});
    res.status(200).send(lists);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.post('/lists', async (req, res) => {
  try {
    const newList = new List(req.body);
    const savedList = await newList.save();
    res.status(201).send(savedList);
  } catch (error) {
    res.status(400).send(error);
  }
});

app.patch('/lists/:id',(req,res)=>{
    //update the specified list
    List.findOneAndUpdate({_id:req.params.id},{
        $set:req.body
    }).then(()=>{
        res.sendStatus(200);//ok message
    });
});

app.delete('/lists/:id',(req,res)=>{
    //delete the specified list
    List.findOneAndRemove({
        _id:req.params.id
    }).then((removedListDoc)=>{
        res.send(removedListDoc);
    });
});


app.get('/lists/:listId/tasks', (req, res) => {
  Task.find({ _listId: req.params.listId }).then((tasks) => {
    res.send(tasks);
  }).catch((error) => {
    res.status(500).send(error);
  });
});

app.post('/lists/:listId/tasks', (req, res) => {
  console.log('Creating task for list:', req.params.listId);
  console.log('Task title:', req.body.title);

  let newTask = new Task({
      title: req.body.title,
      _listId: req.params.listId
  });
  newTask.save().then((newTaskDoc) => {
      res.send(newTaskDoc);
  }).catch((e) => {
      res.status(400).send(e);
  });
});

app.patch('/lists/:listId/tasks/:taskId',(req,res)=>{
    //update the specified list
    Task.findOneAndUpdate({
        _id:req.params.taskId,
        _listId:req.params.listId
    },{
        $set:req.body
    }).then(()=>{
        res.send({message:'updated successfully'});//ok message
    });
});

app.delete('/lists/:listId/tasks/:taskId',(req,res)=>{
    //delete the specified list
    Task.findOneAndRemove({
        _id:req.params.taskId,
        _listId:req.params.listId
    }).then((removedTaskDoc)=>{
        res.send(removedTaskDoc);
    });
});


//USER ROUTES

app.post('/users', (req, res) => {
  // User sign up
  let body = req.body;
  let newUser = new User(body);

  newUser.save().then(() => {
      return newUser.createSession();
  }).then((refreshToken) => {
      // Session created successfully - refreshToken returned.
      //geneate an access auth token for the user

      return newUser.generateAccessAuthToken().then((accessToken) => {
          // access auth token generated successfully, now we return an object containing the auth tokens
          return { accessToken, refreshToken }
      });
  }).then((authTokens) => {
      // construct and send the response to the user with their auth tokens in the header and the user object in the body
      res
          .header('x-refresh-token', authTokens.refreshToken)
          .header('x-access-token', authTokens.accessToken)
          .send(newUser);
  }).catch((e) => {
      res.status(400).send(e);
  })
});

app.post('/users/login', (req, res) => {
  // User log in
  let email = req.body.email;
  let password = req.body.password;

  User.findByCredentials(email, password).then((user) => {
      return user.createSession().then((refreshToken) => {
          // Session created successfully - refreshToken returned.
          //geneate an access auth token for the user

          return user.generateAccessAuthToken().then((accessToken) => {
              // access auth token generated successfully, now we return an object containing the auth tokens
              return { accessToken, refreshToken }
          });
      }).then((authTokens) => {
          //construct and send the response to the user with their auth tokens in the header and the user object in the body
          res
              .header('x-refresh-token', authTokens.refreshToken)
              .header('x-access-token', authTokens.accessToken)
              .send(user);
      })
  }).catch((e) => {
      res.status(400).send(e);
  });
})

app.get('/users/me/access-token', verifySession, (req, res) => {
  req.userObject.generateAccessAuthToken().then((accessToken) => {
      res.header('x-access-token', accessToken).send({ accessToken });
  }).catch((e) => {
      res.status(400).send(e);
  });
})


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
