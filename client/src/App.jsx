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
  // Use the base path from Vite config or environment variable
  // Default to /couriers.services.co.za/ for production deployment
  const getBasePath = () => {
    // Check if we're in a subdirectory deployment
    const path = window.location.pathname;
    
    // If path starts with /couriers.services.co.za, use that as base
    if (path.startsWith("/couriers.services.co.za")) {
      return "/couriers.services.co.za";
    }
    
    // For root domain deployment
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
