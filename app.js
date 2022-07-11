const express = require("express");
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const config = require("./config")

const app = express();

app.use(express.json());

const User = require("./src/model/user");

const { TOKEN_KEY } = config

const auth = require("./src/middleware/auth");

app.post("/authenticate", auth, (req, res) => {
  return res.status(200).json({
    message: "Successfully authenticated",
    status: "success"
  });
});

// Register
app.post("/register", async (req, res) => {
  // Our register logic starts here
  try {
    // Get user input
    const { first_name, last_name, email, password } = req.body;

    // Validate user input
    if (!(email && password && first_name && last_name)) {
      return res.status(400).json({
        message: "All input is required",
        status: "fail"
      });
    }

    // check if user already exist
    // Validate if user exist in our database
    const oldUser = await User.findOne({ email: email.toLowerCase() });

    if (oldUser) {
      return res.status(409).json({
        message: "User Already Exist. Please Login",
        status: "fail"
      });
    }

    //Encrypt user password
    encryptedPassword = await bcrypt.hash(password, 10);

    // Create user in our database
    const user = await User.create({
      first_name,
      last_name,
      email: email.toLowerCase(), // sanitize: convert email to lowercase
      password: encryptedPassword,
    });

    // Create token
    const token = jwt.sign(
      { user_id: user._id, email },
      TOKEN_KEY,
      {
        expiresIn: "2h",
      }
    );
    // save user token
    user.token = token;

    // return new user
    return res.status(201).json(user);
  } catch (err) {
    console.log(err);
  }
  // Our register logic ends here
});

// Login
app.post("/login", async (req, res) => {

  // Our login logic starts here
  try {
    // Get user input
    const { email, password } = req.body;

    // Validate user input
    if (!(email && password)) {
      return res.status(400).json({
        message: "All input is required",
        status: "fail"
      });
    }
    // Validate if user exist in our database
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      // Create token
      const token = jwt.sign(
        { user_id: user._id, email },
        TOKEN_KEY,
        {
          expiresIn: "2h",
        }
      );

      // save user token
      user.token = token;

      // user
      return res.status(200).json(user);
    } else {
      res.status(400).json({
        message: "Invalid Credentials",
        status: "fail"
      });
    }
  } catch (err) {
    res.status(500).json({
      message: "Server Failure",
      status: "fail"
    });
  }
});

module.exports = app;