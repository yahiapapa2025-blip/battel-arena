const express = require("express");
const mongoose = require("mongoose");
const Player = require("./models/player");
const botController = require("./bot/botController");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const PORT = process.env.PORT || 10000;

// =====================================
// 🗄️ MONGODB
// =====================================

async function connectMongoDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing");
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("✅ MongoDB Connected");

  } catch (error) {
    console.log("❌ MongoDB Error:", error.message);
  }
}

connectMongoDB();


// =====================================
// 🏠 HOME
// =====================================

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});


// =====================================
// 👤 REGISTER PLAYER
// =====================================

app.post("/api/register", async (req, res) => {

  try {

    const username =
      String(req.body.username || "").trim();

    if (!username) {

      return res.status(400).json({
        success: false,
        message: "اكتب اسم اللاعب"
      });

    }

    if (username.length < 3) {

      return res.status(400).json({
        success: false,
        message: "الاسم لازم يكون 3 حروف على الأقل"
      });

    }

    const exists =
      await Player.findOne({ username });

    if (exists) {

      return res.status(400).json({
        success: false,
        message: "اسم اللاعب مستعمل"
      });

    }

    let playerId;

    let existsId = true;

    while (existsId) {

      playerId =
        Math.floor(
          1000000 +
          Math.random() * 9000000
        );

      existsId =
        await Player.findOne({ playerId });
    }

    const player =
      await Player.create({

        playerId,
        username

      });

    console.log(
      `👤 Player Created: ${username} | ID: ${playerId}`
    );

    res.json({

      success: true,

      message: "تم إنشاء الحساب",

      player: {
        playerId: player.playerId,
        username: player.username,
        diamonds: player.diamonds,
        gold: player.gold,
        level: player.level
      }

    });

  } catch (error) {

    console.log(
      "❌ Register Error:",
      error.message
    );

    res.status(500).json({

      success: false,

      message: "فشل إنشاء الحساب"

    });

  }

});


// =====================================
// 👤 GET PLAYER
// =====================================

app.get("/api/player/:id", async (req, res) => {

  try {

    const playerId =
      Number(req.params.id);

    if (!Number.isInteger(playerId)) {

      return res.status(400).json({

        success: false,
        message: "ID غير صالح"

      });

    }

    const player =
      await Player.findOne({
        playerId
      });

    if (!player) {

      return res.status(404).json({

        success: false,
        message: "اللاعب غير موجود"

      });

    }

    res.json({

      success: true,

      player

    });

  } catch (error) {

    console.log(
      "❌ Player Error:",
      error.message
    );

    res.status(500).json({

      success: false,
      message: "خطأ في السيرفر"

    });

  }

});


// =====================================
// 🤖 BOT STATUS
// =====================================

app.get("/api/bot/status", (req, res) => {

  try {

    res.json({

      success: true,

      bot: botController.getStatus()

    });

  } catch (error) {

    res.status(500).json({

      success: false,
      message: error.message

    });

  }

});


// =====================================
// 🩺 SERVER HEALTH
// =====================================

app.get("/api/health", (req, res) => {

  res.json({

    success: true,

    server: "ONLINE",

    mongodb:
      mongoose.connection.readyState === 1
        ? "CONNECTED"
        : "DISCONNECTED",

    time: new Date().toISOString()

  });

});


// =====================================
// ❌ 404
// =====================================

app.use((req, res) => {

  res.status(404).json({

    success: false,

    message: "Route not found"

  });

});


// =====================================
// 🚀 START SERVER
// =====================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log("");
    console.log("🔥 =============================");
    console.log("🔥 BATTLE ARENA SERVER");
    console.log("🔥 =============================");
    console.log(`🌐 Port: ${PORT}`);
    console.log("🤖 Bot Controller: ONLINE");
    console.log("===============================");

  }
);
