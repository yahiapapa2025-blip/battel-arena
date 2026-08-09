const express = require("express");
const mongoose = require("mongoose");
const Player = require("./models/player");

const app = express();

app.use(express.json());
app.use(express.static("."));

const PORT = process.env.PORT || 10000;

// =====================================
// 🤖 BATTLE ARENA ADMIN BOT
// =====================================

const ADMIN_KEY = process.env.ADMIN_BOT_KEY;

if (!ADMIN_KEY) {
  console.log("⚠️ ADMIN_BOT_KEY غير موجود في Environment");
}

// =====================================
// 🧠 MongoDB
// =====================================

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
  })
  .catch((err) => {
    console.log("❌ MongoDB Error:", err.message);
  });

// =====================================
// 🔐 حماية أوامر البوت
// =====================================

function adminOnly(req, res, next) {
  const key = req.headers["x-admin-key"];

  if (!ADMIN_KEY || key !== ADMIN_KEY) {
    return res.status(403).json({
      success: false,
      message: "🚫 غير مصرح"
    });
  }

  next();
}

// =====================================
// 👤 إنشاء حساب
// =====================================

app.post("/api/register", async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "اكتب اسم اللاعب"
      });
    }

    const cleanUsername = username.trim();

    if (!cleanUsername) {
      return res.status(400).json({
        success: false,
        message: "اسم اللاعب فارغ"
      });
    }

    const exists = await Player.findOne({
      username: cleanUsername
    });

    if (exists) {
      return res.status(400).json({
        success: false,
        message: "اسم اللاعب مستعمل"
      });
    }

    // إنشاء ID ومحاولة التأكد أنه غير مستعمل
    let playerId;
    let idExists = true;

    while (idExists) {
      playerId = Math.floor(
        1000000 + Math.random() * 9000000
      );

      idExists = await Player.exists({
        playerId
      });
    }

    const player = await Player.create({
      playerId,
      username: cleanUsername
    });

    console.log(
      `👤 Player Created: ${cleanUsername} | ID: ${playerId}`
    );

    res.json({
      success: true,
      message: "تم إنشاء الحساب",
      player
    });

  } catch (error) {
    console.log("❌ Register Error:", error);

    res.status(500).json({
      success: false,
      message: "فشل إنشاء الحساب"
    });
  }
});

// =====================================
// 🤖 BOT COMMAND
// =====================================

app.post("/api/admin/bot", adminOnly, async (req, res) => {
  try {
    const { command } = req.body;

    if (!command || typeof command !== "string") {
      return res.status(400).json({
        success: false,
        message: "اكتب أمر البوت"
      });
    }

    const text = command.trim();

    console.log(`🤖 Admin Bot Command: ${text}`);

    // ---------------------------------
    // 💎 اشحن ID AMOUNT
    // مثال:
    // اشحن 1234567 500
    // ---------------------------------

    const chargeMatch = text.match(
      /^اشحن\s+(\d{7})\s+(\d+)$/
    );

    if (chargeMatch) {
      const playerId = Number(chargeMatch[1]);
      const amount = Number(chargeMatch[2]);

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "قيمة الشحن لازم تكون أكبر من 0"
        });
      }

      const player = await Player.findOneAndUpdate(
        { playerId },
        { $inc: { diamonds: amount } },
        { new: true }
      );

      if (!player) {
        return res.status(404).json({
          success: false,
          message: `❌ اللاعب ${playerId} غير موجود`
        });
      }

      console.log(
        `💎 CHARGE | Player: ${playerId} | +${amount}`
      );

      return res.json({
        success: true,
        message: "تم الشحن بنجاح",
        player: {
          id: player.playerId,
          username: player.username,
          diamonds: player.diamonds
        }
      });
    }

    // ---------------------------------
    // 🪙 اشحن_ذهب ID AMOUNT
    // مثال:
    // ذهب 1234567 1000
    // ---------------------------------

    const goldMatch = text.match(
      /^ذهب\s+(\d{7})\s+(\d+)$/
    );

    if (goldMatch) {
      const playerId = Number(goldMatch[1]);
      const amount = Number(goldMatch[2]);

      if (amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "قيمة الذهب غير صحيحة"
        });
      }

      const player = await Player.findOneAndUpdate(
        { playerId },
        { $inc: { gold: amount } },
        { new: true }
      );

      if (!player) {
        return res.status(404).json({
          success: false,
          message: `❌ اللاعب ${playerId} غير موجود`
        });
      }

      console.log(
        `🪙 GOLD | Player: ${playerId} | +${amount}`
      );

      return res.json({
        success: true,
        message: "تمت إضافة الذهب",
        player: {
          id: player.playerId,
          username: player.username,
          gold: player.gold
        }
      });
    }

    // ---------------------------------
    // 🔎 معلومات لاعب
    // مثال:
    // معلومات 1234567
    // ---------------------------------

    const infoMatch = text.match(
      /^معلومات\s+(\d{7})$/
    );

    if (infoMatch) {
      const playerId = Number(infoMatch[1]);

      const player = await Player.findOne({
        playerId
      }).lean();

      if (!player) {
        return res.status(404).json({
          success: false,
          message: "❌ اللاعب غير موجود"
        });
      }

      return res.json({
        success: true,
        message: "تم العثور على اللاعب",
        player
      });
    }

    // ---------------------------------
    // ❤️ حالة البوت
    // ---------------------------------

    if (text === "حالة البوت") {
      return res.json({
        success: true,
        message: "🤖 Bot Online",
        database:
          mongoose.connection.readyState === 1
            ? "Online"
            : "Offline",
        server: "Online"
      });
    }

    // ---------------------------------
    // ❌ أمر غير معروف
    // ---------------------------------

    return res.status(400).json({
      success: false,
      message: "🤖 الأمر غير معروف"
    });

  } catch (error) {
    console.log("❌ Bot Error:", error);

    res.status(500).json({
      success: false,
      message: "حدث خطأ في البوت"
    });
  }
});

// =====================================
// 🌐 الصفحة الرئيسية
// =====================================

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

// =====================================
// 🚀 تشغيل السيرفر
// =====================================

app.listen(PORT, "0.0.0.0", () => {
  console.log("🔥 Battle Arena Server Running");
  console.log("🌐 Port:", PORT);
});
