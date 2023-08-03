const express = require("express");
const User = require("../models/user.js");
const auth = require("../middleware/auth.js");
const sharp = require("sharp");
const task = require("../models/task.js");
const multer = require("multer");
const { sendWelcomEmail, sendGoodByeEmail } = require("../emails/email.js");
const router = new express.Router();

router.post("/users", async (req, res) => {
  try {
    const user = await new User(req.body).save();
    await sendWelcomEmail(user.email, user.name);
    const token = await user.generateOfToken();

    res.status(201).send({ user, token });
  } catch (err) {
    res.status(400).send({ error: "email already exist" });
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );

    const token = await user.generateOfToken();

    res.send({ user, token });
  } catch (err) {
    res.status(400).send(err.message);
  }
});

router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();
    res.send("logged out");
  } catch (err) {
    res.status(500).send();
  }
});

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (err) {
    res.status(500).send();
  }
});

router.get("/users/me", auth, async (req, res) => {
  res.send({ user: req.user });
});

router.patch("/users/me", auth, async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const isValid = updates.every((update) =>
      ["name", "email", "password", "age"].includes(update)
    );
    if (!isValid) {
      return res.status(400).send({ error: "invalid key" });
    }

    const user = req.user;

    updates.forEach((update) => (user[update] = req.body[update]));

    await user.save();

    res.send(user);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.delete("/users/me", auth, async (req, res) => {
  try {
    const user = await req.user.deleteOne();
    await task.deleteMany({ owner: user._id });
    await sendGoodByeEmail(user.email, user.name);
    res.send(user);
  } catch (err) {
    console.log(err);
    res.status(500).send();
  }
});

const upload = multer({
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(png|jpg|jpeg)$/)) {
      return cb(new Error("please upload an image"));
    }

    cb(undefined, true);
  },
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ height: 250, width: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send({ message: "image succesfully uploaded" });
  },
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.get("/users/:id/avatar", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      throw new Error("image is not found");
    }

    res.set("Content-Type", "image/png");
    res.send(user.avatar);
  } catch (err) {
    res.status(404).send({ err: err.message });
  }
});

router.delete("/users/me/avatar", auth, async (req, res) => {
  if (!req.user.avatar) {
    return res.status(404).send({ warning: "image is not uploaded" });
  }

  req.user.avatar = undefined;
  await req.user.save();

  res.send({ success: "image is deleted" });
});

module.exports = router;
