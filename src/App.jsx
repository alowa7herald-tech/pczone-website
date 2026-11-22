
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Reserve from "./pages/Reserve";
import Pricing from "./pages/Pricing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import PixelCursor from "./effects/PixelCursor";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <PixelCursor />

      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reserve" element={<Reserve />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />

          <Route
            path="*"
            element={
              <main className="not-found">
                <h1>404</h1>
                <p>This page is not available yet.</p>
              </main>
            }
          />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
