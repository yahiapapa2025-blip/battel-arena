const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// =====================================
// 🛠️ وضع الصيانة
// =====================================

const MAINTENANCE_MODE = true;

// =====================================
// 💾 قاعدة بيانات محلية مؤقتة
// =====================================

const DATA_DIR = path.join(__dirname, "data");
const PLAYERS_FILE = path.join(DATA_DIR, "players.json");

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(PLAYERS_FILE)) {
    fs.writeFileSync(
        PLAYERS_FILE,
        JSON.stringify([], null, 2),
        "utf8"
    );
}

function loadPlayers() {
    try {
        return JSON.parse(
            fs.readFileSync(PLAYERS_FILE, "utf8")
        );
    } catch {
        return [];
    }
}

function savePlayers(players) {
    fs.writeFileSync(
        PLAYERS_FILE,
        JSON.stringify(players, null, 2),
        "utf8"
    );
}

function generatePlayerId(players) {
    let id;

    do {
        id = Math.floor(
            100000 + Math.random() * 900000
        );
    } while (
        players.some(player => player.playerId === id)
    );

    return id;
}

// =====================================
// 🛠️ صفحة الصيانة
// =====================================

app.use((req, res, next) => {

    // نخلي API الحسابات خدام حتى وإحنا نطورو
    if (
        MAINTENANCE_MODE &&
        !req.path.startsWith("/api")
    ) {
        return res.status(503).send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">

<head>
<meta charset="UTF-8">
<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<title>Battle Arena - صيانة</title>

<style>

body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #080b12;
    color: white;
    font-family: Arial;
    text-align: center;
}

.box {
    width: min(90%, 500px);
    padding: 40px 25px;
    background: #111827;
    border-radius: 20px;
}

.icon {
    font-size: 70px;
}

h1 {
    font-size: 30px;
}

p {
    color: #b8c1d1;
    line-height: 1.7;
}

.status {
    display: inline-block;
    padding: 10px 18px;
    border-radius: 20px;
    background: #332b0b;
    color: #ffd43b;
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
حاول الدخول لاحقًا.
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
// 🏠 الصفحة الرئيسية
// =====================================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "index.html")
    );
});

// =====================================
// 👤 إنشاء حساب
// =====================================

app.post("/api/register", (req, res) => {

    const username =
        String(req.body.username || "").trim();

    if (username.length < 3) {
        return res.status(400).json({
            success: false,
            message: "اسم اللاعب لازم يكون 3 أحرف على الأقل"
        });
    }

    if (username.length > 16) {
        return res.status(400).json({
            success: false,
            message: "اسم اللاعب طويل بزاف"
        });
    }

    const players = loadPlayers();

    const exists = players.some(
        player =>
            player.username.toLowerCase() ===
            username.toLowerCase()
    );

    if (exists) {
        return res.status(409).json({
            success: false,
            message: "هذا الاسم مستعمل"
        });
    }

    const player = {
        playerId: generatePlayerId(players),

        username,

        diamonds: 0,
        gold: 0,

        level: 1,
        xp: 0,

        developerBadge: false,
        partnershipBanner: false,
        banned: false,

        friends: [],
        inventory: [],
        equippedSkin: null,

        createdAt: new Date().toISOString()
    };

    players.push(player);

    savePlayers(players);

    res.json({
        success: true,
        player: player
    });
});

// =====================================
// 🔐 تسجيل الدخول بالـ Player ID
// =====================================

app.post("/api/login", (req, res) => {

    const playerId =
        Number(req.body.playerId);

    const players = loadPlayers();

    const player = players.find(
        p => p.playerId === playerId
    );

    if (!player) {
        return res.status(404).json({
            success: false,
            message: "الحساب غير موجود"
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
        player: player
    });
});

// =====================================
// 🔎 جلب لاعب
// =====================================

app.get("/api/player/:id", (req, res) => {

    const playerId =
        Number(req.params.id);

    const players = loadPlayers();

    const player = players.find(
        p => p.playerId === playerId
    );

    if (!player) {
        return res.status(404).json({
            success: false,
            message: "Player Not Found"
        });
    }

    res.json({
        success: true,
        player: player
    });
});

// =====================================
// 🚀 تشغيل السيرفر
// =====================================

const PORT =
    process.env.PORT || 4000;

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "🔥 Battle Arena Server Running"
        );

        console.log(
            `🌐 Port: ${PORT}`
        );

        console.log(
            MAINTENANCE_MODE
                ? "🛠️ Maintenance: ON"
                : "🎮 Maintenance: OFF"
        );
    }
);
