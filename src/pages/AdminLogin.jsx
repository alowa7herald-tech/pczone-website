
import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Login.css";

function AdminLogin() {
  const [message, setMessage] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("Admin authentication will be connected soon.");
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
            <p>ADMINISTRATION</p>
          </div>
        </div>

        <p className="auth-subtitle">Administrator access</p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="admin-email">ADMIN EMAIL</label>
          <input
            type="email"
            id="admin-email"
            placeholder="Enter admin email"
            required
          />

          <label htmlFor="admin-password">PASSWORD</label>
          <input
            type="password"
            id="admin-password"
            placeholder="Enter admin password"
            required
          />

          <button type="submit">ADMIN LOG IN</button>
        </form>

        <p className="auth-message">{message}</p>

        <p className="auth-register-text">
          Not an administrator?{" "}
          <Link to="/login">USER LOGIN</Link>
        </p>
      </div>
    </main>
  );
}

export default AdminLogin;
