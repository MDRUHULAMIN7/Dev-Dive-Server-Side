const express = require("express");
const router = express.Router();

module.exports = (archiveDataCollection) => {
  router.get("/getIndividualArchiveData", async (req, res) => {
    try {
      const { userEmail } = req.query;

      if (!userEmail) {
        return res.status(400).json({ message: "userEmail is required" });
      }

      const archiveData = await archiveDataCollection
        .find({ "archivedBy.email": userEmail })
        .toArray();

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
        return res.status(200).json({ archived: true });
      } else {
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
      const { post_id, archivedBy } = req.body;

      const existingPost = await archiveDataCollection.findOne({
        post_id,
        "archivedBy.email": archivedBy.email,
      });

      if (existingPost) {
        return res
          .status(400)
          .json({ message: "Post already archived by this user" });
      }

      const result = await archiveDataCollection.insertOne(req.body);

      if (result.insertedId) {
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
      const { email } = req.query;

      const result = await archiveDataCollection.deleteOne({
        post_id: postId,
        "archivedBy.email": email,
      });

      if (result.deletedCount > 0) {
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
