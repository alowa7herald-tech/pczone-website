
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import {
  Copy,
  Mail,
  Plus,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { auth, db } from "../firebase";

function CustomerInvitations() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createdLink, setCreatedLink] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "invitations"),
      (snapshot) => {
        const invitationList = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        invitationList.sort((a, b) => {
          const dateA = a.createdAt?.toMillis?.() || 0;
          const dateB = b.createdAt?.toMillis?.() || 0;
          return dateB - dateA;
        });

        setInvitations(invitationList);
        setLoading(false);
      },
      (error) => {
        console.error("Invitation loading error:", error);
        setError("Unable to load invitations.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  function generateCode() {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    const randomValues = new Uint32Array(12);
    window.crypto.getRandomValues(randomValues);

    return Array.from(randomValues)
      .map((value) => characters[value % characters.length])
      .join("");
  }

  async function handleCreateInvitation(event) {
    event.preventDefault();

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanUsername || !cleanEmail) {
      setError("Please enter a username and email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!auth.currentUser) {
      setError("Your admin session has expired. Please log in again.");
      return;
    }

    try {
      setCreating(true);
      setError("");
      setSuccess("");
      setCreatedLink("");

      const code = generateCode();
      const expirationDate = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      );

      await setDoc(doc(db, "invitations", code), {
        username: cleanUsername,
        email: cleanEmail,
        status: "Pending",
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expirationDate),
        createdBy: auth.currentUser.uid,
      });

      const invitationLink =
        `${window.location.origin}/register?code=${code}`;

      setCreatedLink(invitationLink);
      setSuccess("Customer invitation created successfully!");
      setUsername("");
      setEmail("");
    } catch (error) {
      console.error("Invitation creation error:", error);
      setError(
        error.code === "permission-denied"
          ? "Permission denied. Make sure you are logged in as an administrator and your Firestore rules are published."
          : "Unable to create invitation. Please try again."
      );
    } finally {
      setCreating(false);
    }
  }

  async function copyText(value) {
    try {
      await navigator.clipboard.writeText(value);
      setSuccess("Copied successfully!");
    } catch (error) {
      console.error("Copy error:", error);
      setError("Unable to copy. Please copy the text manually.");
    }
  }

  function formatDate(date) {
    if (!date?.toDate) return "Not available";
    return date.toDate().toLocaleDateString();
  }

  return (
    <div className="admin-content">
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Create Customer Invitation</h2>
            <p>
              Invite a customer to create their PC ZONE account.
            </p>
          </div>
          <Mail size={24} />
        </div>

        <form
          className="invitation-form"
          onSubmit={handleCreateInvitation}
        >
          <label htmlFor="invite-username">CUSTOMER USERNAME</label>
          <input
            id="invite-username"
            type="text"
            placeholder="Enter customer username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            maxLength={40}
            required
          />

          <label htmlFor="invite-email">CUSTOMER EMAIL</label>
          <input
            id="invite-email"
            type="email"
            placeholder="Enter customer email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <button type="submit" disabled={creating}>
            <Plus size={17} />
            {creating ? "Creating Invitation..." : "Create Invitation"}
          </button>
        </form>

        {error && (
          <div className="invitation-message invitation-error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {success && (
          <div className="invitation-message invitation-success">
            <CheckCircle size={18} />
            {success}
          </div>
        )}

        {createdLink && (
          <div className="invitation-created">
            <h3>Invitation Ready</h3>
            <p>Share this link with the intended customer:</p>

            <div className="invitation-link-row">
              <input value={createdLink} readOnly />
              <button
                type="button"
                onClick={() => copyText(createdLink)}
                title="Copy invitation link"
              >
                <Copy size={17} />
              </button>
            </div>

            <p>
              This invitation expires after seven days.
              The registration page still needs to be connected.
            </p>
          </div>
        )}
      </section>

      <section className="admin-panel invitation-list-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Customer Invitations</h2>
            <p>Track invitations created by the administrator.</p>
          </div>

          <RefreshCw size={21} />
        </div>

        {loading ? (
          <div className="admin-empty">
            <p>Loading invitations...</p>
          </div>
        ) : invitations.length === 0 ? (
          <div className="admin-empty">
            <Mail size={30} />
            <p>No invitations created yet.</p>
          </div>
        ) : (
          <div className="admin-customer-table-wrapper">
            <table className="admin-customer-table">
              <thead>
                <tr>
                  <th>USERNAME</th>
                  <th>EMAIL</th>
                  <th>INVITATION CODE</th>
                  <th>STATUS</th>
                  <th>CREATED</th>
                  <th>EXPIRES</th>
                </tr>
              </thead>

              <tbody>
                {invitations.map((invitation) => {
                  const expired =
                    invitation.status === "Pending" &&
                    invitation.expiresAt?.toDate?.() < new Date();

                  return (
                    <tr key={invitation.id}>
                      <td>{invitation.username}</td>
                      <td>{invitation.email}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => copyText(invitation.id)}
                          title="Copy invitation code"
                        >
                          {invitation.id}
                          <Copy size={13} />
                        </button>
                      </td>
                      <td>
                        {invitation.status === "Accepted" ? (
                          <span><CheckCircle size={13} /> Accepted</span>
                        ) : expired ? (
                          <span><Clock size={13} /> Expired</span>
                        ) : (
                          <span><Clock size={13} /> Pending</span>
                        )}
                      </td>
                      <td>{formatDate(invitation.createdAt)}</td>
                      <td>{formatDate(invitation.expiresAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default CustomerInvitations;
