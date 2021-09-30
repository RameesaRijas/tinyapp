const express = require("express");
const app = express();
const PORT = 8080;
const cookieSession = require('cookie-session')
const bcrypt = require('bcryptjs');
const { generateRandomString, findUserByEmail, createUser, urlsForUser, checkCredentials , checkUserExist, checkUrlAccess}  = require("./helpers");


app.set("view engine", "ejs");

app.use(express.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["little things", "!PePper234$lo"],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

app.use((req, res, next) => {
  const user_id = req.session.user_id;
  const path = req.path;
  const allowedPath = ["urls/new", "/urls/:shortURL"];
  if (!user_id && allowedPath.includes(path)) {
      res.redirect('/urls');
  }
  next();
})

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
  if (checkUser.user_id) {
    req.session.user_id = checkUser.user_id;
    res.redirect("/urls");
    return;
  }
  res.status(400).send(checkUser.error);
});


//logout
//clear cookie
app.post("/logout", (req, res) => {
  req.session.user_id = null
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
  req.session.user_id = userId;
  res.redirect("/urls");
});

//home index
app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const loggedUser = usersDatabase[userId];
  if (loggedUser) {
    const loggedEmail = loggedUser.email;
    const urlOfLoggedUser = urlsForUser(loggedUser.id, urlDatabase);
    const templateVars = { urls: urlOfLoggedUser,
      user: loggedEmail,
    };
    res.render("urls_index", templateVars);
    return;
  }
  res.render("error", {user : null});
});


//redirect to long url when clicking shortUrl
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const id = urlDatabase[req.params.shortURL];
  if (id) {
    const longURL = urlDatabase[shortURL]["longURL"];
    res.redirect(longURL);
  }
  res.status(404).send("Content Not Found");
});


///CRUD....

//create new url
//new url page
//get new url via post requst
//create random string, add new url & shortUrl to urldatabase
//redirect to home page
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const loggedUser = usersDatabase[userId];
  if (loggedUser) {
    const loggedEmail = loggedUser.email;
    const templateVars = {
      user: loggedEmail,
    };
    res.render("urls_new", templateVars);
    return;
  }
  res.redirect("/urls");
});


app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
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


//show page, each short url and it,s related long url
app.get("/urls/:shortURL", (req, res) => {
  const userId = req.session.user_id;
  const loggedUser = usersDatabase[userId];
  const shortURL = req.params.shortURL;
  if (loggedUser) {
  const urlAccess = checkUrlAccess(loggedUser, shortURL, urlDatabase);
    if (urlAccess.variable) {
      res.render("urls_show", urlAccess.variable);
      return;
    }
    res.status(urlAccess.code).send(urlAccess.error);
  }
  res.redirect("/urls");
});


//Delete url
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.session.user_id;
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
app.post("/urls/:id/update", (req, res) => {
  const shortURL = req.params.id;
  const databaseID = urlDatabase[shortURL];
  const userId = req.session.user_id;
  const loggedUser = usersDatabase[userId];
  if (databaseID && loggedUser.id === databaseID.userID) {
    databaseID["longURL"] = req.body.longURL;
    res.redirect(`/urls/${shortURL}`);
    return;
  }
  res.status(403).send("You do not have permission");
});

//CRUD END


