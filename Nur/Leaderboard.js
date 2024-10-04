const express = require("express");
const router = express.Router();

module.exports = (postsCollection, likesCollection) => {
  router.get("/leaderBoardPosts", async (req, res) => {
    try {
      const posts = await postsCollection
        .find()
        .sort({ likes: -1 })
        .limit(5)
        .toArray();
      res.status(200).json(posts);
    } catch (error) {
      console.error("Error fetching posts:", error);
      res.status(500).json({ message: "Failed to fetch posts" });
    }
  });

  router.get("/leaderBoardLikes", async (req, res) => {
    try {
      const result = await likesCollection
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

      res.status(200).send(result);
    } catch (error) {
      console.error("Error fetching leaderBoard likes:", error);
      res.status(500).send({ message: "Failed to fetch leaderBoard likes" });
    }
  });

  return router;
};
