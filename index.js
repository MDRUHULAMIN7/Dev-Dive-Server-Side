const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { format } = require('date-fns');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const commentsCollection = database.collection("comments");
    const blogsCollection = database.collection("blogs");
    const postsCollection = database.collection("posts");
    const likesCollection = database.collection("likes");
    const dislikesCollection = database.collection("dislikes");

    // All Operations By Nur
    // Import and use the separated route
    const Nur = require("./Nur/Nur")(usersCollection);
    app.use(Nur);

    // End Of All Operations By Nur

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


    //post

    app.post("/main-posts", async (req, res) => {
      try {
        const { title, tags, body, link, images,userEmail,username,profilePicture, } = req.body;

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
          likes : 0,
          dislikes : 0,
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
    app.post("/postComment", async (req, res) => {
      try {
        const {contentId,comment,userName,userImage,likeCount,disLikeCount,replyCount,parentId} = req.body;

        // Insert the post into MongoDB
        const result = await commentsCollection.insertOne({
          contentId,
          comment,
          userName,
          userImage,
          likeCount,
          disLikeCount,
          replyCount,
          parentId,
          createdAt: new Date(), // Optional: To track when the post was created
        });

        res.status(200).send(result)
      } catch (error) {
        console.error("Error adding post:", error);
        res.status(500).json({ message: "Failed to add post" });
      }
    });
    app.post("/postReply", async (req, res) => {
      try {
        const {contentId,reply,userName,userImage,likeCount,disLikeCount,replyCount,parentId} = req.body;

        // Insert the post into MongoDB
        const result = await commentsCollection.insertOne({
          contentId,
          reply,
          userName,
          userImage,
          likeCount,
          disLikeCount,
          replyCount,
          parentId,
          createdAt: new Date(), // Optional: To track when the post was created
        });

        res.status(200).send(result)
      } catch (error) {
        console.error("Error adding post:", error);
        res.status(500).json({ message: "Failed to add post" });
      }
    });

    app.get('/getComments/:id',async(req,res)=>{
      const id= req.params.id;
      // const query = { contentId: new ObjectId(id)};
      // const query = { contentId: id};
      const query = {
        contentId: id,
        parentId: null
      };
      const result = await commentsCollection.find(query).toArray();
      res.send(result)
    })
    app.get('/getReplies/:id',async(req,res)=>{
      const id= req.params.id;
      // const query = { contentId: new ObjectId(id)};
      const query = { parentId: id};
      const result = await commentsCollection.find(query).toArray();
      res.send(result)
    })

    // get posts
    app.get("/main-posts", async (req, res) => {
      try {
        const posts = await postsCollection.find().toArray();
        res.status(200).json(posts);
      } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ message: "Failed to fetch posts" });
      }
    });

// get posts
    app.get('/get-posts',async(req,res)=>{
      const result = await postsCollection.find().toArray()
      res.send(result)
    })

    // get likes
    app.get('/get-likes',async(req,res)=>{
      const result = await likesCollection.find().toArray()
      res.send(result)
    })
    // get likes
    app.get('/get-dislikes',async(req,res)=>{
      const result = await dislikesCollection.find().toArray()
      res.send(result)
    })

  // post likes
  // app.post('/like/:id',async(req,res)=>{
  //   const{id} = req.params;
  //   const user = req.body.newuser;
  //   console.log(user);
  //   console.log('from server',id);
  //   const now = Date.now()
  //   const formattedDateTime = format(now, 'EEEE, MMMM dd, yyyy, hh:mm a');
  //   const query1={_id:new ObjectId(id)}
  //   const query2={email:user.email};
  //   const query3 = {postId : id}
  //   const forLike = await postsCollection.findOne(query1)
  //   const likesInfo={
  //     postId:id,
  //     ...user,
  //     likeTime:formattedDateTime
  //   }
   
  //   const updateDoc1={
  //     $set:{likes:forLike.likes+1}
  //   }
  //   const updateDoc2={
  //     $set:{likes:forLike.likes-1}
  //   }
  //   const result5 = await likesCollection.findOne(query3);
  //   // res.send(result5)

    
  //   if(result5 && result5.email == user?.email){
  //     const result3 = likesCollection.deleteOne(query2);
  //     const result4 = await postsCollection.updateOne(query1,updateDoc2)
  //     // return res.send({result3,result4}) 
  //   }
  //   const result1 = await postsCollection.updateOne(query1,updateDoc1)
     
  //   const result = await likesCollection.insertOne(likesInfo);
  //   res.send({result,result1})
  //   // res.send({id,user,userName})
  // })

  // like
  app.post('/like/:id', async (req, res) => {
    try {
      const { id } = req.params; // Post ID
      const user = req.body.newuser; // User information from request body
  
      console.log('User:', user);
      console.log('Post ID:', id);
  
      const now = Date.now();
      const formattedDateTime = format(now, 'EEEE, MMMM dd, yyyy, hh:mm a');
  
      const query1 = { _id: new ObjectId(id) }; // Query to find the post by ID
      const query3 = { postId: id, email: user.email }; // Query to check if the user liked this post
  
      const forLike = await postsCollection.findOne(query1); // Finding the post
  
      if (!forLike) {
        return res.status(404).send({ message: 'Post not found', success: false });
      }
  
      const likesInfo = {
        postId: id,
        ...user,
        likeTime: formattedDateTime,
      };
  
      const result5 = await likesCollection.findOne(query3); // Checking if the user already liked the post
      const result6 = await dislikesCollection.findOne(query3); // Checking if the user already disliked the post
  
      if (result5) {
        // User has already liked the post, so remove the like
        await likesCollection.deleteOne(query3); // Remove like from likesCollection
        await postsCollection.updateOne(query1, { $inc: { likes: -1 } }); // Decrease like count in postsCollection
        return res.send({ message: 'Like removed', success: true });
      }
  
      if (result6) {
        // If user disliked before, remove the dislike and add a like
        await dislikesCollection.deleteOne(query3);
        await postsCollection.updateOne(query1, { $inc: { dislikes: -1, likes: 1 } });
        const result = await likesCollection.insertOne(likesInfo); // Add like to likesCollection
        return res.send({ result, message: 'Like added and dislike removed', success: true });
      }
  
      // If the user has not liked or disliked the post yet
      await postsCollection.updateOne(query1, { $inc: { likes: 1 } }); // Increase like count in postsCollection
      const result = await likesCollection.insertOne(likesInfo); // Add like to likesCollection
  
      res.send({ result, message: 'Like added', success: true });
  
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: 'An error occurred', success: false });
    }
  });
  
  // Dislike route
  app.post('/dislike/:id', async (req, res) => {
    try {
      const { id } = req.params; // Post ID
      const user = req.body.newuser; // User information from request body
  
      console.log('User:', user);
      console.log('Post ID:', id);
  
      const now = Date.now();
      const formattedDateTime = format(now, 'EEEE, MMMM dd, yyyy, hh:mm a');
  
      const query1 = { _id: new ObjectId(id) }; // Query to find the post by ID
      const query3 = { postId: id, email: user.email }; // Query to check if the user disliked this post
  
      const forLike = await postsCollection.findOne(query1); // Finding the post
  
      if (!forLike) {
        return res.status(404).send({ message: 'Post not found', success: false });
      }
  
      const dislikesInfo = {
        postId: id,
        ...user,
        dislikeTime: formattedDateTime,
      };
  
      const result5 = await dislikesCollection.findOne(query3); // Checking if the user already disliked the post
      const result6 = await likesCollection.findOne(query3); // Checking if the user liked the post
  
      if (result5) {
        // User has already disliked the post, so remove the dislike
        await dislikesCollection.deleteOne(query3); // Remove dislike from dislikesCollection
        await postsCollection.updateOne(query1, { $inc: { dislikes: -1 } }); // Decrease dislike count in postsCollection
        return res.send({ message: 'Dislike removed', success: true });
      }
  
      if (result6) {
        // If user liked before, remove the like and add a dislike
        await likesCollection.deleteOne(query3);
        await postsCollection.updateOne(query1, { $inc: { likes: -1, dislikes: 1 } });
        const result = await dislikesCollection.insertOne(dislikesInfo);
        return res.send({ result, message: 'Dislike added and like removed', success: true });
      }
  
      // If the user has not liked or disliked the post yet
      await postsCollection.updateOne(query1, { $inc: { dislikes: 1 } }); // Increase dislike count in postsCollection
      const result = await dislikesCollection.insertOne(dislikesInfo); // Add dislike to dislikesCollection
  
      res.send({ result, message: 'Dislike added', success: true });
  
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: 'An error occurred', success: false });
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
