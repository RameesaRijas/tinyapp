const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');
const uuid = require("uuid");

app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

//url database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//User database
const usersDatabase = { 
  "6sj0ad": {
    id: "6sj0ad", 
    email: "user1@email.com", 
    password: "user1password"
  },
 "9qw1ou": {
    id: "9qw1ou", 
    email: "bob@mail.com", 
    password: "bobhascat"
  }
}

app.listen(PORT, () => {
  console.log(`Example app listening ${PORT}!`);
});

//login
//login page render
app.get("/login", (req, res) => {
  const templateVars = { email : null};
  res.render('login', templateVars);
});

//login with email and password
//get email and password from login form
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const userFound = findUserByEmail(email, usersDatabase);
  if (userFound && userFound.password === password) {
    res.cookie("user_id", userFound.id);
    res.redirect("/urls");
    return;
  }
  res.status(400).send("Wrong credential!");
});


//logout
//clear cookie
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});

///registration page 
app.get("/register", (req, res) => {
  const templateVars = { email : null};
  res.render('register', templateVars);
});

//registration 
//get email and password from registration page
//save this user database
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).send("Email or Password field should not be empty!");
    return;
  }
  const userExist = findUserByEmail(email, usersDatabase);
  //check user exist
  if (userExist) {
    res.status(400).send("User already exists, try again");
    return;
  }
  //create user
  const userId = createUser(email, password, usersDatabase);
  res.cookie("user_id", userId);
  res.redirect("/urls");
});

//home index
app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const loggedUser = usersDatabase[userId];
  const loggedEmail = loggedUser ? loggedUser.email : false;
  const templateVars = { urls: urlDatabase ,  
    email: loggedEmail
  };
  res.render("urls_index", templateVars);
});


//redirect to long url when clicking shortUrl
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});


///CRUD....

//create new url , render to add url page
//create random string, add new url & shortUrl to urldatabase
//redirect to home page
app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  const loggedUser = usersDatabase[userId];
  const loggedEmail = loggedUser ? loggedUser.email : false;
  const templateVars = {
    email: loggedEmail,
  };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  const randomString = generateRandomString();
  urlDatabase[randomString] = req.body.longURL;
  res.redirect(`/urls/${randomString}`);
});


//show page, each short url and it,s related long url
app.get("/urls/:shortURL", (req, res) => {
  const userId = req.cookies["user_id"];
  const loggedUser = usersDatabase[userId];
  const loggedEmail = loggedUser ? loggedUser.email : false;
  const templateVars = { shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    email: loggedEmail,
  };
  res.render("urls_show", templateVars);
});


//Delete url
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete(urlDatabase[shortURL]);
  res.redirect('/urls');
});

//Update the longUrl
//get shortUrl as key
app.post("/urls/:id/update", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);

});

//CRUD END

///Helper functions

//random string generator
function generateRandomString() {
  const random = Math.random().toString(36).substr(2, 6);
  return random;
}

//find user by email
//check if email already exist in the database
const findUserByEmail = (email, userdb) => {
  for (let userId in userdb) {
    const user = userdb[userId];
    if (email === user.email) return user;
  }

  return false;
}

const createUser = (email, password, userdb) => {
  const userId = generateRandomString();
  userdb[userId] = {
    id : userId,
    email,
    password,
  }
  return userId;
}


