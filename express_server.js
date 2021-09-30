const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const hasKey = Object.prototype.hasOwnProperty;

app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

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
  const userFound = findUserByEmail(email, usersDatabase);
  if (userFound) {
    const comparePassword = bcrypt.compareSync(password, userFound.password);
    if (comparePassword) {
      res.cookie("user_id", userFound.id);
      res.redirect("/urls");
      return;
    }
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
  const templateVars = { user : null};
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
  const userId = req.cookies["user_id"];
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
  const userId = req.cookies["user_id"];
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
  const userId = req.cookies["user_id"];
  const loggedUser = usersDatabase[userId];
  if (loggedUser) {
    const urlOfUser = urlsForUser(loggedUser.id, urlDatabase);
    const databaseID = urlDatabase[req.params.shortURL];
    if (databaseID) {
      if (hasKey.call(urlOfUser, req.params.shortURL)) {
        const templateVars = { shortURL: req.params.shortURL,
        longURL: databaseID.longURL,
        user: loggedUser.email,
        };
        res.render("urls_show", templateVars);
        return;
      } else {
        res.status(403).send("Access Denied");
        return
      }    
    }
    res.status(404).send("Not Found"); 
  }
  res.redirect("/urls");
});


//Delete url
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.cookies["user_id"];
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
  const userId = req.cookies["user_id"];
  const loggedUser = usersDatabase[userId];
  if (databaseID && loggedUser.id === databaseID.userID) {
    databaseID["longURL"] = req.body.longURL;
    res.redirect(`/urls/${shortURL}`);
    return;
  }
  res.status(403).send("You do not have permission");
});

//CRUD END

///Helper functions

//random string generator
const generateRandomString = () => {
  const random = Math.random().toString(36).substr(2, 6);
  return random;
};

//find user by email
//check if email already exist in the database
const findUserByEmail = (email, userdb) => {
  for (let userId in userdb) {
    const user = userdb[userId];
    if (email === user.email) return user;
  }
  return false;
};

//create user
const createUser = (email, password, userdb) => {
  const userId = generateRandomString();
  const hashedPassword = bcrypt.hashSync(password, 10);
  userdb[userId] = {
    id : userId,
    password : hashedPassword,
    email,   
  };
  return userId;
};

//filter url with userId
const urlsForUser = (userId, urldb) => {
  const result = {};
  for (let url in urldb) {
    if (urldb[url].userID === userId) {
      result[url] = {
        longURL : urldb[url].longURL,
        userID : userId
      };
    }
  }
  return result;
};


