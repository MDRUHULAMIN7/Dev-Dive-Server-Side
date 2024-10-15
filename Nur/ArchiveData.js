const express = require("express");
const router = express.Router();

module.exports = (archiveDataCollection) => {
  router.post("/archiveData", async (req, res) => {
    try {
      const archiveData = req.body;
      console.log(archiveData);

      const result = await archiveDataCollection.insertOne(archiveData);

      if (result.insertedId) {
        console.log("Data archived successfully:", result.insertedId);
        res.status(200).json({ message: "Data archived successfully", result });
      } else {
        throw new Error("Failed to insert archive data");
      }

      console.log("Data archived successfully.");
      res.send("Data archived successfully.");
    } catch (error) {
      console.error("Error archiving data:", error);
      res.status(500).json({ message: "Failed to archive data", error });
    }
  });

  return router;
};
