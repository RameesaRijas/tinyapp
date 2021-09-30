const express = require("express");
const app = express();
const PORT = 8080;
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const methodOverride = require('method-override');
const { generateRandomString, findUserByEmail, createUser, urlsForUser, checkCredentials , checkUserExist, checkUrlAccess}  = require("./helpers");


app.set("view engine", "ejs");

app.use(express.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: ["little things", "!PePper234$lo"],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

//url database
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "6sj0ad"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "9qw1ou"
  }
};

//User database
//making hash password
const user1password = bcrypt.hashSync("user1password", 10);
const user2password = bcrypt.hashSync("12345", 10);
const usersDatabase = {
  "6sj0ad": {
    id: "6sj0ad",
    email: "user1@email.com",
    password: user1password
  },
  "9qw1ou": {
    id: "9qw1ou",
    email: "bob@mail.com",
    password: user2password
  }
};

app.listen(PORT, () => {
  console.log(`Example app listening ${PORT}!`);
});

app.get("/", (req, res) => {
  res.redirect('/urls');
});

//login
//login page render
app.get("/login", (req, res) => {
  const templateVars = { user : null};
  res.render('login', templateVars);
});

//login with email and password
//get email and password from login form
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const checkUser = checkCredentials(usersDatabase, email, password);
  if (checkUser.userId) {
    req.session.userId = checkUser.userId;
    res.redirect("/urls");
    return;
  }
  res.status(400).send(checkUser.error);
});


//logout
//clear cookie
app.post("/logout", (req, res) => {
  req.session.userId = null;
  res.redirect("/urls");
});

///registration page
app.get("/register", (req, res) => {
  const templateVars = { user : null};
  res.render('register', templateVars);
});

//registration
//get email and password from registration page
//save this user database
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const userExist = findUserByEmail(email, usersDatabase);
  const userCheck = checkUserExist(email, password, userExist);
  //check user exist
  if (userCheck.error) {
    res.status(400).send(userCheck.error);
    return;
  }
  //create user
  const userId = createUser(email, password, usersDatabase);
  req.session.userId = userId;
  res.redirect("/urls");
});

//shows all url that created by url
app.get("/urls", (req, res) => {
  const userId = req.session.userId;
  const loggedUser = usersDatabase[userId];
  if (loggedUser) {
    const loggedEmail = loggedUser.email;
    //show url that are only belongs to the user
    const urlOfLoggedUser = urlsForUser(loggedUser.id, urlDatabase);
    const templateVars = { urls: urlOfLoggedUser,
      user: loggedEmail,
    };
    res.render("urls_index", templateVars);
    return;
  }
  res.render("error", {user : null});
});

//public endpoints
//redirect to long url when clicking shortUrl
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const id = urlDatabase[req.params.shortURL];
  if (id) {
    const longURL = urlDatabase[shortURL]["longURL"];
    res.redirect(longURL);
    return;
  }
  res.status(404).send("Content Not Found");
});


/**
 * CRUD
 */
//create new url
//new url page
//get new url via post requst
//create random string, add new url & shortUrl to urldatabase
//redirect to home page
app.get("/urls/new", (req, res) => {
  const userId = req.session.userId;
  const loggedUser = usersDatabase[userId];
  if (loggedUser) {
    const loggedEmail = loggedUser.email;
    const templateVars = {
      user: loggedEmail,
    };
    res.render("urls_new", templateVars);
    return;
  }
  res.redirect("/login");
});


app.post("/urls", (req, res) => {
  const userId = req.session.userId;
  const loggedUser = usersDatabase[userId];
  if (loggedUser) {
    const randomString = generateRandomString();
    urlDatabase[randomString] = {
      longURL : req.body.longURL,
      userID : loggedUser.id
    };
    res.redirect(`/urls/${randomString}`);
    return;
  }
  res.status(403).send("Access denied");
});

//Read
//show page, each short url and it,s related long url
//get id
//show details of the urlId
app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.userId;
  const loggedUser = usersDatabase[userId];
  const shortURL = req.params.shortURL;
  if (loggedUser) {
    const urlAccess = checkUrlAccess(loggedUser, shortURL, urlDatabase);
    if (urlAccess.variable) {
      res.render("urls_show", urlAccess.variable);
      return;
    }
    res.status(urlAccess.code).send(urlAccess.error);
    return;
  }
  res.redirect("/urls");
});


//Delete url
//get id of the url
//delete url with the urlId
app.delete("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.session.userId;
  const loggedUser = usersDatabase[userId];
  if (loggedUser && urlDatabase[shortURL].userID === loggedUser.id) {
    delete(urlDatabase[shortURL]);
    res.redirect('/urls');
    return;
  }
  res.status(403).send("You do not have permission");
});


//Update the longUrl
//get shortUrl as key
app.put("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const databaseID = urlDatabase[shortURL];
  const userId = req.session.userId;
  const loggedUser = usersDatabase[userId];
  if (databaseID && loggedUser) {
    if (loggedUser.id === databaseID.userID) {
      databaseID["longURL"] = req.body.longURL;
      res.redirect(`/urls/${shortURL}`);
      return;
    }
  }
  res.status(403).send("You do not have permission");
});

//CRUD END