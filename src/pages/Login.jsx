
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import "../styles/Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    try {
      setLoading(true);

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        await signOut(auth);
        setMessage("User profile not found. Please contact support.");
        return;
      }

      const userData = userDoc.data();

      if (userData.role === "admin") {
        navigate("/admin-dashboard");
      } else {
        navigate("/profile");
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error.code === "auth/invalid-credential") {
        setMessage("Incorrect email or password.");
      } else if (error.code === "auth/invalid-email") {
        setMessage("Please enter a valid email address.");
      } else if (error.code === "auth/too-many-requests") {
        setMessage("Too many attempts. Please try again later.");
      } else {
        setMessage("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-login-container">
      <div className="auth-login-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <span>▱</span>
          </div>

          <div className="auth-logo-text">
            <h1>PC ZONE</h1>
            <p>GAMING LOUNGE</p>
          </div>
        </div>

        <p className="auth-subtitle">Sign in to your gaming account</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="login-email">EMAIL ADDRESS</label>
          <input
            type="email"
            id="login-email"
            placeholder="Enter your email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <label htmlFor="login-password">PASSWORD</label>
          <input
            type="password"
            id="login-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "LOGGING IN..." : "LOG IN"}
          </button>
        </form>

        <p className="auth-message">{message}</p>
      </div>
    </main>
  );
}

export default Login;
