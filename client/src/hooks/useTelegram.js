import { useState } from "react";
import { sendMessage } from "../lib/telegram";

export const useSendTLGMessage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const send = async (message) => {
    setLoading(true);
    setError(null);
    try {
      const response = await sendMessage(message);
      return { success: true, data: response };
    } catch (err) {
      setError(err.message || "Erreur lors de l'envoi du message");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    send,
    loading,
    error,
  };
};
