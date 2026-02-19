const { app } = require("@azure/functions");
const fs = require("fs");
const path = require("path");

app.http("getComments", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (req) => {
    const filePath = path.join(__dirname, "../comments.json");

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}));
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    return { jsonBody: data };
  }
});