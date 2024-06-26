require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const session = require('express-session');

//database user model
const User = require('./models/User');


const app = express();

app.use(express.static('public'))
app.set('view engine', 'ejs')

app.use(express.urlencoded({ extended: true }));


//session middleware

app.use(session({
  secret: '8nH^E%F#7!@Lg6$K9&jJ5*dB2#hG!mC', // A secret key for signing the session ID cookie
  saveUninitialized: false, // Don't create a session until something is stored
  resave: false, // Don't save session if unmodified
  cookie: { secure: false } // Set to true if your site uses HTTPS
}));



//routes
app.get('/', (req, res) => {
  res.render("index.ejs");
});

app.get('/dashboard', async (req, res) => {
  if (!req.session.userId){
    return res.redirect('/login');
  }
  const user = await User.findById(req.session.userId);
  
  res.render("dashboard.ejs", { user: user });
});

app.get('/signup',(req, res) => {
    res.render("signup.ejs");
});

app.get('/login',(req, res) => {
  res.render("login.ejs");
});

app.get('/test',(req, res) => {
  res.render("test.ejs");
});

//dynamic display route 

app.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(404).send("User not found");
    }
    // Assuming you have a view called 'user-profile.ejs' that displays the user's data
    res.render('user-profile', { user: user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});




//database connection
mongoose.connect(process.env.MONGO_URI, {

}).then(() => {
  console.log("MongoDB database connection established successfully");
}).catch((err) => {
  console.error('Error connecting to MongoDB', err);
});





//signup route
app.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 12); // Hash password

    const plainPassword = password;
    const newUser = new User({ username, password: hashedPassword });
    
    await newUser.save(); // Save the user to the database
    res.redirect('/login'); // Redirect to the login page
  } catch (error) {
    console.error(error);
    res.status(500).send('Error signing up');
  }
});

//login route
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).send('Invalid Credentials');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send('Invalid Credentials');
    }
    req.session.userId = user._id; //store user id in session
    res.redirect('/dashboard');
  } catch (error) {
    res.status(500).send('Server error');
  }
});

//posting links route & function
function preprocessUrl(url) {
  if (!url) return url; // Return the original URL if it's falsy (e.g., empty, null)
  
  // Check if the URL starts with http://, https://, or www.
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('www.')) {
    url = 'http://www.' + url; // Prepend http://www. to the URL
  } else if (url.startsWith('www.')) {
    url = 'http://' + url; // Prepend http:// to URLs starting with www.
  }
  return url;
}

app.post('/post-link', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login'); // Ensure user is logged in
  }

  const { title } = req.body;
  let { url } = req.body;
  url = preprocessUrl(url);
  
  try {
    // Assuming your User model has a 'links' array
    await User.findByIdAndUpdate(req.session.userId, {
      $push: { links: { title, url } }
    });
    res.redirect('/dashboard'); // Redirect after posting
  } catch (error) {
    console.error(error);
    res.status(500).send('Error posting link');
  }
});

app.post('/delete-link', async (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/login'); // Ensure user is logged in
  }

  try {
    // Get user document
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Remove the link at the specified index
    const { linkIndex } = req.body;
    user.links.splice(linkIndex, 1);

    // Save the updated user document
    await user.save();
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting link');
  }
});


app.post('/update-profile', async (req, res) => {
  const { name, bio, linkTitles, linkUrls } = req.body;


  const updatedLinks = linkTitles.map((title, index) => ({
      title: title,
      url: preprocessUrl(linkUrls[index]) //preprocess url like before
  }));

  try {
      await User.findByIdAndUpdate(req.session.userId, {
          $set: { name, bio, links: updatedLinks }
      });
      res.redirect('/dashboard');
  } catch (error) {
      console.error(error);
      res.status(500).send('Error updating profile');
  }
});







const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

