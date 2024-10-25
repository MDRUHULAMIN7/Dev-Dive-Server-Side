const express = require("express");
const router = express.Router();

module.exports = (postsCollection, usersCollection) => {
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
