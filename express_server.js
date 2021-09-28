const express = require("express");
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser')

app.set("view engine", "ejs");
app.use(express.urlencoded({extended: true}));
app.use(cookieParser());

//database
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello");
});

app.listen(PORT, () => {
  console.log(`Example app listening ${PORT}!`);
});

//login
//setting cookie
app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect("/urls");
});

//logout
//clear cookie
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/urls");
});

//home index
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase ,  
    username: req.cookies["username"] //getting username cookie
  };
  res.render("urls_index", templateVars);
});

//create new url , render to add url page
//create random string, add new url & shortUrl to urldatabase
//redirect to home page
app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
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
  const templateVars = { shortURL: req.params.shortURL, 
    longURL: urlDatabase[req.params.shortURL],
    username: req.cookies["username"],
  };
  res.render("urls_show", templateVars);
});


//redirect to long url when clicking shortUrl
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
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

//random string generator
function generateRandomString() {
  const random = Math.random().toString(36).substr(2, 6);
  return random;
}


