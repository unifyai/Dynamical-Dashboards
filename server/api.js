/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/
const ObjectID = require("mongodb").ObjectID;
const mongoose = require("mongoose");
const express = require("express");
const User = require("./models/user");
const Question = require("./models/question");
// import authentication library
const auth = require("./auth");

// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

const socket = require("./server-socket");

router.post("/login", auth.login);
router.post("/logout", auth.logout);
router.get("/whoami", (req, res) => {
  if (!req.user) {
    return res.send({});
  }

  res.send(req.user);
});

router.get("/user", (req, res) => {
  User.findById(req.query.userid).then((user) => {
    res.send(user);
  });
});

router.post("/initsocket", (req, res) => {
  // do nothing if user not logged in
  res.send({});
});

async function getOuterLevelKeys(collection) {
  const pipeline = [
    { $project: { document: { $objectToArray: "$$ROOT" } } },
    { $unwind: "$document" },
    { $group: { _id: null, keys: { $addToSet: "$document.k" } } },
    { $project: { _id: 0, keys: 1 } },
  ];

  const results = await collection.aggregate(pipeline).limit(1).toArray();
  return results.length > 0 ? results[0].keys : [];
}

router.get("/submodules", (req, res) => {
  const db = mongoose.connection.db;
  const collection = db.collection(req.query.module);

  // Process the collection here
  getOuterLevelKeys(collection).then((keys) => {
    res.send(keys);
    console.log("Outer-level keys:", keys);
  });
});

async function getFilteredData(collection, keys) {
  // Create a projection object
  const projection = {};
  for (const key of keys) {
    projection[key] = 1;
  }

  // Find the first document with the specified keys
  const result = await collection.findOne({}, { projection });
  delete result._id;
  return result;
}

router.get("/data", (req, res) => {
  const db = mongoose.connection.db;
  const collection = db.collection(req.query.module);
  console.log(req.query.submodules);
  console.log(req.query.backends);
  console.log(req.query.frontends);
  submodules = req.query.submodules.map((submodule) => submodule.value);
  backends = req.query.backends.map((backend) => {
    var str = backend.value;
    const slashIndex = str.indexOf("/");
    const backend_name = str.substring(0, slashIndex) + "\n";
    let backend_version = str.substring(slashIndex + 1);
    backend_version = backend_version.replace(/\./g, "_");
    return backend_name + "." + backend_version;
  });
  frontends = req.query.frontends.map((frontend) => {
    let str = frontend.value;
    const slashIndex = str.indexOf("/");
    let frontend_version = str.substring(slashIndex + 1);
    return frontend_version.replace(/\./g, "_");
  });
  const keys = [];

  submodules.forEach((submodule) => {
    backends.forEach((backend) => {
      frontends.forEach((frontend) => {
        const key = submodule + "." + backend + "." + frontend;
        keys.push(key);
      });
    });
  });
  console.log(keys);

  // Fetch the filtered data
  getFilteredData(collection, keys).then((filteredData) => {
    console.log(filteredData);
    res.send(filteredData);
  });
});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
