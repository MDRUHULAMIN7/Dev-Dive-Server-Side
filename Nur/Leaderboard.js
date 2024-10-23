const express = require("express");
const router = express.Router();

module.exports = (postsCollection, likesCollection, commentsCollection) => {
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


  router.get("/leaderBoardLikes", async (req, res) => {
    try {
      const { loadAllLikes } = req.query;
      let likesQuery = likesCollection;
      if (loadAllLikes === "true") {
        likesQuery = await likesQuery
          .aggregate([
            {
              $group: {
                _id: "$email",
                count: { $sum: 1 },
                name: { $first: "$name" },
              },
            },
            {
              $sort: { count: -1 },
            },
          ])
          .toArray();
      }

      if (loadAllLikes !== "true") {
        likesQuery = await likesQuery
          .aggregate([
            {
              $group: {
                _id: "$email",
                count: { $sum: 1 },
                name: { $first: "$name" },
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
      }

      res.status(200).send(likesQuery);
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

  return router;
};
