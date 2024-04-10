const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },

  //links to post
  links: [{
    title: String,
    url: String
  }],

  //name
  name: { type: String, required: false },
  //bio
  bio: { type: String, required: false },
  //profile pic
  profilePicture: { type: String, required: false },
  
});

// Hash the user's password before saving
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    //this.password = await bcrypt.hash(this.password, 12); might delet (this makes you hash twice)
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);