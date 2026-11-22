
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
} from "firebase/auth";
import {
  doc,
  getDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import "../styles/Login.css";

function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const invitationCode = searchParams.get("code");

  const [invitation, setInvitation] = useState(null);
  const [checkingInvitation, setCheckingInvitation] = useState(true);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkInvitation() {
      if (!invitationCode) {
        setMessage("No invitation code was provided.");
        setCheckingInvitation(false);
        return;
      }

      try {
        const invitationRef = doc(
          db,
          "invitations",
          invitationCode
        );

        const invitationSnapshot = await getDoc(invitationRef);

        if (!invitationSnapshot.exists()) {
          setMessage("This invitation does not exist.");
          setCheckingInvitation(false);
          return;
        }

        const invitationData = invitationSnapshot.data();

        if (invitationData.status !== "Pending") {
          setMessage("This invitation has already been used.");
          setCheckingInvitation(false);
          return;
        }

        if (
          !invitationData.expiresAt ||
          invitationData.expiresAt.toDate() <= new Date()
        ) {
          setMessage("This invitation has expired.");
          setCheckingInvitation(false);
          return;
        }

        setInvitation(invitationData);
      } catch (error) {
        console.error("Invitation verification error:", error);
        setMessage(
          "Unable to verify this invitation. Please try again."
        );
      } finally {
        setCheckingInvitation(false);
      }
    }

    checkInvitation();
  }, [invitationCode]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!invitation) {
      setMessage("A valid invitation is required.");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    let createdUser = null;

    try {
      setLoading(true);

      const cleanEmail = invitation.email.trim().toLowerCase();
      const cleanUsername = invitation.username.trim();

      // Create the Firebase Authentication account.
      const userCredential =
        await createUserWithEmailAndPassword(
          auth,
          cleanEmail,
          password
        );

      createdUser = userCredential.user;

      await updateProfile(createdUser, {
        displayName: cleanUsername,
      });

      // Both Firestore writes must happen together.
      // The security rules check these two writes atomically.
      const batch = writeBatch(db);

      const invitationRef = doc(
        db,
        "invitations",
        invitationCode
      );

      const userRef = doc(
        db,
        "users",
        createdUser.uid
      );

      batch.update(invitationRef, {
        status: "Accepted",
        acceptedBy: createdUser.uid,
        acceptedAt: serverTimestamp(),
      });

      batch.set(userRef, {
        username: cleanUsername,
        email: cleanEmail,
        role: "user",
        createdAt: serverTimestamp(),
        invitationCode: invitationCode,
      });

      await batch.commit();

      setMessage("Account created successfully!");

      navigate("/profile", { replace: true });
    } catch (error) {
      console.error("Registration error:", error);

      // Remove the newly created Auth account if registration
      // fails before the Firestore batch is completed.
      if (createdUser) {
        try {
          await deleteUser(createdUser);
        } catch (cleanupError) {
          console.error(
            "Unable to clean up failed account:",
            cleanupError
          );
        }
      }

      if (error.code === "auth/email-already-in-use") {
        setMessage("This email is already registered.");
      } else if (error.code === "auth/weak-password") {
        setMessage("Password must contain at least 6 characters.");
      } else if (error.code === "auth/invalid-email") {
        setMessage("The invitation contains an invalid email.");
      } else if (error.code === "permission-denied") {
        setMessage(
          "Registration was denied. The invitation may have expired or already been used."
        );
      } else {
        setMessage(
          "Unable to create your account. Please try again."
        );
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

        <p className="auth-subtitle">
          Complete your gaming account registration
        </p>

        {checkingInvitation ? (
          <p className="auth-message">
            VERIFYING YOUR INVITATION...
          </p>
        ) : invitation ? (
          <>
            <form onSubmit={handleSubmit}>
              <label htmlFor="register-username">
                USER NAME
              </label>
              <input
                type="text"
                id="register-username"
                value={invitation.username}
                readOnly
              />

              <label htmlFor="register-email">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                id="register-email"
                value={invitation.email}
                readOnly
              />

              <label htmlFor="register-password">
                PASSWORD
              </label>
              <input
                type="password"
                id="register-password"
                placeholder="Create a password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                minLength={6}
                required
              />

              <label htmlFor="register-confirm-password">
                CONFIRM PASSWORD
              </label>
              <input
                type="password"
                id="register-confirm-password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                minLength={6}
                required
              />

              <button type="submit" disabled={loading}>
                {loading
                  ? "CREATING ACCOUNT..."
                  : "CREATE ACCOUNT"}
              </button>
            </form>
          </>
        ) : (
          <div className="auth-message">
            {message}
          </div>
        )}

        {invitation && message && (
          <p className="auth-message">{message}</p>
        )}

        <p className="auth-register-text">
          Already have an account?{" "}
          <Link to="/login">LOG IN</Link>
        </p>
      </div>
    </main>
  );
}

export default Register;
