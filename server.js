const express = require("express");
const path = require("path");

const app = express();

const PORT = 4000;

// السماح بقراءة JSON
app.use(express.json());

// ملفات اللعبة
app.use(express.static(__dirname));

// الصفحة الرئيسية
app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "index.html")
    );
});

// اختبار السيرفر
app.get("/api/status", (req, res) => {
    res.json({
        online: true,
        game: "Battle Arena"
    });
});

// تشغيل السيرفر
app.listen(PORT, () => {
    console.log("");
    console.log("🔥 Battle Arena Server");
    console.log("✅ Server Online");
    console.log(`🌐 http://localhost:${PORT}`);
    console.log("");
});