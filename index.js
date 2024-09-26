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


    // get users from database
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

        res.status(200).json({
          message: "Post added successfully",
          postId: result.insertedId,
        });
      } catch (error) {
        console.error("Error adding post:", error);
        res.status(500).json({ message: "Failed to add post" });
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
