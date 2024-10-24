const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { format } = require("date-fns");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;
require("dotenv").config();
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
// const allowedOrigins = process.env.ALLOWED_ORIGINS;
const localhostRegex = /^http:\/\/localhost:\d{4}$/;
const SSLCommerzPayment = require("sslcommerz-lts");
const store_id = process.env.STORE_ID;
const store_passwd = process.env.STORE_PASS;
const is_live = false;

// Middleware

app.use(
  cors((req, callback) => {
    const origin = req.headers.origin || "null";

    const isPaymentRequest =
      origin === "null" &&
      (req.path.startsWith("/payment/success") ||
        req.path.startsWith("/payment/failed"));

    const isAllowed =
      isPaymentRequest ||
      localhostRegex.test(origin) ||
      allowedOrigins.includes(origin);

    if (isAllowed) {
      callback(null, {
        origin: origin,
        credentials: true,
        methods: "GET, POST, PUT, DELETE, OPTIONS",
        allowedHeaders:
          "Origin, X-Requested-With, Content-Type, Accept, Authorization",
      });
    } else {
      console.error("CORS blocked for origin:", origin);
      callback(new Error("Not allowed by CORS"), false);
    }
  })
);

// app.use(cors())

app.use(express.urlencoded({ limit: "10mb", extended: true }));
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
    const database = client.db("DevDive");

    // Database collection

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
    const archiveDataCollection = database.collection("archiveData");
    const reportDataCollection = database.collection("reportData");
    const notificationsCollection = database.collection("notifications");
    const paymentDataCollection = database.collection("paymentData");
    const mentorDataCollection = database.collection("mentorData");

    // All Operations By Nur

    // Import Route

    const SignModal = require("./Nur/SignModal")(usersCollection);
    const LeaderBoard = require("./Nur/LeaderBoard")(
      postsCollection,
      likesCollection,
      commentsCollection
    );
    const ArchiveData = require("./Nur/ArchiveData")(archiveDataCollection);
    const ReportData = require("./Nur/ReportData")(reportDataCollection);

    // Use Route

    app.use(SignModal);
    app.use(LeaderBoard);
    app.use(ArchiveData);
    app.use(ReportData);

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
    app.post("/postNotification", async (req, res) => {
      try {
        const {
          userEmail,
          message,
          isRead,
          relatedPostId,
          relatedUserEmail,
          relatedUserName,
          relatedUserPhoto,
          type,
        } = req.body;

        // Insert the post into MongoDB
        const result = await notificationsCollection.insertOne({
          userEmail,
          message,
          isRead,
          relatedPostId,
          relatedUserEmail,
          relatedUserName,
          relatedUserPhoto,
          type,
          createdAt: new Date(), // Optional: To track when the post was created
        });

        res.status(200).json({
          message: "notification added successfully",
          postId: result.insertedId,
        });
      } catch (error) {
        console.error("Error adding notification:", error);
        res.status(500).json({ message: "Failed to add notification" });
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

    app.get("/getNotifications/:email", async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const query = {
        userEmail: email,
      };
      const result = await notificationsCollection
        .find(query)
        .sort({ _id: -1 })
        .toArray();
      res.send(result);
      console.log(result);
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const posts = await postsCollection
          .find()
          .sort({ createdAt: -1 }) // Sort by createdAt in descending order
          .skip(skip)
          .limit(limit)
          .toArray();

        res.status(200).json(posts);
      } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ message: "Failed to fetch posts" });
      }
    });
    app.get("/random-posts", async (req, res) => {
      try {
        const limit = parseInt(req.query.limit) || 5;
        const page = parseInt(req.query.page) || 1;

        const randomPosts = await postsCollection
          .aggregate([
            { $sample: { size: limit * page } }, // Adjust size based on page
          ])
          .toArray();

        const paginatedPosts = randomPosts.slice(
          (page - 1) * limit,
          page * limit
        );

        res.status(200).json(paginatedPosts);
      } catch (error) {
        console.error("Error fetching random posts:", error);
        res.status(500).json({ message: "Failed to fetch random posts" });
      }
    });

    // get posts
    app.get("/get-posts", async (req, res) => {
      const result = await postsCollection.find().toArray();
      res.send(result);
    });

    // get users posts

    app.get("/user-posts/:email", async (req, res) => {
      const email = req.params.email;
      const result = await postsCollection.find({ userEmail: email }).toArray();
      res.send(result);
    });

    // get likes
    // app.get("/get-likes", async (req, res) => {
    //   const result = await likesCollection.find().toArray();
    //   res.send(result);
    // });
    app.get("/getCommentLikes", async (req, res) => {
      const result = await commentLikesCollection.find().toArray();
      res.send(result);
    });
    // get likes
    // app.get("/get-dislikes", async (req, res) => {
    //   const result = await dislikesCollection.find().toArray();
    //   res.send(result);
    // });
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

    // app.post("/like/:id", async (req, res) => {
    //   try {
    //     const { id } = req.params; // Post ID from params
    //     const user = req.body.newUser; // User info from request body

    //     const now = Date.now();
    //     const formattedDateTime = format(now, "EEEE, MMMM dd, yyyy, hh:mm a");

    //     const query1 = { _id: new ObjectId(id) }; // Find the post by ID
    //     const query3 = { postId: id, email: user.email }; // Check if the user interacted with this post

    //     const post = await postsCollection.findOne(query1); // Retrieve the post

    //     if (!post) {
    //       return res
    //         .status(404)
    //         .send({ message: "Post not found", success: false });
    //     }

    //     const result5 = await likesCollection.findOne(query3); // Check if the user liked the post
    //     const result6 = await dislikesCollection.findOne(query3); // Check if the user disliked the post

    //     if (result5) {
    //       // If the user already liked the post, remove the like
    //       await likesCollection.deleteOne(query3); // Remove like
    //       await postsCollection.updateOne(query1, { $inc: { likes: -1 } }); // Decrease like count
    //       return res.send({ message: "Like removed", success: true });
    //     }

    //     if (result6) {
    //       // If the user previously disliked, remove the dislike and add a like
    //       await dislikesCollection.deleteOne(query3); // Remove dislike
    //       await postsCollection.updateOne(query1, {
    //         $inc: { dislikes: -1, likes: 1 },
    //       }); // Update counts

    //       const likeInfo = {
    //         postId: id,
    //         ...user,
    //         likeTime: formattedDateTime,
    //         type: "like",
    //       };
    //       await likesCollection.insertOne(likeInfo); // Add like
    //       return res.send({
    //         message: "Like added and dislike removed",
    //         success: true,
    //       });
    //     }

    //     // If the user hasn't liked or disliked yet, add a like
    //     await postsCollection.updateOne(query1, { $inc: { likes: 1 } }); // Increase like count
    //     const likeInfo = {
    //       postId: id,
    //       ...user,
    //       likeTime: formattedDateTime,
    //       type: "like",
    //     };
    //     await likesCollection.insertOne(likeInfo); // Add like to collection

    //     res.send({ message: "Like added", success: true });
    //   } catch (error) {
    //     console.error("Error in like operation:", error); // Log any errors
    //     res.status(500).send({ message: "An error occurred", success: false }); // Return error response
    //   }
    // });

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

 
    app.post("/follow/:id", async (req, res) => {
      const session = client.startSession(); // Start a session to maintain atomicity
    
      try {
        const { id } = req.params;
        const user = req.body.newuser;
    
        // Validate user input and ObjectId
        if (!user || !user.email) {
          return res.status(400).send({ message: "Invalid user data" });
        }
        if (!ObjectId.isValid(id)) {
          return res.status(400).send({ message: "Invalid post ID" });
        }
    
        const now = Date.now();
        const formattedDateTime = format(now, "EEEE, MMMM dd, yyyy, hh:mm a");
    
        // Fetch the post details by postId
        const post = await postsCollection.findOne({ _id: new ObjectId(id) });
    
        if (!post) {
          return res.status(404).send({ message: "Post not found" });
        }
    
        // Define query to check if the user is already following the post's author
        const queryForExistingFollow = {
          postId: id,
          followerEmail: user.email,
        };
        const queryForPostOwner = { email: post.userEmail };
    
        await session.startTransaction(); // Start transaction
    
        const existingFollow = await followersCollection.findOne(queryForExistingFollow, { session });
    
        if (existingFollow) {
          // Unfollow logic
          await followersCollection.deleteOne(queryForExistingFollow, { session });
          await usersCollection.updateOne(
            queryForPostOwner,
            { $inc: { followers: -1 } },
            { session }
          );
    
          await session.commitTransaction();
          return res.status(200).send({ message: "Unfollowed successfully" });
        } else {
          // Follow logic: Check once more to avoid duplicate follow
          const followAlreadyExists = await followersCollection.findOne(queryForExistingFollow, { session });
          if (followAlreadyExists) {
            await session.abortTransaction(); // Abort if follow was added during the transaction
            return res.status(409).send({ message: "Already following" });
          }
    
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
    
          await followersCollection.insertOne(followInfo, { session });
          await usersCollection.updateOne(
            queryForPostOwner,
            { $inc: { followers: 1 } },
            { session }
          );
    
          await session.commitTransaction();
          return res.status(200).send({ message: "Followed successfully" });
        }
      } catch (error) {
        console.error("Error in /follow/:id:", error);
        await session.abortTransaction();
        res.status(500).send({ message: "Internal Server Error", error: error.message });
      } finally {
        session.endSession();
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
    //  delete Notification

    app.delete("/deleteNotification/:id", async (req, res) => {
      const { id } = req.params;
      // console.log(id)
      const query = { _id: new ObjectId(id) };
      const result = await notificationsCollection.deleteOne(query);
      res.send(result);
    });
    app.delete("/deleteAllNotification/:email", async (req, res) => {
      const { email } = req.params;
      console.log(email);
      const query = { userEmail: email };
      const result = await notificationsCollection.deleteMany(query);
      res.send(result);
    });

    // get popular post

    app.get("/get-popular-posts", async (req, res) => {
      const { page = 1, limit = 10 } = req.query; // default page=1, limit=10

      try {
        const result = await postsCollection
          .aggregate([
            {
              $addFields: {
                totalLikes: { $size: "$likes" }, // Count the number of likes in the array
                totalEngagement: { $add: [{ $size: "$likes" }, "$comments"] }, // Sum of likes (as count) and comments
              },
            },
            {
              $sort: { totalEngagement: -1 }, // Sort by total engagement (likes + comments)
            },
            {
              $skip: (page - 1) * limit, // Skip posts for previous pages
            },
            {
              $limit: parseInt(limit), // Limit posts per page
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
      const query2 = { parentId: id };
      const commentToBeDeleted = await commentsCollection.findOne(query);
      const postId = commentToBeDeleted.contentId;
      const parentId = commentToBeDeleted.parentId;
      console.log(postId);

      try {
        const result = await commentsCollection.deleteOne(query);
        if (result) {
          const result2 = await commentsCollection.deleteMany(query2);

          // if (!result2) {
          //   return res
          //     .status(404)
          //     .send({ message: "could not delete comments", success: false });
          // }
          const deletedComments = result2?.deletedCount + 1;
          const query3 = { _id: new ObjectId(postId) }; // Query to find the post by ID
          const forLike = await postsCollection.findOne(query3); // Finding the post

          if (!forLike) {
            return res.status(404).send({
              message: "Post not found for updating comment count",
              success: false,
            });
          }
          const result3 = await postsCollection.updateOne(query3, {
            $inc: { comments: -deletedComments },
          });
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

      const query = { followerEmail: email };
      const result = await followersCollection.find(query).toArray();

      if (result?.length) {
        const followingEmails = result?.map(
          (follower) => follower?.followingEmail
        );
        const query2 = { userEmail: { $in: followingEmails } };
        const followingPosts = await postsCollection.find(query2).toArray();

        res.send(followingPosts);
      }
    });

    // poll
    app.put("/posts/:id/poll/vote", async (req, res) => {
      const { id } = req.params;
      const { pollItem, email } = req.body;
      const sanitizedEmail = email.replace(/\./g, "_");

      try {
        const post = await postsCollection.findOne({ _id: new ObjectId(id) });
        if (post && post.poll) {
          const userVote = post.votes && post.votes[sanitizedEmail];

          if (userVote === pollItem) {
            const updatedPoll = post.poll.map((item) => {
              if (item.item === pollItem) {
                item.count -= 1;
              }
              return item;
            });
            const result = await postsCollection.updateOne(
              { _id: new ObjectId(id) },
              {
                $set: { poll: updatedPoll },
                $unset: { [`votes.${sanitizedEmail}`]: "" },
              }
            );
            if (result.modifiedCount > 0) {
              const updatedPost = await postsCollection.findOne({
                _id: new ObjectId(id),
              });
              return res.json(updatedPost);
            }
          }
          const updatedPoll = post.poll.map((item) => {
            if (item.item === userVote) {
              item.count -= 1;
            }
            if (item.item === pollItem) {
              item.count += 1;
            }
            return item;
          });

          const result = await postsCollection.updateOne(
            { _id: new ObjectId(id) },
            {
              $set: {
                poll: updatedPoll,
                [`votes.${sanitizedEmail}`]: pollItem,
              },
            }
          );

          if (result.modifiedCount > 0) {
            const updatedPost = await postsCollection.findOne({
              _id: new ObjectId(id),
            });
            return res.json(updatedPost);
          } else {
            return res.status(404).json({ message: "Poll not updated" });
          }
        } else {
          return res.status(404).json({ message: "Post or poll not found" });
        }
      } catch (err) {
        return res.status(500).json({ message: err.message });
      }
    });

    // payment Info
    app.post("/payment", async (req, res) => {
      try {
        const paymentInfo = req.body;
        const tran_id = new ObjectId().toString();

        const data = {
          total_amount: paymentInfo?.amount,
          currency: "BDT",
          tran_id: tran_id,
          success_url: `${process.env.VITE_URL}/payment/success/${tran_id}`,
          fail_url: `${process.env.VITE_URL}/payment/failed/${tran_id}`,
          cancel_url: "http://localhost:3030/cancel",
          ipn_url: "http://localhost:3030/ipn",
          shipping_method: "Courier",
          product_name: "Computer.",
          product_category: "Electronic",
          product_profile: "general",
          cus_name: paymentInfo?.name,
          cus_email: paymentInfo?.email,
          cus_add1: paymentInfo?.address,
          cus_city: "Dhaka",
          cus_state: "Dhaka",
          cus_postcode: "1000",
          cus_country: "Bangladesh",
          cus_phone: "01711111111",
          ship_name: "Customer Name",
          ship_add1: "Dhaka",
          ship_city: "Dhaka",
          ship_postcode: 1000,
          ship_country: "Bangladesh",
        };

        const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
        const apiResponse = await sslcz.init(data);
        const GatewayPageURL = apiResponse.GatewayPageURL;

        const finalPayment = {
          ...paymentInfo,
          paymentStatus: false,
          tran_id,
        };

        await paymentDataCollection.insertOne(finalPayment);

        res.send({ url: GatewayPageURL });
      } catch (error) {
        console.error("Payment initialization failed:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });

    // payment success
    app.post("/payment/success/:tranId", async (req, res) => {
      try {
        const { tranId } = req.params;

        const paymentData = await paymentDataCollection.findOne({
          tran_id: tranId,
        });

        if (!paymentData) {
          return res.status(404).json({ message: "Payment data not found" });
        }

        const result = await paymentDataCollection.updateOne(
          { tran_id: tranId },
          { $set: { paymentStatus: true } }
        );

        const result2 = await usersCollection.updateOne(
          { email: paymentData.email },
          { $set: { userType: "premium" } }
        );

        if (result.modifiedCount > 0 && result2.acknowledged) {
          res.redirect(
            `${process.env.BASE_URL}/premium-success/${encodeURIComponent(
              tranId
            )}`
          );
        } else {
          res.status(400).json({ message: "Payment update failed" });
        }
      } catch (error) {
        console.error("Payment success handler error:", error);
        res.status(500).json({ message: "Internal Server Error" });
      }
    });
    // payment failed
    app.post("/payment/failed/:tranId", async (req, res) => {
      const { tranId } = req.params;

      const result = await paymentDataCollection.deleteOne({ tran_id: tranId });

      if (result.deletedCount > 0) {
        res.redirect(
          `${process.env.BASE_URL}/premium-failed/${encodeURIComponent(tranId)}`
        );
      }
    });

    // get payment history for a user
    app.get("/get-payment-history/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const paymentHistory = await paymentDataCollection.find(query).toArray();
      res.send(paymentHistory);
    });
    // get payment history for a admin
    app.get("/get-payment-history", async (req, res) => {
      const paymentHistory = await paymentDataCollection.find().toArray();
      res.send(paymentHistory);
    });

    // delete payment history

    app.delete("/payments-history-delete/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await paymentDataCollection.deleteOne(query);
      res.send(result);
    });

    app.post("/dislike-ruhul/:userId", async (req, res) => {
      const { userId } = req.params;
      const { postId } = req.body;

      console.log("postid", postId, "userId", userId);

      try {
        const post = await postsCollection.findOne({
          _id: new ObjectId(postId),
        });

        if (!post) {
          return res.status(404).json({ message: "Post not found." });
        }

        const isDisliked = post.dislikes.includes(userId);
        const isLiked = post.likes.includes(userId);

        let update;

        if (isDisliked) {
          update = { $pull: { dislikes: userId } };
        } else {
          update = {
            $push: { dislikes: userId },
          };

          if (isLiked) {
            update.$pull = { likes: userId };
          }
        }

        await postsCollection.updateOne({ _id: new ObjectId(postId) }, update);

        res.status(200).json({
          message: isDisliked ? "Post undisliked." : "Post disliked.",
          postId,
          userId,
        });
      } catch (error) {
        console.error("Error disliking/undisliking post:", error);
        res.status(500).json({ message: "An error occurred." });
      }
    });

    app.post("/like-ruhul/:userId", async (req, res) => {
      const { userId } = req.params;
      const { postId } = req.body;
      console.log("postid", postId, "userId", userId);
      try {
        const post = await postsCollection.findOne({
          _id: new ObjectId(postId),
        });

        if (!post) {
          return res.status(404).json({ message: "Post not found." });
        }

        const isLiked = post.likes.includes(userId);
        const isDisliked = post.dislikes.includes(userId);

        let update;

        if (isLiked) {
          update = { $pull: { likes: userId } };
        } else {
          update = {
            $push: { likes: userId },
          };

          if (isDisliked) {
            update.$pull = { dislikes: userId };
          }
        }

        await postsCollection.updateOne({ _id: new ObjectId(postId) }, update);

        res.status(200).json({
          message: isLiked ? "Post unliked." : "Post liked.",
          postId,
          userId,
        });
      } catch (error) {
        console.error("Error liking/unliking post:", error);
        res.status(500).json({ message: "An error occurred." })
      }
    });

    // islike

    app.get("/is-disliked/:userId/:postId", async (req, res) => {
      const { userId, postId } = req.params;

      try {
        const post = await postsCollection.findOne({
          _id: new ObjectId(postId),
        });

        if (!post) {
          return res.status(404).json({ message: "Post not found." });
        }

        // const isDisLikedruhul = post.dislikes.includes(userId);
        // const dislikesCount = post.dislikes.length;

        const dislikes = Array.isArray(post.dislikes) ? post.dislikes : [];

        const isDisLikedruhul = dislikes.includes(userId); // Check if user has liked the post
        const dislikesCount = dislikes.length; // Get the number of likes

        res.json({
          isDisLiked: isDisLikedruhul,
          dislikesCount,
        });
      } catch (error) {
        console.error("Error checking if user liked the post:", error);
        res.status(500).json({ message: "An error occurred." });
      }
    });

    app.get("/get-post-details/:id", async (req, res) => {
      const id = req.params.id;
      //  console.log(id);
      const query = { _id: new ObjectId(id) };
      const postDetails = await postsCollection.findOne(query);
      // console.log(postDetails);
      res.send(postDetails);
    });

    app.get("/is-liked/:userId/:postId", async (req, res) => {
      const { userId, postId } = req.params;

      try {
        // Find the post by postId
        const post = await postsCollection.findOne({
          _id: new ObjectId(postId),
        });

        if (!post) {
          return res.status(404).json({ message: "Post not found." });
        }

        // Ensure 'likes' is treated as an array (even if it's missing)
        const likes = Array.isArray(post.likes) ? post.likes : [];

        const isLiked = likes.includes(userId); // Check if user has liked the post
        const likesCount = likes.length; // Get the number of likes

        // Send the response
        res.json({
          isLiked,
          likesCount,
        });
      } catch (error) {
        res.status(500).json({ message: "An error occurred." });
      }
    });

    // applay mentor

    app.post("/applay-mentor", async (req, res) => {
      const  mentorInfo  = req.body;
      console.log("mentorInfo", mentorInfo);
      const res1 = await mentorDataCollection.findOne({ useremail: mentorInfo.useremail});
      if(res1){
        return res.send({message:"You have already applied"});
      }
        
        const newMentor = {
          ...mentorInfo,
          status: "pending",
        };
        const result = await mentorDataCollection.insertOne(newMentor);
        res.send(result);
    })
    app.get('/get-mentor/:email', async (req, res) => {
      const email = req.params.email;
      const result = await mentorDataCollection.findOne({ useremail: email});
      if(result){
      res.send({message:"You have already applied"});}
      else{
        res.send({message:"You can apply now ."})
      }
      
    })

    app.get("/get-apply-mentor", async (req, res) => {
      const result = await mentorDataCollection.find().toArray();
      res.send(result);
    })
    app.get('/get-all-payments', async (req, res) => {
      const result = await paymentDataCollection.find().toArray()
      res.send(result);
    })

    app.put("/make-mentor/:id", async (req, res) => {
      const userId = req.params.id;

      try {
        // Find and update the user's role to 'mentor' in usersCollection
        const filter = { _id: new ObjectId(userId) };
        const updateUserDoc = {
          $set: {
            role: "mentor",
          },
        };

        const userResult = await usersCollection.updateOne(
          filter,
          updateUserDoc
        );

        if (userResult.matchedCount === 0) {
          return res
            .status(404)
            .send({ message: "User not found in usersCollection" });
        }

        // Find and update the user's status to 'mentor' in mentorDataCollection

        const filter2 = { userId };
        const updateMentorDoc = {
          $set: {
            status: "mentor",
          },
        };

        const mentorResult = await mentorDataCollection.updateOne(
          filter2,
          updateMentorDoc
        );

        if (mentorResult.matchedCount === 0) {
          return res
            .status(404)
            .send({ message: "Mentor data not found in mentorDataCollection" });
        }

        console.log("User update result:", userResult);
        console.log("Mentor update result:", mentorResult);

        res.send({
          message: "User role updated to mentor and mentor status set",
        });
      } catch (error) {
        console.error(error)
        res.status(500).send({ message: 'Error updating user role or mentor status' });
      }
    });

    // await client.db("admin").command({ ping: 1 });
    // console.log("DevDive successfully connected to MongoDB!");
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
