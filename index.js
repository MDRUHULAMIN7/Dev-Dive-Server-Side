const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken')
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config()

// midleware

app.use(cors());
app.use(express.json());
// mongodb


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aymctjj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
//   database collection
const datbase = client.db("DevDive");
const usersCollection = datbase.collection('users')

// oparations



// ------------
    await client.db("admin").command({ ping: 1 });
    console.log(" Devdive successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error

  }
}
run().catch(console.dir);



// mongodb

app.get( '/' ,(req,res)=>{
    res.send('Devdive is  running');
})

app.listen(port,()=>{
    console.log(`Devdive is running on:${port}`);
})

