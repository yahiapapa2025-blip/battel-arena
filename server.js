const express = require("express");
const path = require("path");

const app = express();

const MAINTENANCE_MODE = true;

app.use(express.json());


// =====================================
// 🛠️ MAINTENANCE
// =====================================

app.use((req, res, next) => {

    if (
        MAINTENANCE_MODE &&
        !req.path.startsWith("/api")
    ) {

        return res.status(503).send(`
<!DOCTYPE html>
<html lang="ar" dir="rtl">

<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">

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
    font-size: 32px;
}

p {
    color: #b8c1d1;
    line-height: 1.8;
}

.status {
    display: inline-block;
    padding: 10px 20px;
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
نقوم حاليًا بتطوير اللعبة وتحسينها.
<br>
ارجع لاحقًا 🎮
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
// 📁 STATIC FILES
// =====================================

app.use(express.static(__dirname));


// =====================================
// 🏠 GAME
// =====================================

app.get("/", (req, res) => {
    res.sendFile(
        path.join(__dirname, "index.html")
    );
});


const PORT = process.env.PORT || 10000;

app.listen(PORT, "0.0.0.0", () => {

    console.log("🔥 Battle Arena Server Running");
    console.log("🌐 Port:", PORT);
    console.log(
        MAINTENANCE_MODE
            ? "🛠️ Maintenance: ON"
            : "🎮 Maintenance: OFF"
    );

});
