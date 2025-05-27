const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { mongoose } = require('./mongoose'); // Import the mongoose connection
const { List } = require('./models/list.model'); // Import the List model
const { Task } = require('./models/task.model'); // Import the Task model

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


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
