const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { format } = require("date-fns");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "https://devdive1.netlify.app/",
    ],
    credentials: true,
  })
);
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
    const followersCollection = database.collection("followers");
    const chatbotquestionsCollection = database.collection("chatbotquestions");

    // All Operations By Nur
    // Import Route
    const SignModal = require("./Nur/SignModal")(usersCollection);
    const LeaderBoard = require("./Nur/LeaderBoard")(
      postsCollection,
      likesCollection,
      commentsCollection
    );

    // Use Route
    app.use(SignModal);
    app.use(LeaderBoard);

    // End Of All Operations By Nur

    // get users from database
    app.get("/get-users", async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    });
    // get users by email
    // app.get('/one-user',async(req,res)=>{
    //   const email = req.query.email;

    //   res.send(result)
    // })

    app.get("/one-user", async (req, res) => {
      const email = req.query.email; // Get the email from the query parameter
      const query = { email: email };

      try {
        // Query to find the users who follow the given user
        const followersQuery = { followingEmail: email };
        const followers = await followersCollection
          .find(followersQuery)
          .toArray();
        const mainuser = await usersCollection.findOne(query);

        // Query to find the people the given user is following
        const followingQuery = { followerEmail: email };
        const following = await followersCollection
          .find(followingQuery)
          .toArray();

        // Send the results including the count of followers and following
        res.send({
          mainuser,
          followers, // List of people who follow the user
          following, // List of people the user is following
          totalFollowers: followers.length, // Total number of followers
          totalFollowing: following.length, // Total number of people the user is following
        });
      } catch (error) {
        console.error("Error fetching followers and following:", error);
        res.status(500).send({ message: "Internal server error" });
      }
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
        const {
          title,
          tags,
          body,
          link,
          images,
          userEmail,
          username,
          profilePicture,
        } = req.body;

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
          likes: 0,
          dislikes: 0,
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
        const {
          contentId,
          comment,
          userName,
          userImage,
          likeCount,
          disLikeCount,
          replyCount,
          parentId,
        } = req.body;

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

        res.status(200).send(result);
      } catch (error) {
        console.error("Error adding post:", error);
        res.status(500).json({ message: "Failed to add post" });
      }
    });
    app.post("/postReply", async (req, res) => {
      try {
        const {
          contentId,
          reply,
          userName,
          userImage,
          likeCount,
          disLikeCount,
          replyCount,
          parentId,
        } = req.body;

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

        res.status(200).send(result);
      } catch (error) {
        console.error("Error adding post:", error);
        res.status(500).json({ message: "Failed to add post" });
      }
    });

    app.get("/getComments/:id", async (req, res) => {
      const id = req.params.id;
      // const query = { contentId: new ObjectId(id)};
      // const query = { contentId: id};
      const query = {
        contentId: id,
        parentId: null,
      };
      const result = await commentsCollection.find(query).toArray();
      res.send(result);
    });
    app.get("/getReplies/:id", async (req, res) => {
      const id = req.params.id;
      // const query = { contentId: new ObjectId(id)};
      const query = { parentId: id };
      const result = await commentsCollection.find(query).toArray();
      res.send(result);
    });

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
    app.get("/get-posts", async (req, res) => {
      const result = await postsCollection.find().toArray();
      res.send(result);
    });

    // get likes
    app.get("/get-likes", async (req, res) => {
      const result = await likesCollection.find().toArray();
      res.send(result);
    });
    // get likes
    app.get("/get-dislikes", async (req, res) => {
      const result = await dislikesCollection.find().toArray();
      res.send(result);
    });

    // like
    app.post("/like/:id", async (req, res) => {
      try {
        const { id } = req.params; 
        const user = req.body.newuser; 
        console.log("User:", user);
        console.log("Post ID:", id);

        const now = Date.now();
        const formattedDateTime = format(now, "EEEE, MMMM dd, yyyy, hh:mm a");

        const query1 = { _id: new ObjectId(id) }; // Query to find the post by ID
        const query3 = { postId: id, email: user.email }; // Query to check if the user liked this post

        const forLike = await postsCollection.findOne(query1); // Finding the post

        if (!forLike) {
          return res
            .status(404)
            .send({ message: "Post not found", success: false });
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
          return res.send({ message: "Like removed", success: true });
        }

        if (result6) {
          // If user disliked before, remove the dislike and add a like
          await dislikesCollection.deleteOne(query3);
          await postsCollection.updateOne(query1, {
            $inc: { dislikes: -1, likes: 1 },
          });
          const result = await likesCollection.insertOne(likesInfo); // Add like to likesCollection
          return res.send({
            result,
            message: "Like added and dislike removed",
            success: true,
          });
        }

        // If the user has not liked or disliked the post yet
        await postsCollection.updateOne(query1, { $inc: { likes: 1 } }); // Increase like count in postsCollection
        const result = await likesCollection.insertOne(likesInfo); // Add like to likesCollection

        res.send({ result, message: "Like added", success: true });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "An error occurred", success: false });
      }
    });

    // Dislike route
    app.post("/dislike/:id", async (req, res) => {
      try {
        const { id } = req.params; // Post ID
        const user = req.body.newuser; // User information from request body

        const now = Date.now();
        const formattedDateTime = format(now, "EEEE, MMMM dd, yyyy, hh:mm a");

        const query1 = { _id: new ObjectId(id) }; // Query to find the post by ID
        const query3 = { postId: id, email: user.email }; // Query to check if the user disliked this post

        const forLike = await postsCollection.findOne(query1); // Finding the post

        if (!forLike) {
          return res
            .status(404)
            .send({ message: "Post not found", success: false });
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
          return res.send({ message: "Dislike removed", success: true });
        }

        if (result6) {
          // If user liked before, remove the like and add a dislike
          await likesCollection.deleteOne(query3);
          await postsCollection.updateOne(query1, {
            $inc: { likes: -1, dislikes: 1 },
          });
          const result = await dislikesCollection.insertOne(dislikesInfo);
          return res.send({
            result,
            message: "Dislike added and like removed",
            success: true,
          });
        }

        // If the user has not liked or disliked the post yet
        await postsCollection.updateOne(query1, { $inc: { dislikes: 1 } }); // Increase dislike count in postsCollection
        const result = await dislikesCollection.insertOne(dislikesInfo); // Add dislike to dislikesCollection

        res.send({ result, message: "Dislike added", success: true });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "An error occurreds", success: false });
      }
    });

    // follow / unfollow

    app.post("/follow/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const user = req.body.newuser;

        // Prepare follow time
        const now = Date.now();
        const formattedDateTime = format(now, "EEEE, MMMM dd, yyyy, hh:mm a");

        // Fetch the post details by postId
        const post = await postsCollection.findOne({ _id: new ObjectId(id) });

        if (!post) {
          return res.status(404).send({ message: "Post not found" });
        }

        // Check if the user is already following the post's author
        const queryForExistingFollow = {
          postId: id,
          followerEmail: user.email,
        };
        const existingFollow = await followersCollection.findOne(
          queryForExistingFollow
        );

        const queryForPostOwner = { email: post.userEmail }; // Find the post owner's details

        if (existingFollow) {
          // Unfollow logic: delete the follow record and decrement follower count
          await Promise.all([
            followersCollection.deleteOne(queryForExistingFollow),
            usersCollection.updateOne(queryForPostOwner, {
              $inc: { followers: -1 },
            }), // Correct field name
          ]);
          return res.status(200).send({ message: "Unfollowed successfully" });
        } else {
          // Follow logic: insert a new follower record and increment follower count
          const followInfo = {
            following: post.username,
            followingEmail: post.userEmail,
            followingPhoto: post.profilePicture,
            postId: id,
            followerName: user.name,
            followerEmail: user.email,
            followerPhoto: user.photo,
            followTime: formattedDateTime,
          };

          await followersCollection.insertOne(followInfo);
          await usersCollection.updateOne(queryForPostOwner, {
            $inc: { followers: 1 },
          }); // Correct field name
          return res.status(200).send({ message: "Followed successfully" });
        }
      } catch (error) {
        console.error("Error in /follow/:id:", error);
        res
          .status(500)
          .send({ message: "Internal Server Error", error: error.message });
      }
    });

    // get followers

    app.get("/get-followers", async (req, res) => {
      const result = await followersCollection.find().toArray();
      res.send(result);
    });

    // followers in a list

    app.get("/followers/all", async (req, res) => {
      try {
        const followersList = await followersCollection
          .aggregate([
            {
              $group: {
                _id: "$following",
                followers: {
                  $push: {
                    postBy: "$postBy",
                    name: "$name",
                    email: "$email",
                    photo: "$photo",
                    followTime: "$followTime",
                  },
                },
              },
            },
            {
              $project: {
                _id: 0,
                user: "$_id",
                followers: 1,
              },
            },
          ])
          .toArray();
        res.send(followersList);
      } catch (error) {
        res.send({ error: "Server error occurred" });
      }
    });

    // chatbot ans get

    async function getAnswerFromDB(userQuestion) {
      const result = await chatbotquestionsCollection.findOne({
        question: { $regex: new RegExp(userQuestion, "i") },
      }); // Case-insensitive search
      return result ? result.answer : null; // Return answer if found
    }

    // API route to fetch answer based on user question
    app.get("/api/getAnswer", async (req, res) => {
      const userQuestion = req.query.question; // Get the question from the query parameters

      if (!userQuestion) {
        return res.status(400).json({ message: "Question is required!" }); // Return an error if no question is provided
      }

      try {
        const answer = await getAnswerFromDB(userQuestion); // Fetch the answer from the database
        if (answer) {
          res.json({ answer }); // Return the answer if found
        } else {
          res
            .status(404)
            .json({ message: "Answer not found for that question." }); // Return a not found error
        }
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error." }); // Return a server error if something goes wrong
      }
    });

    // search

    app.get("/posts/search/post", async (req, res) => {
      const search = req.query.search;

      if (!search) {
        return res.status(400).send({ error: "Search query is required" });
      }

      // console.log(`Search query: ${search}`);

      const query = { title: { $regex: search, $options: "i" } };

      try {
        const result = await postsCollection.find(query).toArray();
        res.send(result);
      } catch (error) {
        console.error("Error retrieving posts:", error);
        res
          .status(500)
          .send({ error: "An error occurred while searching for posts" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log("DevDive successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

// mongodb
app.get("/", (req, res) => {
  res.send("DevDive is  on the way");
});

app.listen(port, () => {
  console.log(`DevDive is running on:${port}`);
});
