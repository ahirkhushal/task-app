const jwt = require("jsonwebtoken");
const User = require("../models/user.js");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").split(" ").slice(-1).join("");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    });

    if (!user) {
      throw new Error();
    }
    await user.populate("tasks");

    req.token = token;
    req.user = user;

    next();
  } catch (err) {
    res.status(401).send({ error: "please aunthenticate", err: err.message });
  }
};

module.exports = auth;
