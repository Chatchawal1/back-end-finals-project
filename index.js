// index.js
const express = require("express");
const routes = require("./database/routes");
const cors = require("cors");
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
