const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const { MongoClient, ServerApiVersion } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();

// Middleware
app.use(cors());
app.use(express.json());

// mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aymctjj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Database collection
    const database = client.db("DevDive");
    const usersCollection = database.collection("users");
    const blogsCollection = database.collection("blogs");
    const postsCollection = database.collection("posts");

    // Operations
    app.get("/users", async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/user", async (req, res) => {
      const { email } = req.query;
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

    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const query = { email: user.email };

      const existingUser = await usersCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: "user already exists", insertedId: null });
      }
      const result = await usersCollection.insertOne(user);
      res.send(result);
      console.log(result);
    });

    app.put("/users/:email", async (req, res) => {
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

    app.post("/gitHubUsers", async (req, res) => {
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

    app.get("/gitHubUsers/:username", async (req, res) => {
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

    app.put("/gitHubUsers/:username", async (req, res) => {
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
        res.send({ message: "No changes made to the user login time", result });
      }
    });


    // get users from databse

    app.get("/get-users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });

    // update-user-role
    app.put(`/update-user-role/:email`, async (req, res) => {
      const newRole = req.body.data;
      const { email } = req.params;
      const query = { email: email };
      const updateDoc = {
        $set: {
          role: newRole,
        },
      };

      const result = usersCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    // post-blog

    app.post("/post-blog", async (req, res) => {
      const Info = req.body;
      const result = await blogsCollection.insertOne(Info);
      res.send(result);
    });

    // get blogs
    app.get("/get-blog", async (req, res) => {
      result = await blogsCollection.find().toArray();
      res.send(result);
    });

    //post

    app.post("/posts", async (req, res) => {
      try {
        const { title, tags, body, link, images } = req.body;

        // Insert the post into MongoDB
        const result = await postsCollection.insertOne({
          title,
          tags,
          body,
          link,
          images,
          userEmail,
          username,
          profilePicture,
          createdAt: new Date(), // Optional: To track when the post was created
        });

        res
          .status(200)
          .json({
            message: "Post added successfully",
            postId: result.insertedId,
          });
      } catch (error) {
        console.error("Error adding post:", error);
        res.status(500).json({ message: "Failed to add post" });
      }
    });

    // get posts
    app.get("/posts", async (req, res) => {
      try {
        const posts = await postsCollection.find().toArray();
        res.status(200).json(posts);
      } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ message: "Failed to fetch posts" });
      }
    });

    // ------------
    await client.db("admin").command({ ping: 1 });
    console.log("DevDive successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

// mongodb
app.get("/", (req, res) => {
  res.send("DevDive is  running");
});

app.listen(port, () => {
  console.log(`DevDive is running on:${port}`);
});
