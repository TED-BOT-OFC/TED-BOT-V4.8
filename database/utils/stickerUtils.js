const fs = require("fs");
const path = require("path");

// 📂 carrega banco de stickers
const stickersDBPath = path.join(__dirname, "../data/stickers.json");

function getStickersDB() {
  try {
    if (fs.existsSync(stickersDBPath)) {
      return JSON.parse(fs.readFileSync(stickersDBPath, "utf8"));
    }
  } catch (err) {
    console.error("Erro ao carregar stickers.json:", err);
  }
  return { stickers: [] };
}

// 🔄 Uint8Array → Base64
function toBase64(data) {
  if (!data) return null;
  return Buffer.from(data).toString("base64");
}

// 🔢 Long → Number
function longToNumber(value) {
  if (typeof value === "number") return value;
  if (!value) return null;
  // Baileys usa Long para fileLength em alguns casos
  return value.low !== undefined ? Number(value.low) : Number(value);
}

// 🧩 normaliza sticker recebido
function normalizarSticker(sticker) {
  return {
    mimetype: sticker.mimetype,
    isAnimated: !!sticker.isAnimated,
    width: sticker.width,
    height: sticker.height,
    fileLength: longToNumber(sticker.fileLength),
    fileSha256: toBase64(sticker.fileSha256),
    isAiSticker: !!sticker.isAiSticker,
    isAvatar: !!sticker.isAvatar,
    isLottie: !!sticker.isLottie
  };
}

// ✅ verifica se existe no JSON
function stickerAutorizado(stickerNormalizado) {
  const db = getStickersDB();
  // console.log("🔍 Verificando sticker no banco...");
  const encontrado = db.stickers.find(s =>
    s.fileSha256 === stickerNormalizado.fileSha256 &&
    s.fileLength === stickerNormalizado.fileLength
  );
  
  if (encontrado) {
    // console.log("🎯 Sticker encontrado por SHA256 e Length!");
    return encontrado; // Retorna o objeto completo (com a resposta)
  }
  
  // console.log("❌ Sticker não encontrado no banco.");
  return null;
}

module.exports = {
  normalizarSticker,
  stickerAutorizado
};
