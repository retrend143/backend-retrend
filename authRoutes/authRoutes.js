const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Import the User model here

const app = express();
const auth = require("../middleware/auth");

app.get('/api/check-status', (req, res) => {
  const isBackendOnline = true;

  if (isBackendOnline) {
    res.json({ status: 'online' });
  } else {
    res.json({ status: 'offline' });
  }
});

app.get("/auth-endpoint", auth, (request, response) => {
  response.json({ isAuthenticated: true });
});

app.post("/register", (request, response) => {
    // check if user exists first
    User.findOne({ email: request.body.email })
      .then((foundUser) => {
        // renamed variable to foundUser to avoid redefining user
        if (foundUser) {
          // check if user already exists
          return response.status(409).json({
            // send bad request status with error message
            message: "User already exists",
          });
        }
        // hash the password
        bcrypt
          .hash(request.body.password, 10)
          .then((hashedPassword) => {
            // create a new user instance and collect the data
            const newUser = new User({
              email: request.body.email,
              name: request.body.name,
              password: hashedPassword,
            });
            // save the new user
            newUser
              .save()
              // return success if the new user is added to the database successfully
              .then((result) => {
                response.status(201).send({
                  message: "User Created Successfully",
                  result,
                });
              })
              // catch error if the new user wasn't added successfully to the database
              .catch((error) => {
                response.status(500).send({
                  message: "Error creating user",
                  error,
                });
              });
          })
          // catch error if the password hash isn't successful
          .catch((e) => {
            response.status(500).send({
              message: "Password was not hashed successfully",
              e,
            });
          });
      })
      .catch((error) => {
        // send error message to client
        response.status(500).send({
          message: "Error creating user",
          error,
        });
      });
  });
  
  // login endpoint
  app.post("/login", (request, response) => {
    // check if email exists
    User.findOne({ email: request.body.email })
      // if email exists
      .then((user) => {
        // compare the password entered and the hashed password found
        bcrypt
          .compare(request.body.password, user.password)
  
          // if the passwords match
          .then((passwordCheck) => {
            // check if password matches
            if (!passwordCheck) {
              return response.status(400).send({
                message: "Passwords does not match",
                error,
              });
            }
  
            //   create JWT token
            const token = jwt.sign(
              {
                userId: user._id,
                userEmail: user.email,
              },
              "RANDOM-TOKEN",
              { expiresIn: "24h" }
            );
  
            //   return success response
            response.status(200).send({
              message: "Login Successful",
              email: user.email,
              token,
              name: user.name,
              picture: user.picture,
              phone: user.phonenumber,
            });
          })
          // catch error if password does not match
          .catch((error) => {
            response.status(400).send({
              message: "Passwords does not match",
              error,
            });
          });
      })
      // catch error if email does not exist
      .catch((e) => {
        response.status(404).send({
          message: "Email not found",
          e,
        });
      });
  });

module.exports = app;
