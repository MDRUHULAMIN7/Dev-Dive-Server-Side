const express = require("express");
const router = express.Router();

module.exports = (postsCollection, likesCollection, commentsCollection) => {
  router.get("/leaderBoardPosts", async (req, res) => {
    try {
      const { loadAllPosts } = req.query;
      let postsQuery = postsCollection.find().sort({ likes: -1 });
      if (loadAllPosts !== "true") {
        postsQuery = postsQuery.limit(5);
      }
      const posts = await postsQuery.toArray();
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
              userEmail: { $first: "$userEmail"},
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
