const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { format } = require("date-fns");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();

// Middleware
// app.use(cors());

// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173",
//       "http://localhost:5174",
//       "http://localhost:5175",
//       "http://localhost:5176",
//       "https://d...content-available-to-author-only...y.app/",
//       "https://d...content-available-to-author-only...y.app",
//       "https://0...content-available-to-author-only...l.app/",
//       "https://0...content-available-to-author-only...l.app",
//     ],
//     credentials: true,
//     optionSuccessStatus: 200,
//   })
// );

const corsOptions = {
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "https://d...content-available-to-author-only...y.app/",
    "https://d...content-available-to-author-only...y.app",
    "https://0...content-available-to-author-only...l.app/",
    "https://0...content-available-to-author-only...l.app",
  ],
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

// app.use((req, res, next) => {
//   res.setHeader(
//     "Content-Security-Policy",
//     "default-src 'self'; script-src 'self' https://v...content-available-to-author-only...l.live; style-src 'self' 'unsafe-inline';"
//   );
//   next();
// });

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
    const commentLikesCollection = database.collection("commentLikeCollection");
    const commentDislikesCollection = database.collection(
      "commentDislikeCollection"
    );
    const followersCollection = database.collection("followers");
    const chatbotquestionsCollection = database.collection("chatbotquestions");

    const messagesCollection = database.collection("messages");
    const videoCallCollection = database.collection("videoCall");

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
          poll,
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
          poll,
          likes: 0,
          dislikes: 0,
          comments: 0,
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
          userEmail,
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
          userEmail,
          userImage,
          likeCount,
          disLikeCount,
          replyCount,
          parentId,
          createdAt: new Date(), // Optional: To track when the post was created
        });
        const query1 = { _id: new ObjectId(contentId) };
        const findComment = await postsCollection.findOne(query1); // Finding the post

        if (!findComment) {
          return res
            .status(404)
            .send({ message: "Post not found", success: false });
        }
        const updateComment = await postsCollection.updateOne(query1, {
          $inc: { comments: 1 },
        });
        if (!updateComment) {
          return res
            .status(404)
            .send({ message: "commentCount was not updated", success: false });
        }
        res.status(200).send(result);
      } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ message: "Failed to add comment" });
      }
    });
    app.post("/postReply", async (req, res) => {
      try {
        const {
          contentId,
          reply,
          userName,
          userEmail,
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
          userEmail,
          userImage,
          likeCount,
          disLikeCount,
          replyCount,
          parentId,
          createdAt: new Date(), // Optional: To track when the post was created
        });
        const query1 = { _id: new ObjectId(contentId) };
        const findComment = await postsCollection.findOne(query1); // Finding the post

        if (!findComment) {
          return res
            .status(404)
            .send({ message: "Post not found", success: false });
        }
        const updateComment = await postsCollection.updateOne(query1, {
          $inc: { comments: 1 },
        });
        if (!updateComment) {
          return res
            .status(404)
            .send({ message: "commentCount was not updated", success: false });
        }
        res.status(200).send(result);
      } catch (error) {
        console.error("Error adding reply:", error);
        res.status(500).json({ message: "Failed to add reply" });
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
    app.get("/getPost/:id", async (req, res) => {
      const id = req.params.id;
      // const query = { contentId: new ObjectId(id)};
      const query = { _id: new ObjectId(id) };
      const result = await postsCollection.findOne(query);
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
    app.get("/getCommentLikes", async (req, res) => {
      const result = await commentLikesCollection.find().toArray();
      res.send(result);
    });
    // get likes
    app.get("/get-dislikes", async (req, res) => {
      const result = await dislikesCollection.find().toArray();
      res.send(result);
    });
    app.get("/getCommentDislikes", async (req, res) => {
      const result = await commentDislikesCollection.find().toArray();
      res.send(result);
    });

    // get All Comments
    app.get("/getComments", async (req, res) => {
      // const query = {
      //   parentId: null,
      // };
      const result = await commentsCollection.find().toArray();
      res.send(result);
    });

    // like
    // app.post("/like/:id", async (req, res) => {
    //   try {
    //     const { id } = req.params;
    //     const user = req.body.newuser;
    //     console.log("User:", user);
    //     console.log("Post ID:", id);

    //     const now = Date.now();
    //     const formattedDateTime = format(now, "EEEE, MMMM dd, yyyy, hh:mm a");

    //     const query1 = { _id: new ObjectId(id) }; // Query to find the post by ID
    //     const query3 = { postId: id, email: user.email }; // Query to check if the user liked this post

    //     const forLike = await postsCollection.findOne(query1); // Finding the post

    //     if (!forLike) {
    //       return res
    //         .status(404)
    //         .send({ message: "Post not found", success: false });
    //     }

    //     const likesInfo = {
    //       postId: id,
    //       ...user,
    //       likeTime: formattedDateTime,
    //     };

    //     const result5 = await likesCollection.findOne(query3); // Checking if the user already liked the post
    //     const result6 = await dislikesCollection.findOne(query3); // Checking if the user already disliked the post

    //     if (result5) {
    //       // User has already liked the post, so remove the like
    //       await likesCollection.deleteOne(query3); // Remove like from likesCollection
    //       await postsCollection.updateOne(query1, { $inc: { likes: -1 } }); // Decrease like count in postsCollection
    //       return res.send({ message: "Like removed", success: true });
    //     }

    //     if (result6) {
    //       // If user disliked before, remove the dislike and add a like
    //       await dislikesCollection.deleteOne(query3);
    //       await postsCollection.updateOne(query1, {
    //         $inc: { dislikes: -1, likes: 1 },
    //       });
    //       const result = await likesCollection.insertOne(likesInfo); // Add like to likesCollection
    //       return res.send({
    //         result,
    //         message: "Like added and dislike removed",
    //         success: true,
    //       });
    //     }

    //     // If the user has not liked or disliked the post yet
    //     await postsCollection.updateOne(query1, { $inc: { likes: 1 } }); // Increase like count in postsCollection
    //     const result = await likesCollection.insertOne(likesInfo); // Add like to likesCollection

    //     res.send({ result, message: "Like added", success: true });
    //   } catch (error) {
    //     console.error(error);
    //     res.status(500).send({ message: "An error occurred", success: false });
    //   }
    // });

    app.post("/like/:id", async (req, res) => {
      try {
        const { id } = req.params; // Post ID from params
        const user = req.body.newUser; // User info from request body

        const now = Date.now();
        const formattedDateTime = format(now, "EEEE, MMMM dd, yyyy, hh:mm a");

        const query1 = { _id: new ObjectId(id) }; // Find the post by ID
        const query3 = { postId: id, email: user.email }; // Check if the user interacted with this post

        const post = await postsCollection.findOne(query1); // Retrieve the post

        if (!post) {
          return res
            .status(404)
            .send({ message: "Post not found", success: false });
        }

        const result5 = await likesCollection.findOne(query3); // Check if the user liked the post
        const result6 = await dislikesCollection.findOne(query3); // Check if the user disliked the post

        if (result5) {
          // If the user already liked the post, remove the like
          await likesCollection.deleteOne(query3); // Remove like
          await postsCollection.updateOne(query1, { $inc: { likes: -1 } }); // Decrease like count
          return res.send({ message: "Like removed", success: true });
        }

        if (result6) {
          // If the user previously disliked, remove the dislike and add a like
          await dislikesCollection.deleteOne(query3); // Remove dislike
          await postsCollection.updateOne(query1, {
            $inc: { dislikes: -1, likes: 1 },
          }); // Update counts

          const likeInfo = {
            postId: id,
            ...user,
            likeTime: formattedDateTime,
            type: "like",
          };
          await likesCollection.insertOne(likeInfo); // Add like
          return res.send({
            message: "Like added and dislike removed",
            success: true,
          });
        }

        // If the user hasn't liked or disliked yet, add a like
        await postsCollection.updateOne(query1, { $inc: { likes: 1 } }); // Increase like count
        const likeInfo = {
          postId: id,
          ...user,
          likeTime: formattedDateTime,
          type: "like",
        };
        await likesCollection.insertOne(likeInfo); // Add like to collection

        res.send({ message: "Like added", success: true });
      } catch (error) {
        console.error("Error in like operation:", error); // Log any errors
        res.status(500).send({ message: "An error occurred", success: false }); // Return error response
      }
    });

    app.post("/commentLike/:id", async (req, res) => {
      try {
        const { id } = req.params; // comment ID
        const user = req.body.newuser; // User information from request body

        console.log("User:", user);
        console.log("comment ID:", id);

        const now = Date.now();
        const formattedDateTime = format(now, "EEEE, MMMM dd, yyyy, hh:mm a");

        const query1 = { _id: new ObjectId(id) }; // Query to find the comment by ID
        const query3 = { commentId: id, email: user.email }; // Query to check if the user liked this post

        const forLike = await commentsCollection.findOne(query1); // Finding the post

        if (!forLike) {
          return res
            .status(404)
            .send({ message: "comment not found", success: false });
        }

        const likesInfo = {
          commentId: id,
          ...user,
          likeTime: formattedDateTime,
        };

        const result5 = await commentLikesCollection.findOne(query3); // Checking if the user already liked the post
        const result6 = await commentDislikesCollection.findOne(query3); // Checking if the user already disliked the post

        if (result5) {
          // User has already liked the post, so remove the like
          await commentLikesCollection.deleteOne(query3); // Remove like from likesCollection
          await commentsCollection.updateOne(query1, {
            $inc: { likeCount: -1 },
          }); // Decrease like count in postsCollection
          return res.send({ message: "Like removed", success: true });
        }

        if (result6) {
          // If user disliked before, remove the dislike and add a like
          await commentDislikesCollection.deleteOne(query3);
          await commentsCollection.updateOne(query1, {
            $inc: { disLikeCount: -1, likeCount: 1 },
          });
          const result = await commentLikesCollection.insertOne(likesInfo); // Add like to likesCollection
          return res.send({
            result,
            message: "Like added and dislike removed",
            success: true,
          });
        }

        // If the user has not liked or disliked the post yet
        await commentsCollection.updateOne(query1, { $inc: { likeCount: 1 } }); // Increase like count in commentsCollection
        const result = await commentLikesCollection.insertOne(likesInfo); // Add like to likesCollection

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
        const user = req.body.newUser; // User information from request body

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
    // Dislike route
    app.post("/commentDislike/:id", async (req, res) => {
      try {
        const { id } = req.params; // Post ID
        const user = req.body.newuser; // User information from request body

        const now = Date.now();
        const formattedDateTime = format(now, "EEEE, MMMM dd, yyyy, hh:mm a");

        const query1 = { _id: new ObjectId(id) }; // Query to find the post by ID
        const query3 = { commentId: id, email: user.email }; // Query to check if the user disliked this post

        const forLike = await commentsCollection.findOne(query1); // Finding the post
        console.log("comment found");

        if (!forLike) {
          return res
            .status(404)
            .send({ message: "comment not found", success: false });
        }

        const dislikesInfo = {
          commentId: id,
          ...user,
          dislikeTime: formattedDateTime,
        };

        const result5 = await commentDislikesCollection.findOne(query3); // Checking if the user already disliked the post
        // if(result5){
        console.log(result5);
        // }
        const result6 = await commentLikesCollection.findOne(query3); // Checking if the user liked the post
        if (result6) {
       
        }
        if (result5) {
          // User has already disliked the post, so remove the dislike
          await commentDislikesCollection.deleteOne(query3); // Remove dislike from commentDislikesCollection
          await commentsCollection.updateOne(query1, {
            $inc: { disLikeCount: -1 },
          }); // Decrease dislike count in postsCollection
       
          return res.send({ message: "Dislike removed", success: true });
        }

        if (result6) {
          // If user liked before, remove the like and add a dislike
          await commentLikesCollection.deleteOne(query3);
          await commentsCollection.updateOne(query1, {
            $inc: { likeCount: -1, disLikeCount: 1 },
          });
          const result = await commentDislikesCollection.insertOne(
            dislikesInfo
          );
          return res.send({
            result,
            message: "Dislike added and like removed",
            success: true,
          });
        }

        // If the user has not liked or disliked the post yet
        await commentsCollection.updateOne(query1, {
          $inc: { disLikeCount: 1 },
        }); // Increase dislike count in postsCollection
        const result = await commentDislikesCollection.insertOne(dislikesInfo); // Add dislike to commentDislikesCollection

        res.send({ result, message: "Dislike added", success: true });
      } catch (error) {
        console.error(error);
        res.status(500).send({ message: "An error occurred", success: false });
      }
    });

    // follow / unfollow
    app.post("/follow/:id", async (req, res) => {
      try {
        const { id } = req.params;
        const user = req.body.newuser;

        if (!user || !user.email) {
          return res.status(400).send({ message: "Invalid user data" });
        }

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
        const queryForPostOwner = { email: post.userEmail };

        if (existingFollow) {
          // Unfollow logic: delete the follow record and decrement follower count
          const session = client.startSession(); // Start a session to ensure atomicity
          try {
            session.startTransaction();

            await followersCollection.deleteOne(queryForExistingFollow, {
              session,
            });
            await usersCollection.updateOne(
              queryForPostOwner,
              {
                $inc: {
                  followers: -1,
                },
              },
              { session }
            );

            await session.commitTransaction();
            return res.status(200).send({ message: "Unfollowed successfully" });
          } catch (error) {
            await session.abortTransaction();
            throw error;
          } finally {
            session.endSession();
          }
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

          const session = client.startSession(); // Start a session for follow logic
          try {
            session.startTransaction();

            await followersCollection.insertOne(followInfo, { session });
            await usersCollection.updateOne(
              queryForPostOwner,
              { $inc: { followers: 1 } },
              { session }
            );

            await session.commitTransaction();
            return res.status(200).send({ message: "Followed successfully" });
          } catch (error) {
            await session.abortTransaction();
            throw error;
          } finally {
            session.endSession();
          }
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

    // Fetch all followers grouped by following user
    app.get("/followers/all", async (req, res) => {
      try {
        const followersList = await followersCollection
          .aggregate([
            {
              $group: {
                _id: "$followingEmail", // Group by followingEmail
                followingName: { $first: "$following" }, // Get the following user's name
                followingPhoto: { $first: "$followingPhoto" }, // Get the following user's photo
                followers: {
                  $push: {
                    name: "$followerName", // Follower's name
                    email: "$followerEmail", // Follower's email
                    photo: "$followerPhoto", // Follower's photo
                    time: "$followTime", // Follow time
                  },
                },
              },
            },
            {
              $project: {
                _id: 0, // Exclude _id
                email: "$_id", // Rename _id to email (followingEmail)
                name: "$followingName", // Include the following user's name
                photo: "$followingPhoto", // Include the following user's photo
                followers: 1, // Include followers array
              },
            },
          ])
          .toArray();

        // Send the resulting list as JSON
        res.status(200).json(followersList);
      } catch (error) {
        console.error("Error fetching followers:", error); // Log the error for debugging
        res.status(500).json({ error: "Server error occurred" }); // Send a 500 status on error
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

    // update user-info

    app.put("/users-update/:email", async (req, res) => {
      const { email } = req.params;
      const updatedUSerInfo = req.body;

      const updateDoc = {
        $set: {
          name: updatedUSerInfo.name,
          photoUrl: updatedUSerInfo.photoUrl,
          coverPhoto: updatedUSerInfo.coverPhoto,
        },
      };

      const query = { email: email };
      const result = await usersCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    //  delete user-post

    app.delete("/user-delete-post/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await postsCollection.deleteOne(query);
      res.send(result);
    });

    // get popular post

    app.get("/get-popular-posts", async (req, res) => {
      try {
        const result = await postsCollection
          .aggregate([
            {
              $addFields: {
                totalEngagement: { $add: ["$likes", "$comments"] },
              },
            },
            {
              $sort: { totalEngagement: -1 },
            },
          ])
          .toArray();

        res.send(result);
      } catch (error) {
        res.status(500).send("An error occurred while fetching posts");
      }
    });

    // Ruhul Amin

    // create jwt token
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });

      res.send({ token });
    });

    // get admin user data

    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;

      const query = { email: email };

      try {
        const user = await usersCollection.findOne(query);

        if (user) {
          const admin = user.role === "admin";
          return res.send({ admin });
        } else {
          return res.send({ admin: false });
        }
      } catch (error) {
        return res.status(500).send({ message: "Internal server error" });
      }
    });

    // End Ruhul Amin

    // post message

    app.post("/messages", async (req, res) => {
      const messageInfo = req.body;

      const result = await messagesCollection.insertOne(messageInfo);
      res.send(result);
    });
    // get -message for user
    app.post("/get-messages", async (req, res) => {
      const { sender, reciver } = req.body;

      const query = {
        $or: [
          { senderEmail: sender?.email, receiverEmail: reciver?.email },
          { senderEmail: reciver?.email, receiverEmail: sender?.email },
        ],
      };

      try {
        const result = await messagesCollection
          .find(query)
          .sort({ timestamp: 1 })
          .toArray(); // Sort by time if needed
        res.send(result);
      } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).send({ error: "Failed to fetch messages" });
      }
    });

    // delete message

    app.delete("/delete-message/:id", async (req, res) => {
      const { id } = req.params;

      const query = { _id: new ObjectId(id) };

      try {
        const result = await messagesCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).send({ error: "Failed to delete message" });
      }
    });

    // edit message

    app.put("/edit/:id", async (req, res) => {
      const { id } = req.params;
      const { message } = req.body;

      const query = { _id: new ObjectId(id) };

      // Find the message by ID and update it
      const updatedMessage = await messagesCollection.findOne(query);

      if (!updatedMessage) {
        return res.status(404).json({ error: "Message not found" });
      }

      const updatedDoc = {
        $set: {
          message: message,
        },
      };
      const result = await messagesCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    //edit comment
    app.put("/editComment/:id", async (req, res) => {
      const { id } = req.params;
      const { comment } = req.body;

      const query = { _id: new ObjectId(id) };

      // Find the message by ID and update it
      const updatedMessage = await commentsCollection.findOne(query);

      if (!updatedMessage) {
        return res.status(404).json({ error: "Message not found" });
      }

      const updatedDoc = {
        $set: {
          comment: comment,
        },
      };
      const result = await commentsCollection.updateOne(query, updatedDoc);
      res.send(result);
    });

    //delete Comment
    app.delete("/deleteComment/:id", async (req, res) => {
      const { id } = req.params;

      const query = { _id: new ObjectId(id) };
      const query2= {parentId: id}
      const commentToBeDeleted= await commentsCollection.findOne(query);
      const postId= commentToBeDeleted.contentId;
      const parentId= commentToBeDeleted.parentId;
      console.log(postId)

      try {
        const result = await commentsCollection.deleteOne(query);
        if(result ){
          const result2= await commentsCollection.deleteMany(query2)

          // if (!result2) {
          //   return res
          //     .status(404)
          //     .send({ message: "could not delete comments", success: false });
          // }
          const deletedComments= result2?.deletedCount +1 ;
          const query3 = { _id: new ObjectId(postId) }; // Query to find the post by ID
          const forLike = await postsCollection.findOne(query3); // Finding the post

          if (!forLike) {
            return res
              .status(404)
              .send({ message: "Post not found for updating comment count", success: false });
          }
          const result3= await postsCollection.updateOne(query3, { $inc: { comments: -deletedComments } });
           res.send(result3);
        }
        
      } catch (error) {
        console.error("Error deleting message:", error);
        res.status(500).send({ error: "Failed to delete message" });
      }
    });


    // get - following post 

    app.get("/get-following-posts/:email", async (req, res) => {
       const email = req.params.email;


        const query ={ followerEmail : email }
            const result = await followersCollection.find(query).toArray();
          
            if(result?.length){

              const followingEmails=  result?.map(follower=>follower?.followingEmail );
              const query2 = { userEmail: { $in: followingEmails } };
              const followingPosts= await postsCollection.find(query2).toArray();
              
             
              res.send(followingPosts);
            }
      

    })

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
