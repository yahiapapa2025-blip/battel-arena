const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const Player = require("./models/player");

const app = express();

const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));


// ======================================
// 🔐 SECURITY HELPERS
// ======================================

function hashAccountKey(key) {
  return crypto
    .createHash("sha256")
    .update(key)
    .digest("hex");
}


function generateAccountKey() {
  return (
    "BA-" +
    crypto.randomBytes(18).toString("hex").toUpperCase()
  );
}


async function generatePlayerId() {
  let playerId;
  let exists = true;

  while (exists) {
    playerId = Math.floor(
      1000000 + Math.random() * 9000000
    );

    exists = await Player.exists({ playerId });
  }

  return playerId;
}


// ======================================
// 🗄️ MONGODB
// ======================================

async function connectMongoDB() {
  try {
    if (!process.env.MONGODB_URI) {
      console.log("❌ MONGODB_URI غير موجود");
      return;
    }

    await mongoose.connect(
      process.env.MONGODB_URI
    );

    console.log("✅ MongoDB Connected");

  } catch (error) {
    console.log(
      "❌ MongoDB Error:",
      error.message
    );
  }
}

connectMongoDB();


// ======================================
// 🏠 HOME
// ======================================

app.get("/", (req, res) => {
  res.sendFile(
    __dirname + "/index.html"
  );
});


// ======================================
// 🆕 CREATE ACCOUNT
// ======================================

app.post("/api/register", async (req, res) => {

  try {

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "السيرفر مازال ما اتصلش بقاعدة البيانات"
      });
    }

    const username = String(
      req.body.username || ""
    ).trim();

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

    if (username.length > 16) {
      return res.status(400).json({
        success: false,
        message: "الاسم طويل بزاف"
      });
    }


    // الاسم موجود؟
    const existingPlayer =
      await Player.findOne({
        username
      });

    if (existingPlayer) {
      return res.status(409).json({
        success: false,
        message: "اسم اللاعب مستعمل"
      });
    }


    // إنشاء ID
    const playerId =
      await generatePlayerId();


    // إنشاء مفتاح الحساب
    const accountKey =
      generateAccountKey();


    // نخزنو Hash فقط في MongoDB
    const accountKeyHash =
      hashAccountKey(accountKey);


    const player =
      await Player.create({

        playerId,

        username,

        accountKeyHash,

        diamonds: 0,

        gold: 0,

        level: 1,

        developerBadge: false,

        partnershipBanner: false,

        banned: false

      });


    console.log(
      `👤 Account Created | ${username} | ${playerId}`
    );


    // المفتاح يرجع للاعب مرة إنشاء الحساب
    res.json({

      success: true,

      message: "تم إنشاء الحساب بنجاح",

      accountKey,

      player: {

        playerId: player.playerId,

        username: player.username,

        diamonds: player.diamonds,

        gold: player.gold,

        level: player.level,

        banned: player.banned

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


// ======================================
// 🔑 LOGIN WITH ACCOUNT KEY
// ======================================

app.post("/api/login", async (req, res) => {

  try {

    const accountKey =
      String(
        req.body.accountKey || ""
      ).trim();


    if (!accountKey) {

      return res.status(400).json({

        success: false,

        message: "أدخل Account Key"

      });

    }


    const accountKeyHash =
      hashAccountKey(accountKey);


    const player =
      await Player.findOne({
        accountKeyHash
      });


    if (!player) {

      return res.status(401).json({

        success: false,

        message: "Account Key غير صحيح"

      });

    }


    if (player.banned) {

      return res.status(403).json({

        success: false,

        message: "هذا الحساب محظور"

      });

    }


    res.json({

      success: true,

      message: "تم الدخول",

      player: {

        playerId: player.playerId,

        username: player.username,

        diamonds: player.diamonds,

        gold: player.gold,

        level: player.level,

        developerBadge:
          player.developerBadge,

        partnershipBanner:
          player.partnershipBanner,

        banned: player.banned

      }

    });


  } catch (error) {

    console.log(
      "❌ Login Error:",
      error.message
    );

    res.status(500).json({

      success: false,

      message: "خطأ في تسجيل الدخول"

    });

  }

});


// ======================================
// 👤 GET PLAYER
// ======================================

app.get(
  "/api/player/:id",
  async (req, res) => {

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

        player: {

          playerId: player.playerId,

          username: player.username,

          diamonds: player.diamonds,

          gold: player.gold,

          level: player.level,

          developerBadge:
            player.developerBadge,

          partnershipBanner:
            player.partnershipBanner,

          banned: player.banned

        }

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

  }
);


// ======================================
// ❤️ SERVER HEALTH
// ======================================

app.get(
  "/api/health",
  (req, res) => {

    res.json({

      success: true,

      server: "ONLINE",

      mongodb:
        mongoose.connection.readyState === 1
          ? "CONNECTED"
          : "DISCONNECTED",

      time:
        new Date().toISOString()

    });

  }
);


// ======================================
// 🚀 START
// ======================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log("");
    console.log(
      "🔥 ==============================="
    );
    console.log(
      "🔥 BATTLE ARENA SERVER ONLINE"
    );
    console.log(
      "🔥 ==============================="
    );

    console.log(
      "🌐 Port:",
      PORT
    );

    console.log(
      "👤 Permanent Accounts: ON"
    );

    console.log(
      "🔐 Account Keys: ON"
    );

  }
);
