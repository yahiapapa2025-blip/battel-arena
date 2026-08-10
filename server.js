const express = require("express");
const mongoose = require("mongoose");
const crypto = require("crypto");
const Player = require("./models/player");

const app = express();

const PORT = process.env.PORT || 10000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));


// ==========================================
// ACCOUNT KEY
// ==========================================

function hashKey(key) {
  return crypto
    .createHash("sha256")
    .update(key)
    .digest("hex");
}

function createAccountKey() {
  return (
    "BA-" +
    crypto
      .randomBytes(18)
      .toString("hex")
      .toUpperCase()
  );
}


// ==========================================
// PLAYER ID
// ==========================================

async function createPlayerId() {
  let id;
  let exists = true;

  while (exists) {
    id = Math.floor(
      1000000 + Math.random() * 9000000
    );

    exists = await Player.exists({
      playerId: id
    });
  }

  return id;
}


// ==========================================
// DATABASE
// ==========================================

async function connectDB() {
  try {
    if (!process.env.MONGODB_URI) {
      console.log("❌ MONGODB_URI missing");
      return false;
    }

    await mongoose.connect(
      process.env.MONGODB_URI
    );

    console.log("✅ MongoDB Connected");

    return true;

  } catch (error) {

    console.log(
      "❌ MongoDB Error:",
      error.message
    );

    return false;
  }
}

connectDB();


// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
  res.sendFile(
    __dirname + "/index.html"
  );
});


// ==========================================
// REGISTER
// ==========================================

app.post("/api/register", async (req, res) => {

  try {

    if (
      mongoose.connection.readyState !== 1
    ) {
      return res.status(503).json({
        success: false,
        message: "قاعدة البيانات غير متصلة"
      });
    }

    const username =
      String(
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
        message:
          "الاسم لازم يكون 3 حروف على الأقل"
      });
    }

    if (username.length > 16) {
      return res.status(400).json({
        success: false,
        message:
          "الاسم أقصى حاجة 16 حرف"
      });
    }

    const existing =
      await Player.findOne({
        username: {
          $regex:
            `^${escapeRegex(username)}$`,
          $options: "i"
        }
      });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "اسم اللاعب مستعمل"
      });
    }

    const playerId =
      await createPlayerId();

    const accountKey =
      createAccountKey();

    const accountKeyHash =
      hashKey(accountKey);

    /*
      الحساب يبدأ بالشخصية 1.
      تغيير الشخصية يتم من صفحة الشخصيات.
    */

    const player =
      await Player.create({

        playerId,

        username,

        accountKeyHash,

        characterId: 1,

        diamonds: 0,

        gold: 0,

        level: 1,

        developerBadge: false,

        partnershipBanner: false,

        banned: false

      });

    console.log(
      `👤 Created: ${username} | ${playerId}`
    );

    res.json({

      success: true,

      message:
        "تم إنشاء الحساب",

      accountKey,

      player:
        publicPlayer(player)

    });

  } catch (error) {

    console.log(
      "❌ Register Error:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        "فشل إنشاء الحساب"

    });
  }
});


// ==========================================
// LOGIN
// ==========================================

app.post("/api/login", async (req, res) => {

  try {

    const accountKey =
      String(
        req.body.accountKey || ""
      ).trim();

    if (!accountKey) {

      return res.status(400).json({
        success: false,
        message:
          "أدخل Account Key"
      });

    }

    const hash =
      hashKey(accountKey);

    const player =
      await Player.findOne({
        accountKeyHash: hash
      });

    if (!player) {

      return res.status(401).json({
        success: false,
        message:
          "Account Key غير صحيح"
      });

    }

    if (player.banned) {

      return res.status(403).json({
        success: false,
        message:
          "الحساب محظور"
      });

    }

    res.json({

      success: true,

      player:
        publicPlayer(player)

    });

  } catch (error) {

    console.log(
      "❌ Login Error:",
      error
    );

    res.status(500).json({

      success: false,

      message:
        "خطأ في تسجيل الدخول"

    });
  }
});


// ==========================================
// GET PLAYER
// ==========================================

app.get(
  "/api/player/:id",
  async (req, res) => {

    try {

      const id =
        Number(req.params.id);

      if (!Number.isInteger(id)) {

        return res.status(400).json({
          success: false,
          message:
            "ID غير صالح"
        });

      }

      const player =
        await Player.findOne({
          playerId: id
        });

      if (!player) {

        return res.status(404).json({
          success: false,
          message:
            "اللاعب غير موجود"
        });

      }

      res.json({

        success: true,

        player:
          publicPlayer(player)

      });

    } catch (error) {

      console.log(error);

      res.status(500).json({

        success: false,

        message:
          "Server Error"

      });
    }
  }
);


// ==========================================
// CHANGE CHARACTER
// ==========================================

app.post(
  "/api/player/:id/character",
  async (req, res) => {

    try {

      const id =
        Number(req.params.id);

      const accountKey =
        String(
          req.body.accountKey || ""
        ).trim();

      const characterId =
        Number(
          req.body.characterId
        );

      if (!accountKey) {

        return res.status(401).json({
          success: false,
          message:
            "Account Key مفقود"
        });

      }

      if (![1, 2].includes(characterId)) {

        return res.status(400).json({
          success: false,
          message:
            "الشخصية غير صالحة"
        });

      }

      const player =
        await Player.findOne({
          playerId: id,
          accountKeyHash:
            hashKey(accountKey)
        });

      if (!player) {

        return res.status(401).json({
          success: false,
          message:
            "الحساب غير صحيح"
        });

      }

      if (player.banned) {

        return res.status(403).json({
          success: false,
          message:
            "الحساب محظور"
        });

      }

      player.characterId =
        characterId;

      await player.save();

      console.log(
        `🎭 Character changed: ${player.username} -> ${characterId}`
      );

      res.json({

        success: true,

        message:
          "تم تغيير الشخصية",

        player:
          publicPlayer(player)

      });

    } catch (error) {

      console.log(
        "❌ Character Error:",
        error
      );

      res.status(500).json({

        success: false,

        message:
          "فشل تغيير الشخصية"

      });
    }
  }
);


// ==========================================
// HEALTH
// ==========================================

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

      characters: [
        {
          id: 1,
          name: "Character 1",
          file:
            "/models/characters/634230045_my_avatar.glb"
        },
        {
          id: 2,
          name: "Character 2",
          file:
            "/models/characters/sunny_leone_creacter_3d_model.glb"
        }
      ]

    });
  }
);


// ==========================================
// PUBLIC PLAYER DATA
// ==========================================

function publicPlayer(player) {

  return {

    playerId:
      player.playerId,

    username:
      player.username,

    characterId:
      player.characterId || 1,

    diamonds:
      player.diamonds || 0,

    gold:
      player.gold || 0,

    level:
      player.level || 1,

    developerBadge:
      !!player.developerBadge,

    partnershipBanner:
      !!player.partnershipBanner

  };
}


// ==========================================
// ESCAPE REGEX
// ==========================================

function escapeRegex(text) {

  return text.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

}


// ==========================================
// START
// ==========================================

app.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      "🔥 BATTLE ARENA SERVER ONLINE"
    );

    console.log(
      "🌐 PORT:",
      PORT
    );

    console.log(
      "🎭 3D CHARACTERS: ON"
    );

  }
);
