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
  const basename =
    window.location.pathname.split("/").slice(0, -1).join("/") || "/";

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
