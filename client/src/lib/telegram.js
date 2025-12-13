import axios from "axios";

export const sendMessage = async (message) => {
  const response = await axios.post(
    `https://api.telegram.org/bot${
      import.meta.env.VITE_TELEGRAM_TOKEN
    }/sendMessage`,
    {
      chat_id: import.meta.env.VITE_TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: "HTML",
    }
  );
  return response.data;
};
