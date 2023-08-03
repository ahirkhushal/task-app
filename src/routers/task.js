const express = require("express");
const task = require("../models/task.js");
const auth = require("../middleware/auth.js");
const { ObjectId } = require("mongodb");
const router = new express.Router();

// for post the tasks
router.post("/tasks", auth, async (req, res) => {
  try {
    const tasks = await new task({
      ...req.body,
      owner: req.user._id,
    }).save();

    res.status(201).send(tasks);
  } catch (err) {
    res.status(400).send(err);
  }
});

//for get all tasks
router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};
  if (req.query.complete) {
    match.complete = req.query.complete === "true";
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  }

  try {
    await req.user.populate({
      path: "tasks",
      match,
      options: {
        limit: parseInt(req.query.limit),
        skip: parseInt(req.query.skip),
        sort,
      },
    });

    res.send(req.user.tasks);
  } catch (err) {
    res.status(500).send(err);
  }
});

//for get task by id
router.get("/tasks/:id", auth, async (req, res) => {
  try {
    const tasks = await task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!tasks) {
      return res.status(404).send();
    }

    res.send(tasks);
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

//for update task
router.patch("/tasks/:id", auth, async (req, res) => {
  try {
    const update = Object.keys(req.body);
    const isvalid = update.every((update) =>
      ["description", "complete"].includes(update)
    );

    if (!isvalid) {
      return res.status(400).send({ error: "invalid key" });
    }

    const tasks = await task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!tasks) {
      return res.status(404).send();
    }

    update.forEach((update) => (tasks[update] = req.body[update]));
    await tasks.save();
    res.send(tasks);
  } catch (err) {
    res.status(400).send(err);
  }
});

//for delete task
router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const tasks = await task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!tasks) {
      return res.status(404).send();
    }

    res.send(tasks);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;
