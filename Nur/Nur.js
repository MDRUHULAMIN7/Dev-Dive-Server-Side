const express = require("express");
const router = express.Router();

module.exports = (usersCollection, postsCollection) => {
  router.get("/users", async (req, res) => {
    const cursor = usersCollection.find();
    const result = await cursor.toArray();
    res.send(result);
  });

  router.get("/user/:email", async (req, res) => {
    const { email } = req.params;
    console.log(req.params);

    console.log(email);

    const query = { email: email };
    console.log(query);

    try {
      const user = await usersCollection.findOne(query);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  router.get("/gitHubUsers/:username", async (req, res) => {
    const username = req.params.username;
    try {
      const query = { name: username };
      const user = await usersCollection.findOne(query);

      if (user) {
        res.send({ user });
      } else {
        res.status(404).send({ message: "User not found" });
      }
    } catch (error) {
      res.status(500).send({ message: "Error retrieving user", error });
    }
  });

  router.post("/users", async (req, res) => {
    const user = req.body;
    console.log(user);
    const query = { email: user.email };

    const existingUser = await usersCollection.findOne(query);
    if (existingUser) {
      return res.send({
        message: "user already exists",
        insertedId: null,
      });
    }
    const result = await usersCollection.insertOne(user);
    res.send(result);
    console.log(result);
  });

  router.put("/users/:email", async (req, res) => {
    const email = req.params.email;
    console.log(email);

    const userData = req.body;
    const query = { email: email };
    const update = {
      $set: userData,
    };
    const result = await usersCollection.updateOne(query, update);
    if (result.modifiedCount > 0) {
      res.send({ message: "User updated successfully", result });
    } else {
      res.send({ message: "No changes made to the user", result });
    }
  });

  router.post("/gitHubUsers", async (req, res) => {
    const userData = req.body;
    const query = { name: userData.name };
    const existingUser = await usersCollection.findOne(query);
    if (existingUser) {
      res.send({ message: "User already exists", existingUser });
    } else {
      const result = await usersCollection.insertOne(userData);
      res.send({ message: "User created successfully", result });
    }
  });

  router.put("/gitHubUsers/:username", async (req, res) => {
    const username = req.params.username;
    const loginData = req.body;
    const query = { name: username };

    const update = {
      $set: loginData,
    };

    const result = await usersCollection.updateOne(query, update);

    if (result.modifiedCount > 0) {
      res.send({ message: "User login time updated successfully", result });
    } else {
      res.send({
        message: "No changes made to the user login time",
        result,
      });
    }
  });

  // LeaderBoard Posts
  router.get("/leaderBoardPosts", async (req, res) => {
    try {
      const posts = await postsCollection.find().toArray();
      res.status(200).json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  return router;
};
