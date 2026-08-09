const express = require("express");
const mongoose = require("mongoose");
const Player = require("./models/player");

const app = express();

app.use(express.json());
app.use(express.static("."));

const PORT = process.env.PORT || 10000;

// MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error:", err.message));

// إنشاء حساب
app.post("/api/register", async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "اكتب اسم اللاعب"
      });
    }

    const exists = await Player.findOne({ username });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "اسم اللاعب مستعمل"
      });
    }

    const playerId = Math.floor(1000000 + Math.random() * 9000000);

    const player = await Player.create({
      playerId,
      username
    });

    res.json({
      success: true,
      message: "تم إنشاء الحساب",
      player
    });

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "فشل إنشاء الحساب"
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.listen(PORT, "0.0.0.0", () => {
  console.log("🔥 Battle Arena Server Running");
  console.log("🌐 Port:", PORT);
});
