const express = require("express");
const router = express.Router();

module.exports = (archiveDataCollection) => {
  router.get("/getIndividualArchiveData", async (req, res) => {
    try {
      const { userEmail } = req.query; // Extract userEmail from query params
      console.log("Received userEmail:", userEmail);

      if (!userEmail) {
        return res.status(400).json({ message: "userEmail is required" });
      }

      // Use correct dot notation to query nested email field
      const query = { "archivedBy.email": userEmail };

      const archiveData = await archiveDataCollection.find(query).toArray();

      if (archiveData.length === 0) {
        console.log("No archive data found for:", userEmail);
        return res.status(404).json({ message: "No archive data found" });
      }

      console.log("Found archive data:", archiveData);
      res.status(200).json(archiveData);
    } catch (error) {
      console.error("Error fetching individual archive data:", error);
      res.status(500).json({ message: "Failed to fetch archive data" });
    }
  });

  router.post("/archiveData", async (req, res) => {
    try {
      const { post_id } = req.body; // Extract post_id from the request body
      console.log("Received post_id:", post_id);

      // Check if the post_id already exists in the archive
      const existingPost = await archiveDataCollection.findOne({ post_id });

      if (existingPost) {
        console.log("Post already archived:", post_id);
        return res.status(400).json({ message: "Post already archived" });
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

  return router;
};
