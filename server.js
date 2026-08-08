const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());

// تقديم ملفات Battle Arena
app.use(express.static(__dirname));

// الصفحة الرئيسية
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// بيانات اللاعب — مؤقتًا
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

// Render يعطي PORT تلقائيًا
const PORT = process.env.PORT || 4000;

app.listen(PORT, "0.0.0.0", () => {
    console.log("🔥 Battle Arena Server Running");
    console.log(`🌐 Port: ${PORT}`);
});
