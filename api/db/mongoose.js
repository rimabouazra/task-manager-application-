//import { Promise, connect } from 'mongoose';
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb+srv://rimabouazra2003:vq08SbT0cRlWLfOJ@cluster0.b6x3bgq.mongodb.net/', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB successfully :)');
  })
  .catch((e) => {
    console.log('Error while attempting to connect to MongoDB :( ');
    console.log(e);
  });

  module.exports = {
    mongoose
  };
