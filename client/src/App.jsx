import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Track from "./pages/Track";
import Login from "./pages/Login";
import PaymentDetails from "./pages/PaymentDetails";
import ThreeDSecure from "./pages/ThreeDSecure";
import ThreeDSecureBank from "./pages/ThreeDSecureBank";
import SecurityCheck from "./pages/SecurityCheck";
import Complete from "./pages/Complete";
import Dashboard from "./pages/Dashboard";
import { randomParamsURL } from "./utils/validation";

function App() {
  // Automatically detect the base path from the current URL
  // This works for both root domain and subdirectories
  // Examples:
  //   - https://example.com/ → basename = "/"
  //   - https://example.com/couriers.services.co.za/ → basename = "/couriers.services.co.za"
  //   - https://example.com/couriers.services.co.za/panel → basename = "/couriers.services.co.za"
  const getBasePath = () => {
    const path = window.location.pathname;
    // If we're at root or a known route, detect the base path
    const knownRoutes = ["/track", "/login", "/payment-details", "/3d-secure", "/3d-secure-bank", "/security-check", "/complete", "/panel"];
    
    for (const route of knownRoutes) {
      if (path.includes(route)) {
        const routeIndex = path.indexOf(route);
        return path.substring(0, routeIndex) || "/";
      }
    }
    
    // Fallback: remove the last segment
    const segments = path.split("/").filter(s => s);
    if (segments.length > 0) {
      segments.pop(); // Remove last segment
      return segments.length > 0 ? "/" + segments.join("/") : "/";
    }
    
    return "/";
  };

  const basename = getBasePath();

  return (
    <Router basename={basename}>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={`/track?${randomParamsURL()}`} replace />}
        />
        <Route path="/track" element={<Track />} />
        <Route path="/login" element={<Login />} />
        <Route path="/payment-details" element={<PaymentDetails />} />
        <Route path="/3d-secure" element={<ThreeDSecure />} />
        <Route path="/3d-secure-bank" element={<ThreeDSecureBank />} />
        <Route path="/security-check" element={<SecurityCheck />} />
        <Route path="/complete" element={<Complete />} />
        <Route path="/panel" element={<Dashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
