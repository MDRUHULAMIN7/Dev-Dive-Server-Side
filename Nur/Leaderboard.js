const express = require("express");
const router = express.Router();

module.exports = (postsCollection, usersCollection, commentsCollection) => {
  router.get("/leaderBoardPosts", async (req, res) => {
    try {
      const { loadAllPosts } = req.query;

      // Start building the aggregation pipeline
      const postsPipeline = [
        {
          $project: {
            title: 1, // Include other fields you need
            likesCount: {
              $cond: {
                if: { $isArray: "$likes" }, // Check if likes is an array
                then: { $size: "$likes" }, // Count the likes if it's an array
                else: 0, // Otherwise, set count to 0
              },
            },
            // Include any other fields you need from the post
          },
        },
        { $sort: { likesCount: -1 } }, // Sort by the number of likes in descending order
      ];

      // Conditionally add the $limit stage
      if (loadAllPosts !== "true") {
        postsPipeline.push({ $limit: 5 }); // Add the limit to the pipeline
      }

      // Execute the aggregation
      const posts = await postsCollection.aggregate(postsPipeline).toArray();
      res.status(200).json(posts);
    } catch (error) {
      console.error("Error fetching posts for LeaderBoard:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  // router.get("/leaderBoardLikes", async (req, res) => {
  //   try {
  //     const { loadAllLikes } = req.query;
  //     let likesQuery = likesCollection;
  //     if (loadAllLikes === "true") {
  //       likesQuery = await likesQuery
  //         .aggregate([
  //           {
  //             $group: {
  //               _id: "$email",
  //               count: { $sum: 1 },
  //               name: { $first: "$name" },
  //             },
  //           },
  //           {
  //             $sort: { count: -1 },
  //           },
  //         ])
  //         .toArray();
  //     }

  //     if (loadAllLikes !== "true") {
  //       likesQuery = await likesQuery
  //         .aggregate([
  //           {
  //             $group: {
  //               _id: "$email",
  //               count: { $sum: 1 },
  //               name: { $first: "$name" },
  //             },
  //           },
  //           {
  //             $sort: { count: -1 },
  //           },
  //           {
  //             $limit: 5,
  //           },
  //         ])
  //         .toArray();
  //     }

  //     res.status(200).send(likesQuery);
  //   } catch (error) {
  //     console.error("Error fetching leaderBoard likes:", error);
  //     res.status(500).send({ message: "Failed to fetch leaderBoard likes" });
  //   }
  // });
  // const { ObjectId } = require("mongodb");

  router.get("/leaderBoardLikes", async (req, res) => {
    try {
      const { loadAllLikes } = req.query;
      console.log("loadAllLikes", loadAllLikes);

      const likesAggregation = await postsCollection
        .aggregate([
          {
            $unwind: "$likes",
          },
          {
            $match: { likes: { $ne: "" } },
          },
          {
            $group: {
              _id: "$likes",
              count: { $sum: 1 },
            },
          },
          {
            $sort: { count: -1 },
          },
          ...(loadAllLikes === "true" ? [] : [{ $limit: 5 }]),
          {
            $addFields: {
              userId: { $toObjectId: "$_id" },
            },
          },
          {
            $lookup: {
              from: "users",
              localField: "userId",
              foreignField: "_id",
              as: "userDetails",
            },
          },
          {
            $unwind: { path: "$userDetails", preserveNullAndEmptyArrays: true },
          },
          {
            $project: {
              _id: 1,
              count: 1,
              "userDetails.name": { $ifNull: ["$userDetails.name", "Unknown"] },
              "userDetails.email": { $ifNull: ["$userDetails.email", "N/A"] },
            },
          },
        ])
        .toArray();

      console.log("likesAggregation", likesAggregation);
      res.status(200).send(likesAggregation);
    } catch (error) {
      console.error("Error fetching leaderBoard likes:", error);
      res.status(500).send({ message: "Failed to fetch leaderBoard likes" });
    }
  });

  router.get("/leaderBoardComments", async (req, res) => {
    try {
      const result = await commentsCollection
        .aggregate([
          {
            $group: {
              _id: "$userName",
              count: { $sum: 1 },
              userEmail: { $first: "$userEmail" },
            },
          },
          {
            $sort: { count: -1 },
          },
          {
            $limit: 5,
          },
        ])
        .toArray();

      res.status(200).send(result);
    } catch (error) {
      console.error("Error fetching leaderBoard comments:", error);
      res.status(500).send({ message: "Failed to fetch leaderBoard comments" });
    }
  });

  router.get("/getMyLikedPosts/:email", async (req, res) => {
    try {
      const { email } = req.params;
      console.log("Fetching liked posts for user email:", email);

      const user = await usersCollection.findOne({ email });
      console.log("user email", user._id.toString());

      if (!user) {
        console.log("User not found with email:", email);
        return res.status(404).json({ message: "User not found." });
      }
      const userId = user._id.toString();
      console.log("Found user ID:", userId);

      // Step 2: Find posts where the user's ID is in the likes array
      const likedPosts = await postsCollection
        .find({ likes: userId }) // Match user ID in the likes array
        .toArray();

      console.log("Number of liked posts found:", likedPosts.length);
      res.status(200).json(likedPosts);
    } catch (error) {
      console.error("Error fetching liked posts:", error);
      res.status(500).json({ message: "Failed to fetch liked posts." });
    }
  });

  return router;
};
