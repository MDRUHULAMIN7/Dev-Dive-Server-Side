const express = require("express");
const router = express.Router();

module.exports = (postsCollection) => {
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

  return router;
};
