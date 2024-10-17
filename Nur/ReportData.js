const express = require("express");
const router = express.Router();

module.exports = (reportDataCollection) => {
  router.post("/reportData", async (req, res) => {
    try {
      const reportData = req.body;
      const { post_id, reportBy } = req.body;
      console.log("reportData", reportData);
      console.log("Received post_id:", post_id);
      console.log("Received user email:", reportBy.email);

      const existingPost = await reportDataCollection.findOne({
        post_id,
        "reportBy.email": reportBy.email,
      });

      if (existingPost) {
        console.log("Post already reported by this user:", post_id);
        return res
          .status(400)
          .json({ message: "Post already reported by this user" });
      }

      // Save the report data to your MongoDB collection
      const result = await reportDataCollection.insertOne(reportData);

      if (result.insertedId) {
        return res
          .status(200)
          .json({ message: "Report submitted successfully." });
      } else {
        return res.status(500).json({ message: "Failed to submit report." });
      }
    } catch (error) {
      console.error("Error saving report data:", error);
      res.status(500).json({ message: "Failed to save report data." });
    }
  });

  return router;
};
