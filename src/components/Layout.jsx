
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import Logo from "./Logo";

function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const standalonePages = [
    "/login",
    "/register",
    "/admin-dashboard",
  ];

  if (standalonePages.includes(location.pathname)) {
    return children;
  }

  async function handleLogout() {
    try {
      await signOut(auth);
      setMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  const navigation = [
    { label: "Home", path: "/" },
    { label: "Reserve", path: "/reserve" },
    { label: "Pricing", path: "/pricing" },
    { label: "Profile", path: "/profile" },
  ];

  return (
    <div className="app">
      <header className="navbar">
        <Logo />

        <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
          {navigation.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                isActive ? "active" : ""
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          {user ? (
            <button type="button" onClick={handleLogout}>
              LOG OUT
            </button>
          ) : (
            <Link to="/login">
              LOG IN
            </Link>
          )}

          <Link to="/reserve" className="book-button">
            Book now <ArrowRight size={16} />
          </Link>
        </div>

        <button
          type="button"
          className="menu-button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {children}

      <footer className="footer">
        <Logo />
        <p>Open daily 10:00 — 00:00 · Reservations held 15 min</p>
      </footer>
    </div>
  );
}

export default Layout;
