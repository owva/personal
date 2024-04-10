const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://admin:OT)!jc05@signup.2tmrjfo.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});

const connection = mongoose.connection;

connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
});