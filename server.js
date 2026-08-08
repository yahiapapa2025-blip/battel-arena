const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());

// =====================================
// 🛠️ وضع الصيانة
// true  = اللعبة مغلقة
// false = اللعبة مفتوحة
// =====================================

const MAINTENANCE_MODE = true;

// =====================================
// 🛠️ صفحة الصيانة
// =====================================

app.use((req, res, next) => {
    if (MAINTENANCE_MODE) {
        return res.status(503).send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Battle Arena - تحت الصيانة</title>

    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #080b12;
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
        }

        .box {
            width: min(90%, 500px);
            padding: 40px 25px;
            background: #111827;
            border: 1px solid #273449;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,.5);
        }

        .icon {
            font-size: 70px;
            margin-bottom: 15px;
        }

        h1 {
            margin: 0 0 10px;
            font-size: 30px;
        }

        h2 {
            margin: 0 0 15px;
        }

        p {
            color: #b8c1d1;
            font-size: 17px;
            line-height: 1.7;
        }

        .status {
            display: inline-block;
            margin-top: 15px;
            padding: 10px 18px;
            border-radius: 999px;
            background: #332b0b;
            color: #ffd43b;
            font-weight: bold;
        }
    </style>
</head>

<body>

    <div class="box">

        <div class="icon">🛠️</div>

        <h1>Battle Arena</h1>

        <h2>اللعبة تحت الصيانة</h2>

        <p>
            نقوم حاليًا بتطوير وتحسين اللعبة.
            <br>
            حاول الدخول مرة أخرى لاحقًا.
        </p>

        <div class="status">
            🔧 تحت الصيانة
        </div>

    </div>

</body>
</html>
        `);
    }

    next();
});

// =====================================
// 📁 ملفات اللعبة
// =====================================

app.use(express.static(__dirname));

// =====================================
// 🏠 الصفحة الرئيسية
// =====================================

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// =====================================
// 👤 بيانات اللاعب
// =====================================

app.get("/game/player/:id", (req, res) => {

    const id = Number(req.params.id);

    if (id !== 100001) {
        return res.status(404).json({
            success: false,
            message: "Player Not Found"
        });
    }

    res.json({
        success: true,
        playerId: 100001,
        username: "Yahia",
        diamonds: 99999,
        gold: 500000,
        level: 100,
        developerBadge: true,
        partnershipBanner: true,
        banned: false
    });
});

// =====================================
// 🚀 تشغيل السيرفر
// =====================================

const PORT = process.env.PORT || 4000;

app.listen(PORT, "0.0.0.0", () => {
    console.log("🔥 Battle Arena Server Running");
    console.log(`🌐 Port: ${PORT}`);

    if (MAINTENANCE_MODE) {
        console.log("🛠️ Maintenance Mode: ON");
    } else {
        console.log("🎮 Maintenance Mode: OFF");
    }
});
