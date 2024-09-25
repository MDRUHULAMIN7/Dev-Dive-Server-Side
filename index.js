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
    //   database collection
    const datbase = client.db("DevDive");
    const usersCollection = datbase.collection("users");
    const blogsCollection = datbase.collection("blogs");

    // oparations

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



    // get users from databse 

    app.get('/get-users',async(req,res)=>{
      const result = await usersCollection.find().toArray();
      res.send(result)
    })

    // update-user-role
    app.put(`/update-user-role/:email`,async(req,res)=>{
      const newRole = req.body.data
      const {email} = req.params;
      const query = {email:email}
      const updateDoc ={
        $set:{
          role : newRole
        }
      }

      const result = usersCollection.updateOne(query,updateDoc)
      res.send(result)
    })

    // post-blog

    app.post('/post-blog',async(req,res)=>{
      const Info = req.body;
      const result = await blogsCollection.insertOne(Info);
      res.send(result)
    })

    // get blogs
    app.get('/get-blog',async(req,res)=>{
      result = await blogsCollection.find().toArray();
      res.send(result)
    })
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
