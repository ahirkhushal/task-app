require("dotenv").config();
require("./db/mongoose.js");
const express = require("express");
const userrouter = require("./routers/user.js");
const taskrouter = require("./routers/task.js");

const app = express();
const port = process.env.PORT;
app.use(express.json());
app.use(userrouter, taskrouter);

app.listen(port, () => {
  console.log(`server is on port ${port}`);
});
