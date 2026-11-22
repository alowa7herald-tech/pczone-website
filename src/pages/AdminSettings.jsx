
import { useState } from "react";
import { updatePassword } from "firebase/auth";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Monitor,
} from "lucide-react";
import { auth } from "../firebase";

function AdminSettings({ adminEmail = "" }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  async function handlePasswordChange(event) {
    event.preventDefault();
    setMessage("");

    if (newPassword.length < 6) {
      setMessage("Your new password must contain at least 6 characters.");
      setMessageType("error");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("New passwords do not match.");
      setMessageType("error");
      return;
    }

    try {
      setLoading(true);

      const { reauthenticateWithCredential, EmailAuthProvider } =
        await import("firebase/auth");

      const user = auth.currentUser;

      if (!user || !user.email) {
        throw new Error("No administrator is currently signed in.");
      }

      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );

      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage("Your password has been changed successfully.");
      setMessageType("success");
    } catch (error) {
      console.error("Password change error:", error);

      if (
        error.code === "auth/invalid-credential" ||
        error.code === "auth/wrong-password"
      ) {
        setMessage("Your current password is incorrect.");
      } else if (error.code === "auth/weak-password") {
        setMessage("Please choose a stronger password.");
      } else {
        setMessage("Unable to change password. Please try again.");
      }

      setMessageType("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-content">
      <section className="admin-settings-heading">
        <h2>System Settings</h2>
        <p>Manage your administrator account and security.</p>
      </section>

      <section className="admin-panel admin-settings-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Administrator Account</h2>
            <p>Your current administrator account information.</p>
          </div>
          <ShieldCheck size={25} />
        </div>

        <div className="admin-settings-account">
          <div className="admin-settings-avatar">A</div>
          <div>
            <strong>Administrator</strong>
            <span>ADMIN ACCOUNT</span>
          </div>
        </div>

        <div className="admin-settings-info">
          <Mail size={19} />
          <div>
            <span>EMAIL ADDRESS</span>
            <strong>{adminEmail || "Not available"}</strong>
          </div>
        </div>
      </section>

      <section className="admin-panel admin-settings-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Change Password</h2>
            <p>Update your administrator account password.</p>
          </div>
          <Lock size={24} />
        </div>

        <form
          className="admin-password-form"
          onSubmit={handlePasswordChange}
        >
          <label htmlFor="current-password">CURRENT PASSWORD</label>
          <input
            id="current-password"
            type={showPasswords ? "text" : "password"}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Enter current password"
            required
          />

          <label htmlFor="new-password">NEW PASSWORD</label>
          <input
            id="new-password"
            type={showPasswords ? "text" : "password"}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Enter new password"
            minLength={6}
            required
          />

          <label htmlFor="confirm-password">CONFIRM NEW PASSWORD</label>
          <input
            id="confirm-password"
            type={showPasswords ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm new password"
            minLength={6}
            required
          />

          <button
            type="button"
            className="admin-password-toggle"
            onClick={() => setShowPasswords(!showPasswords)}
          >
            {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
            {showPasswords ? "Hide passwords" : "Show passwords"}
          </button>

          {message && (
            <div className={`admin-settings-message ${messageType}`}>
              {messageType === "success" ? (
                <CheckCircle size={17} />
              ) : (
                <AlertCircle size={17} />
              )}
              <span>{message}</span>
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "UPDATING PASSWORD..." : "UPDATE PASSWORD"}
          </button>
        </form>
      </section>

      <section className="admin-panel admin-settings-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>System Information</h2>
            <p>PC ZONE application details.</p>
          </div>
          <Monitor size={24} />
        </div>

        <div className="admin-settings-info">
          <Monitor size={19} />
          <div>
            <span>APPLICATION</span>
            <strong>PC ZONE Gaming Lounge Management</strong>
          </div>
        </div>

        <div className="admin-settings-info">
          <ShieldCheck size={19} />
          <div>
            <span>AUTHENTICATION</span>
            <strong>Firebase Authentication</strong>
          </div>
        </div>

        <div className="admin-settings-info">
          <Monitor size={19} />
          <div>
            <span>DATABASE</span>
            <strong>Cloud Firestore</strong>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminSettings;
