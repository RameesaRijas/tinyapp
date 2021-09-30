///Helper functions
const bcrypt = require('bcryptjs');
const hasKey = Object.prototype.hasOwnProperty;
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
  return undefined;
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

//check credential during login
const checkCredentials = (userDb, email, password) => {
  const userFound = findUserByEmail(email, userDb);
  if (userFound) {
    const comparePassword = bcrypt.compareSync(password, userFound.password);
    if (comparePassword) {
      return {user_id : userFound.id, error : null};
    }
    return {user_id : null, error :"Incorrect Password"};
  }
  return {user_id : null, error :"No User Found, Please Register First"};
};

//check if user exist
const checkUserExist = (email, password, userExist) => {
  if (!email || !password) {
    return {error : "Email or Password field should not be empty!"};
  }
  //check user exist
  if (userExist) {
    return {error : "User already exists, try again"};
  }
  return true;
}

//check user has permission to page
const checkUrlAccess = (loggedUser, shortURL, urlDb) => {
    const urlOfUser = urlsForUser(loggedUser.id, urlDb);
  const databaseID = urlDb[shortURL];
  if (databaseID) {
    if (hasKey.call(urlOfUser, shortURL)) {
      const templateVars = {
        longURL: databaseID.longURL,
        user: loggedUser.email,
        shortURL
      };
      return {variable: templateVars, error :null, code : null};
      
    } else {
      return {variable: null, error :"Access Denied", code : 403};
    }    
  }
  return {variable: null, error :"Not Found", code : 404};
}



module.exports = { generateRandomString, findUserByEmail, createUser, urlsForUser,  checkCredentials, checkUserExist , checkUrlAccess};
