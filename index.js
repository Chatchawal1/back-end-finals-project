// index.js
const express = require("express");
const routes = require("./database/routes");
const cors = require("cors");
const serverless = require('serverless-http')
// const dotenv = require("dotenv");

// dotenv.config(); // โหลดค่า environment variables จากไฟล์ .env

const app = express();
const port = 4000;

app.use(cors());
app.use(express.json());
app.use("/api", routes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// index.js
module.exports = (req, res) => {
  try {
      res.status(200).send('Hello, world!');
  } catch (error) {
      console.error('Error:', error);
      res.status(500).send('Internal Server Error');
  }
};
