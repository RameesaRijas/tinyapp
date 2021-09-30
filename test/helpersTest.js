const { assert } = require('chai');

const { findUserByEmail, urlsForUser } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

//url database
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = findUserByEmail("user@example.com", testUsers)
    const expectedOutput = {
      id: "userRandomID", 
      email: "user@example.com", 
      password: "purple-monkey-dinosaur"
    };
    assert.deepEqual(user, expectedOutput);
  });

  it('should return a undefined when email is not in db', function() {
    const user = findUserByEmail("user12@example.com", testUsers)
    assert.isUndefined(user);
  });
});

describe('urlForUser', function() {
  it('should return a url for specific user', function() {
    const user = urlsForUser("userRandomID", urlDatabase)
    const expectedOutput = { 
      b6UTxQ: {
        longURL: "https://www.tsn.ca",
        userID: "userRandomID"
      },
    }
    assert.deepEqual(user, expectedOutput);
  });

  it('should return a empty when no url for user', function() {
    const user = findUserByEmail("user12123@example.com", testUsers);
    assert.isUndefined(user);
  });
});
