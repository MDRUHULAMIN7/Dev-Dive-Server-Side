const express = require("express");
const router = express.Router();

module.exports = (archiveDataCollection) => {
  router.get("/getIndividualArchiveData", async (req, res) => {
    try {
      const { userEmail } = req.query;
      console.log("Received userEmail to get data:", userEmail);

      if (!userEmail) {
        return res.status(400).json({ message: "userEmail is required" });
      }

      // Search for archived posts by user email
      const archiveData = await archiveDataCollection
        .find({ "archivedBy.email": userEmail })
        .toArray();

      // console.log("Archive Data:", archiveData);

      // Return 200 with an empty array if no posts are found
      if (archiveData.length === 0) {
        return res.status(200).json([]);
      }

      res.status(200).json(archiveData);
    } catch (error) {
      console.error("Error fetching individual archive data:", error);
      res.status(500).json({ message: "Failed to fetch archive data" });
    }
  });

  router.get("/checkArchivedStatus", async (req, res) => {
    try {
      const { post_id, email } = req.query;

      console.log(
        "Checking archive status for post:",
        post_id,
        "and user:",
        email
      );

      if (!post_id || !email) {
        return res
          .status(400)
          .json({ message: "Post ID and user email are required." });
      }

      const existingArchive = await archiveDataCollection.findOne({
        post_id,
        "archivedBy.email": email,
      });

      if (existingArchive) {
        console.log("Post already archived:", post_id);
        return res.status(200).json({ archived: true });
      } else {
        console.log("Post not archived.");
        return res.status(200).json({ archived: false });
      }
    } catch (error) {
      console.error("Error checking archive status:", error);
      return res
        .status(500)
        .json({ message: "Failed to check archive status." });
    }
  });


  router.post("/archiveData", async (req, res) => {
    try {
      const { post_id, archivedBy } = req.body; // Extract post_id from the request body
      console.log("Received post_id:", post_id);
      console.log("Received user email:", archivedBy.email);

      // Check if the post_id already exists in the archive
      const existingPost = await archiveDataCollection.findOne({
        post_id,
        "archivedBy.email": archivedBy.email,
      });

      if (existingPost) {
        console.log("Post already archived by this user:", post_id);
        return res
          .status(400)
          .json({ message: "Post already archived by this user" });
      }

      // If not found, insert the new archive data
      const result = await archiveDataCollection.insertOne(req.body);

      if (result.insertedId) {
        console.log("Post archived successfully:", result.insertedId);
        return res.status(200).json({
          message: "Post archived successfully",
          result,
        });
      } else {
        throw new Error("Failed to archive post");
      }
    } catch (error) {
      console.error("Error archiving post:", error);
      return res.status(500).json({
        message: "Failed to archive post",
        error,
      });
    }
  });

  router.delete("/unarchive/:postId", async (req, res) => {
    try {
      const { postId } = req.params;
      console.log("Received postId to unarchive:", postId);
      const { email } = req.query;
      console.log("Received email to unarchive:", email);

      const result = await archiveDataCollection.deleteOne({
        post_id: postId,
        "archivedBy.email": email,
      });

      if (result.deletedCount > 0) {
        console.log("Post unarchived successfully:", postId);
        return res
          .status(200)
          .json({ message: "Post unarchived successfully" });
      } else {
        return res.status(404).json({ message: "Post not found" });
      }
    } catch (error) {
      console.error("Error unarchiving post:", error);
      res.status(500).json({ message: "Failed to unarchive post" });
    }
  });

  return router;
};
