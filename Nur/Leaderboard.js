const express = require("express");
const router = express.Router();

module.exports = (postsCollection, likesCollection, commentsCollection) => {
  router.get("/leaderBoardPosts", async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 5;
      const skip = (page - 1) * limit;
      const posts = await postsCollection
        .find()
        .sort({ likes: -1 })
        .skip(skip)
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

  router.get("/leaderBoardComments", async (req, res) => {
    try {
      const result = await commentsCollection
        .aggregate([
          {
            $group: {
              _id: "$userName",
              count: { $sum: 1 },
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
