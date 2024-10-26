const express = require("express");
const router = express.Router();

module.exports = (reportDataCollection) => {
  router.get("/checkReportStatus", async (req, res) => {
    try {
      const { post_id, email } = req.query;

      if (!post_id || !email) {
        return res
          .status(400)
          .json({ message: "Post ID and user email are required." });
      }

      const existingReport = await reportDataCollection.findOne({
        post_id,
        "reportBy.email": email,
      });

      if (existingReport) {
        return res.status(200).json({ reported: true });
      } else {
        return res.status(200).json({ reported: false });
      }
    } catch (error) {
      console.error("Error checking report status:", error);
      return res
        .status(500)
        .json({ message: "Failed to check report status." });
    }
  });


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

      const result = await reportDataCollection.insertOne(reportData);

      if (result.insertedId) {
        console.log("Post reported successfully:", result.insertedId);
        return res.status(200).json({ message: "Post reported successfully." });
      } else {
        throw new Error("Failed to report post");
      }
    } catch (error) {
      return res.status(500).json({
        message: "Failed to report post",
        error,
      });
    }
  });

  return router;
};
