const express = require("express");
const router = express.Router();

module.exports = (postsCollection, commentsCollection) => {
  router.get("/leaderBoardPosts", async (req, res) => {
    try {
      const { loadAllPosts } = req.query;

      const postsPipeline = [
        {
          $project: {
            title: 1,
            likesCount: {
              $cond: {
                if: { $isArray: "$likes" },
                then: { $size: "$likes" },
                else: 0,
              },
            },
          },
        },
        { $sort: { likesCount: -1 } },
      ];

      if (loadAllPosts !== "true") {
        postsPipeline.push({ $limit: 5 });
      }

      // Execute the aggregation
      const posts = await postsCollection.aggregate(postsPipeline).toArray();
      res.status(200).json(posts);
    } catch (error) {
      console.error("Error fetching posts for LeaderBoard:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  router.get("/leaderBoardLikes", async (req, res) => {
    try {
      const { loadAllLikes } = req.query;
      console.log("loadAllLikes query param:", loadAllLikes);

      const aggregationPipeline = [
        {
          $unwind: "$likes", // Unwind the likes array
        },
        {
          $match: { likes: { $ne: "" } }, // Exclude empty likes
        },
        {
          $group: {
            _id: "$likes", // Group by user ID from likes array
            count: { $sum: 1 }, // Count the number of likes
          },
        },
        {
          $sort: { count: -1 }, // Sort by most liked
        },
        {
          $match: {
            _id: { $type: "string", $regex: /^[a-fA-F0-9]{24}$/ }, // Ensure valid ObjectId strings
          },
        },
        {
          $addFields: {
            userId: { $toObjectId: "$_id" }, // Convert to ObjectId
          },
        },
        {
          $lookup: {
            from: "users", // Join with users collection
            localField: "userId",
            foreignField: "_id",
            as: "userDetails",
          },
        },
        {
          $unwind: {
            path: "$userDetails",
            preserveNullAndEmptyArrays: true, // Handle missing users gracefully
          },
        },
        {
          $project: {
            _id: 1,
            count: 1,
            "userDetails.name": { $ifNull: ["$userDetails.name", "Unknown"] },
            "userDetails.email": { $ifNull: ["$userDetails.email", "N/A"] },
          },
        },
        ...(loadAllLikes === "true" ? [] : [{ $limit: 5 }]), // Apply limit if needed
      ];

      console.log("Aggregation pipeline:", JSON.stringify(aggregationPipeline));

      const likesAggregation = await postsCollection
        .aggregate(aggregationPipeline)
        .toArray();
      console.log("likesAggregation result:", likesAggregation);

      res.status(200).send(likesAggregation);
    } catch (error) {
      console.error("Error in /leaderBoardLikes:", error);
      res.status(500).send({ message: "Failed to fetch leaderBoard likes." });
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

  return router;
};
