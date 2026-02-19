const { app } = require("@azure/functions");
const fs = require("fs");
const path = require("path");

app.http("addComment", {
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (req) => {
    const body = await req.json();
    const { videoIndex, comment } = body;

    const filePath = path.join(__dirname, "../comments.json");

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify({}));
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    if (!data[videoIndex]) {
      data[videoIndex] = [];
    }

    data[videoIndex].push({
      text: comment,
      timestamp: Date.now()
    });

    fs.writeFileSync(filePath, JSON.stringify(data));

    return { jsonBody: { success: true } };
  }
});