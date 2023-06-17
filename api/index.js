const express = require("express");
const cors = require("cors");
//const https = require('https');
const app = express();
const jwt = require('jsonwebtoken');
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("./models/User.js");
const cookieParser = require('cookie-parser');
const imageDownloader = require('image-downloader');
const multer = require('multer');
const fs = require('fs');
const Place = require('./models/Place.js');
const TrafficAlert = require('./models/Traffic.js');

class ApiResponse {
  constructor(success, data, error) {
    this.success = success;
    this.data = data;
    this.error = error;
  }

  setSuccess(success) {
    this.success = success;
    return this;
  }

  setMessage(message) {
    this.message = message;
    return this;
  }

  setData(data) {
    this.data = data;
  }
}


/*const fs = require('fs');
const key = fs.readFileSync('../key.pem');
const cert = fs.readFileSync('../cert.pem');*/
require("dotenv").config();

const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = 'random_string';

// Middleware funkciji
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));



app.use(cors());

/*
app.use(
  cors({
    //cross-site origin scripting - uporablja se za resource sharing
    credentials: true,
    origin: "http://212.101.137.119:5170",
  })
);
*/

// povezava s podatkovno bazo
mongoose.connect(process.env.MONGO_URL)


app.get('/test', (req, res) => {
  res.json('test ok')
})


app.post("/register", async (req, res) => {
  // api endpoint - user registration
  const { name, email, password } = req.body;
  console.log("Register request received:", req.body);

  // Preverite manjkajoča zahtevana polja
  if (!name || !email || !password) {
    console.log("Missing required fields:", req.body);
    const response = new ApiResponse();
    response.setSuccess(false);
    response.setMessage("Missing required fields.");
    return res.status(400).json(response);
  }

  try {
    // Shrani uporabniške podatke v bazo (geslo je šifrirano)
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });

    console.log("User created:", userDoc);
    const response = new ApiResponse();
    response.setSuccess(true);
    response.setData(userDoc);
    return res.json(response);
  } catch (error) {
    console.error("Failed to create user:", error);
    const response = new ApiResponse();
    response.setSuccess(false);
    response.setMessage("Failed to create user.");
    return res.status(500).json(response);
  }
});





app.post("/login", async (req, res) => {
  // api endpoint - user login
  const { email, password } = req.body;
  const userDoc = await User.findOne({ email });
  console.log(req.body);
  if (userDoc) {
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      jwt.sign({
        email: userDoc.email, 
        id: userDoc._id,
        name: userDoc.name
      }, jwtSecret, {}, (err, token) => {
        if (err) throw err;

        const response = new ApiResponse();
        response.setSuccess(true);
        response.setMessage("User logged in successfully.");
        res.cookie('token', token, { sameSite: 'none', secure: true }).json(response);
        console.log(token);
      });
    }
    else {
      const response = new ApiResponse();
      response.setSuccess(false);
      response.setMessage("Incorrect password.");
      res.status(422).json(response);
    }
  }
  else {
    const response = new ApiResponse();
    response.setSuccess(false);
    response.setMessage("User not found.");
    res.status(404).json(response);
  }
});


app.post("/traffic-alerts", async (req, res) => {
  const { latitude, longitude, date, person, car, bicycle, cat, dog, truck, stop_sign, fire_hydrant, traffic_light } = req.body;

   const detectionsArray = [
    person,
    car,
    bicycle,
    cat,
    dog,
    truck,
    stop_sign,
    fire_hydrant,
    traffic_light
  ];

  const authorizationHeader = req.headers.authorization;
  const token = authorizationHeader.split(" ")[1]; // Format - "Bearer <token>"

  // Verify the token
  jwt.verify(token, jwtSecret, async (err, userData) => {
    if (err) {
      console.error("Failed to verify JWT token:", err);
      const response = new ApiResponse();
      response.setSuccess(false);
      response.setMessage("Failed to verify JWT token.");
      return res.status(401).json(response);
    }

    try {
      const trafficAlert = await TrafficAlert.create({
  userId: userData.id,
  coordinates: [longitude, latitude],
  time: new Date(date),
  detections: detectionsArray
});

      const response = new ApiResponse();
      response.setSuccess(true);
      response.setMessage("Traffic alert created.");
      return res.json(response);
    } catch (error) {
      console.error("Failed to create traffic alert:", error);
      const response = new ApiResponse();
      response.setSuccess(false);
      response.setMessage("Failed to create traffic alert.");
      return res.status(500).json(response);
    }
  });
});



app.get("/traffic-alerts", async (req, res) => {
  const authorizationHeader = req.headers.authorization;
  const token = authorizationHeader.split(" ")[1]; // Format - "Bearer <token>"

  // Preveri žeton
  jwt.verify(token, jwtSecret, async (err, userData) => {
    if (err) {
      console.error("Failed to verify JWT token:", err);
      const response = new ApiResponse();
      response.setSuccess(false);
      response.setMessage("Failed to verify JWT token.");
      return res.status(401).json(response);
    }

    try {
      // Časovni žig za 24 ur nazaj
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      const twentyFourHoursAgoEpoch = twentyFourHoursAgo.getTime();

      //Pridobitev prometna opozorila iz baze podatkov glede na ID uporabnika in stanje časovnega žiga
      const trafficAlerts = await TrafficAlert.find({
        userId: userData.id,
        time: { $gte: new Date(twentyFourHoursAgoEpoch) },
      });

      const response = new ApiResponse();
      response.setSuccess(true);
      response.setData(trafficAlerts);
     
      return res.json(response);
    } catch (error) {
      console.error("Failed to retrieve traffic alerts:", error);
      const response = new ApiResponse();
      response.setSuccess(false);
      response.setMessage("Failed to retrieve traffic alerts.");
      return res.status(500).json(response);
    }
  });
});







app.listen(4000);

process.on("SIGTERM", () => {
  /*
  Ta koda je potrebna, ker se nodemon nenehno sesuje, ko znova shranim datoteko index.js. 
  Ta koda počasi zapre strežnik, preden ga nodemon znova zažene.
  */
  console.log("Received SIGTERM, shutting down server gracefully");
  server.close(() => {
    console.log("Server has been shutdown");
    process.exit(0);
  });
});
