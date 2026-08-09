const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const BACKUP_DIR = path.join(ROOT, "backups");
const LOG_FILE = path.join(ROOT, "bot-errors.log");

let autoFixEnabled = true;
let maintenanceMode = false;

// ================================
// 🤖 BOT CONTROLLER
// ================================

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;

  console.log(`🤖 ${message}`);

  fs.appendFileSync(LOG_FILE, line);
}

// ================================
// 💾 BACKUP
// ================================

function createBackup(fileName = "server.js") {
  const source = path.join(ROOT, fileName);

  if (!fs.existsSync(source)) {
    log(`❌ File not found: ${fileName}`);
    return null;
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, {
      recursive: true
    });
  }

  const backupName =
    `${fileName.replace(".js", "")}-` +
    `${Date.now()}.backup.js`;

  const destination =
    path.join(BACKUP_DIR, backupName);

  fs.copyFileSync(source, destination);

  log(`💾 Backup created: ${backupName}`);

  return destination;
}

// ================================
// ♻️ RESTORE
// ================================

function restoreBackup(backupPath, fileName = "server.js") {
  if (!backupPath || !fs.existsSync(backupPath)) {
    log("❌ Backup not found");
    return false;
  }

  const destination = path.join(ROOT, fileName);

  fs.copyFileSync(
    backupPath,
    destination
  );

  log(`♻️ ${fileName} restored`);

  return true;
}

// ================================
// 🔎 ERROR DETECTION
// ================================

function detectError(errorText) {
  if (!errorText) {
    return "UNKNOWN";
  }

  if (
    errorText.includes("MongoServerError") ||
    errorText.includes("MongooseError")
  ) {
    return "MONGODB";
  }

  if (
    errorText.includes("authentication failed") ||
    errorText.includes("bad auth")
  ) {
    return "MONGODB_AUTH";
  }

  if (
    errorText.includes("certificate validation failed")
  ) {
    return "MONGODB_TLS";
  }

  if (
    errorText.includes("MODULE_NOT_FOUND") ||
    errorText.includes("Cannot find module")
  ) {
    return "MODULE";
  }

  if (errorText.includes("SyntaxError")) {
    return "SYNTAX";
  }

  if (errorText.includes("EADDRINUSE")) {
    return "PORT";
  }

  return "UNKNOWN";
}

// ================================
// 🧠 AUTO FIX
// ================================

function autoFix(errorText) {
  const type = detectError(errorText);

  log(`🔎 Detected error: ${type}`);

  const backup = createBackup();

  if (!backup) {
    return {
      success: false,
      message: "Backup failed"
    };
  }

  // MongoDB errors: don't modify credentials automatically
  if (
    type === "MONGODB" ||
    type === "MONGODB_AUTH" ||
    type === "MONGODB_TLS"
  ) {
    log(
      "⚠️ MongoDB problem detected. " +
      "Automatic modification disabled."
    );

    return {
      success: false,
      type,
      message:
        "MongoDB error needs manual configuration."
    };
  }

  // Syntax errors are too dangerous to auto-edit
  if (type === "SYNTAX") {
    log(
      "⚠️ Syntax error detected. " +
      "Automatic code modification disabled."
    );

    return {
      success: false,
      type,
      message:
        "Syntax error requires manual correction."
    };
  }

  // Missing module
  if (type === "MODULE") {
    log(
      "⚠️ Missing module detected. " +
      "Check package.json."
    );

    return {
      success: false,
      type,
      message:
        "Missing module. Check package.json."
    };
  }

  if (type === "PORT") {
    log(
      "⚠️ Port already in use."
    );

    return {
      success: false,
      type,
      message:
        "Port is already in use."
    };
  }

  log("⚠️ Unknown error. No automatic modification.");

  return {
    success: false,
    type: "UNKNOWN",
    message: "Unknown error."
  };
}

// ================================
// 🟢 MAINTENANCE
// ================================

function enableMaintenance() {
  maintenanceMode = true;

  log("🔧 Maintenance Mode ENABLED");

  return true;
}

function disableMaintenance() {
  maintenanceMode = false;

  log("🟢 Maintenance Mode DISABLED");

  return true;
}

// ================================
// 🔧 AUTO FIX SWITCH
// ================================

function enableAutoFix() {
  autoFixEnabled = true;

  log("🟢 Auto-Fix ENABLED");
}

function disableAutoFix() {
  autoFixEnabled = false;

  log("🔴 Auto-Fix DISABLED");
}

// ================================
// 📊 BOT STATUS
// ================================

function getStatus() {
  return {
    bot: "ONLINE",
    autoFix: autoFixEnabled,
    maintenance: maintenanceMode,
    time: new Date().toISOString()
  };
}

// ================================
// 📦 EXPORT
// ================================

module.exports = {
  log,
  createBackup,
  restoreBackup,
  detectError,
  autoFix,
  enableMaintenance,
  disableMaintenance,
  enableAutoFix,
  disableAutoFix,
  getStatus
};
