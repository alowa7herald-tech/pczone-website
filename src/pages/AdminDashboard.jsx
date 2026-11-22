
import {
  LayoutDashboard,
  Monitor,
  CalendarDays,
  Users,
  ChartNoAxesCombined,
  Settings,
  LogOut,
  Menu,
  X,
  Wallet,
  Clock,
  CheckCircle,
  AlertCircle,
  Mail,
  RefreshCw,
  Search,
  Eye,
  User,
  Copy,
  Wrench,
  CalendarCheck,
  XCircle,
} from "lucide-react";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "../firebase";
import "../styles/AdminDashboard.css";
import AdminReports from "./AdminReports";
import AdminSettings from "./AdminSettings";
import CustomerInvitations from "./CustomerInvitations";

const DEFAULT_STATIONS = Array.from({ length: 12 }, (_, index) => ({
  id: `PC-${String(index + 1).padStart(2, "0")}`,
  status: "Available",
}));

function getStatusIcon(status) {
  if (status === "Occupied") return Clock;
  if (status === "Maintenance") return Wrench;
  return CheckCircle;
}

function AdminDashboard() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");

  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [customersError, setCustomersError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [stations, setStations] = useState(DEFAULT_STATIONS);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [stationsError, setStationsError] = useState("");
  const [updatingStation, setUpdatingStation] = useState("");

  // BOOKINGS
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [bookingsError, setBookingsError] = useState("");
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingFilter, setBookingFilter] = useState("All");
  const [updatingBooking, setUpdatingBooking] = useState("");

  const navigate = useNavigate();

  // ADMIN ACCESS VERIFICATION
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAdmin(false);
        setAdminEmail("");
        setCheckingAccess(false);
        navigate("/login", { replace: true });
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists() && userDoc.data().role === "admin") {
          setIsAdmin(true);
          setAdminEmail(user.email || "");
        } else {
          setIsAdmin(false);
          setAdminEmail("");
          navigate("/profile", { replace: true });
        }
      } catch (error) {
        console.error("Admin verification error:", error);
        setIsAdmin(false);
        setAdminEmail("");
        navigate("/login", { replace: true });
      } finally {
        setCheckingAccess(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // LOAD CUSTOMERS FROM FIRESTORE
  async function loadCustomers() {
    try {
      setCustomersLoading(true);
      setCustomersError("");

      const usersSnapshot = await getDocs(collection(db, "users"));

      const customerList = usersSnapshot.docs
        .map((document) => ({
          id: document.id,
          ...document.data(),
        }))
        .filter((customer) => customer.role === "user");

      setCustomers(customerList);
    } catch (error) {
      console.error("Customer loading error:", error);
      setCustomersError(
        "Unable to load customers. Please check your Firestore permissions."
      );
    } finally {
      setCustomersLoading(false);
    }
  }

  // LOAD AND INITIALIZE PC STATIONS
  async function loadStations() {
    try {
      setStationsLoading(true);
      setStationsError("");

      const stationsSnapshot = await getDocs(collection(db, "stations"));

      const existingStations = new Map(
        stationsSnapshot.docs.map((document) => [
          document.id,
          document.data(),
        ])
      );

      const missingStations = DEFAULT_STATIONS.filter(
        (station) => !existingStations.has(station.id)
      );

      await Promise.all(
        missingStations.map((station) =>
          setDoc(doc(db, "stations", station.id), {
            status: "Available",
          })
        )
      );

      const stationList = DEFAULT_STATIONS.map((station) => ({
        id: station.id,
        status: existingStations.get(station.id)?.status || "Available",
      }));

      setStations(stationList);
    } catch (error) {
      console.error("Station loading error:", error);
      setStationsError(
        "Unable to load PC stations. Please check your Firestore permissions."
      );
    } finally {
      setStationsLoading(false);
    }
  }

  // REAL-TIME BOOKINGS FROM FIRESTORE
  useEffect(() => {
    if (!isAdmin) return;

    setBookingsLoading(true);
    setBookingsError("");

    const unsubscribe = onSnapshot(
      collection(db, "bookings"),
      (snapshot) => {
        const bookingList = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        }));

        bookingList.sort((a, b) => {
          const dateA = a.createdAt?.toMillis?.() || 0;
          const dateB = b.createdAt?.toMillis?.() || 0;
          return dateB - dateA;
        });

        setBookings(bookingList);
        setBookingsError("");
        setBookingsLoading(false);
      },
      (error) => {
        console.error("Booking loading error:", error);
        setBookingsError(
          "Unable to load bookings. Please check your Firestore permissions."
        );
        setBookingsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      loadCustomers();
      loadStations();
    }
  }, [isAdmin]);

  // UPDATE STATION STATUS
  async function handleStationStatusChange(stationId, newStatus) {
    try {
      setUpdatingStation(stationId);
      setStationsError("");

      await setDoc(
        doc(db, "stations", stationId),
        { status: newStatus },
        { merge: true }
      );

      setStations((currentStations) =>
        currentStations.map((station) =>
          station.id === stationId
            ? { ...station, status: newStatus }
            : station
        )
      );
    } catch (error) {
      console.error("Station update error:", error);
      setStationsError(
        "Unable to update station status. Please try again."
      );
    } finally {
      setUpdatingStation("");
    }
  }

  // UPDATE BOOKING STATUS OR PAYMENT STATUS
  async function handleBookingUpdate(bookingId, updates) {
    try {
      setUpdatingBooking(bookingId);
      setBookingsError("");

      await updateDoc(doc(db, "bookings", bookingId), updates);
    } catch (error) {
      console.error("Booking update error:", error);
      setBookingsError(
        "Unable to update this booking. Please try again."
      );
    } finally {
      setUpdatingBooking("");
    }
  }

  // LOGOUT
  async function handleLogout() {
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  // FORMAT DATE
  function formatDate(date) {
    if (!date) return "Not available";

    if (typeof date.toDate === "function") {
      return date.toDate().toLocaleDateString();
    }

    if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split("-");
      return `${month}/${day}/${year}`;
    }

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
      ? "Not available"
      : parsedDate.toLocaleDateString();
  }

  // COPY CUSTOMER USER ID
  async function copyUserId(userId) {
    try {
      await navigator.clipboard.writeText(userId);
      alert("Customer User ID copied!");
    } catch (error) {
      console.error("Copy error:", error);
      alert("Unable to copy User ID.");
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const username = (customer.username || "").toLowerCase();
    const email = (customer.email || "").toLowerCase();
    const search = searchTerm.trim().toLowerCase();

    return username.includes(search) || email.includes(search);
  });

  const filteredBookings = bookings.filter((booking) => {
    const search = bookingSearch.trim().toLowerCase();

    const matchesSearch =
      (booking.id || "").toLowerCase().includes(search) ||
      (booking.customerName || "").toLowerCase().includes(search) ||
      (booking.customerEmail || "").toLowerCase().includes(search) ||
      (booking.stationId || "").toLowerCase().includes(search);

    const matchesFilter =
      bookingFilter === "All" ||
      (booking.status || "").toLowerCase() === bookingFilter.toLowerCase();

    return matchesSearch && matchesFilter;
  });

  const navigation = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "PC Stations", icon: Monitor },
    { name: "Bookings", icon: CalendarDays },
    { name: "Customers", icon: Users },
    { name: "Reports", icon: ChartNoAxesCombined },
    { name: "Settings", icon: Settings },
  ];

  const availableCount = stations.filter(
    (station) => station.status === "Available"
  ).length;

  const today = new Date().toLocaleDateString("en-CA");

  const todayBookings = bookings.filter(
    (booking) => booking.date === today
  ).length;

  const stats = [
    {
      title: "TOTAL REVENUE",
      value: "₱0.00",
      detail: "Payments tracked separately",
      icon: Wallet,
    },
    {
      title: "TOTAL BOOKINGS",
      value: bookingsLoading ? "..." : bookings.length,
      detail: `${todayBookings} reservations today`,
      icon: CalendarDays,
    },
    {
      title: "REGISTERED USERS",
      value: customersLoading ? "..." : customers.length,
      detail: "Total customers",
      icon: Users,
    },
    {
      title: "AVAILABLE PCS",
      value: stationsLoading ? "..." : availableCount,
      detail: "Out of 12 stations",
      icon: Monitor,
    },
  ];

  if (checkingAccess) {
    return (
      <div className="admin-dashboard">
        <main className="admin-main">
          <div className="admin-content">
            <p>Verifying administrator access...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="admin-dashboard">
      <aside className={`admin-sidebar ${menuOpen ? "open" : ""}`}>
        <div className="admin-brand">
          <div className="admin-brand-icon">▱</div>
          <div>
            <h2>PC ZONE</h2>
            <span>ADMIN PANEL</span>
          </div>
        </div>

        <div className="admin-nav-label">MAIN MENU</div>

        <nav className="admin-navigation">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={activePage === item.name ? "active" : ""}
                onClick={() => {
                  setActivePage(item.name);
                  setMenuOpen(false);
                  setSelectedCustomer(null);
                }}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-bottom">
          <button
            type="button"
            className="admin-logout"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <button
            className="admin-menu-button"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>

          <div className="admin-topbar-title">
            <p>PC ZONE MANAGEMENT</p>
            <h1>
              {selectedCustomer ? "Customer Details" : activePage}
            </h1>
          </div>

          <div className="admin-account">
            <div className="admin-avatar">A</div>
            <div>
              <strong>Administrator</strong>
              <span>ADMIN ACCOUNT</span>
            </div>
          </div>
        </header>

        {/* DASHBOARD */}
        {activePage === "Dashboard" && (
          <div className="admin-content">
            <div className="admin-welcome">
              <div>
                <h2>Welcome back, Admin!</h2>
                <p>Here's what's happening at PC ZONE today.</p>
              </div>

              <span className="admin-live-status">
                <span /> SYSTEM ONLINE
              </span>
            </div>

            <section className="admin-stats">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <article className="admin-stat-card" key={stat.title}>
                    <div className="admin-stat-top">
                      <span>{stat.title}</span>
                      <Icon size={21} />
                    </div>

                    <h3>{stat.value}</h3>
                    <p>{stat.detail}</p>
                  </article>
                );
              })}
            </section>

            <section className="admin-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2>PC Station Overview</h2>
                  <p>Current station status</p>
                </div>

                <button onClick={() => setActivePage("PC Stations")}>
                  View all
                </button>
              </div>

              <div className="admin-station-grid">
                {stations.map((station) => {
                  const StatusIcon = getStatusIcon(station.status);

                  return (
                    <div
                      className={`admin-station station-${station.status.toLowerCase()}`}
                      key={station.id}
                    >
                      <Monitor size={22} />
                      <strong>{station.id}</strong>
                      <span>
                        <StatusIcon size={13} />
                        {station.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="admin-panel admin-activity">
              <div className="admin-panel-heading">
                <div>
                  <h2>Recent Activity</h2>
                  <p>Latest system updates</p>
                </div>
              </div>

              <div className="admin-empty">
                <Clock size={28} />
                <p>No recent activity yet.</p>
              </div>
            </section>
          </div>
        )}

        {/* PC STATIONS */}
        {activePage === "PC Stations" && (
          <div className="admin-content">
            <section className="admin-panel admin-stations-management">
              <div className="admin-panel-heading">
                <div>
                  <h2>PC Station Management</h2>
                  <p>Manage the availability of all 12 computers.</p>
                </div>

                <button
                  type="button"
                  onClick={loadStations}
                  disabled={stationsLoading}
                >
                  <RefreshCw size={15} />
                  {stationsLoading ? "Loading..." : "Refresh"}
                </button>
              </div>

              <div className="admin-station-counts">
                <div className="station-count available-count">
                  <CheckCircle size={20} />
                  <div>
                    <strong>{availableCount}</strong>
                    <span>Available</span>
                  </div>
                </div>

                <div className="station-count occupied-count">
                  <Clock size={20} />
                  <div>
                    <strong>
                      {stations.filter((s) => s.status === "Occupied").length}
                    </strong>
                    <span>Occupied</span>
                  </div>
                </div>

                <div className="station-count maintenance-count">
                  <Wrench size={20} />
                  <div>
                    <strong>
                      {stations.filter((s) => s.status === "Maintenance").length}
                    </strong>
                    <span>Maintenance</span>
                  </div>
                </div>
              </div>

              {stationsError && (
                <div className="admin-station-error">
                  <AlertCircle size={18} />
                  <span>{stationsError}</span>
                </div>
              )}

              {stationsLoading ? (
                <div className="admin-empty">
                  <p>Loading PC stations...</p>
                </div>
              ) : (
                <div className="admin-managed-station-grid">
                  {stations.map((station) => {
                    const StatusIcon = getStatusIcon(station.status);

                    return (
                      <article
                        className={`admin-managed-station station-${station.status.toLowerCase()}`}
                        key={station.id}
                      >
                        <div className="managed-station-top">
                          <Monitor size={25} />
                          <span className="managed-station-status">
                            <StatusIcon size={14} />
                            {station.status}
                          </span>
                        </div>

                        <h3>{station.id}</h3>
                        <p>Computer Station</p>

                        <label htmlFor={`status-${station.id}`}>
                          CHANGE STATUS
                        </label>

                        <select
                          id={`status-${station.id}`}
                          value={station.status}
                          disabled={updatingStation === station.id}
                          onChange={(event) =>
                            handleStationStatusChange(
                              station.id,
                              event.target.value
                            )
                          }
                        >
                          <option value="Available">Available</option>
                          <option value="Occupied">Occupied</option>
                          <option value="Maintenance">Maintenance</option>
                        </select>

                        {updatingStation === station.id && (
                          <span className="station-saving">
                            Saving changes...
                          </span>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* BOOKINGS */}
        {activePage === "Bookings" && (
          <div className="admin-content">
            <section className="admin-booking-summary">
              <article className="admin-booking-stat">
                <div className="booking-stat-icon">
                  <CalendarDays size={21} />
                </div>
                <div>
                  <span>TOTAL BOOKINGS</span>
                  <strong>{bookings.length}</strong>
                </div>
              </article>

              <article className="admin-booking-stat">
                <div className="booking-stat-icon upcoming">
                  <CalendarCheck size={21} />
                </div>
                <div>
                  <span>PENDING / CONFIRMED</span>
                  <strong>
                    {
                      bookings.filter(
                        (b) =>
                          b.status === "Pending" ||
                          b.status === "Confirmed"
                      ).length
                    }
                  </strong>
                </div>
              </article>

              <article className="admin-booking-stat">
                <div className="booking-stat-icon completed">
                  <CheckCircle size={21} />
                </div>
                <div>
                  <span>COMPLETED</span>
                  <strong>
                    {bookings.filter((b) => b.status === "Completed").length}
                  </strong>
                </div>
              </article>

              <article className="admin-booking-stat">
                <div className="booking-stat-icon cancelled">
                  <XCircle size={21} />
                </div>
                <div>
                  <span>CANCELLED</span>
                  <strong>
                    {bookings.filter((b) => b.status === "Cancelled").length}
                  </strong>
                </div>
              </article>
            </section>

            <section className="admin-panel admin-bookings-panel">
              <div className="admin-panel-heading">
                <div>
                  <h2>Booking Management</h2>
                  <p>View and manage customer reservations.</p>
                </div>

                <button
                  type="button"
                  onClick={() => setBookingsError("")}
                  disabled={bookingsLoading}
                >
                  <RefreshCw size={15} />
                  Live Updates
                </button>
              </div>

              <div className="admin-booking-toolbar">
                <div className="admin-customer-search">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search booking ID, customer, or station..."
                    value={bookingSearch}
                    onChange={(event) => setBookingSearch(event.target.value)}
                  />
                </div>

                <select
                  className="admin-booking-filter"
                  value={bookingFilter}
                  onChange={(event) => setBookingFilter(event.target.value)}
                >
                  <option value="All">All Bookings</option>
                  <option value="Pending">Pending</option>
                  <option value="Confirmed">Confirmed</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              {bookingsError && (
                <div className="admin-station-error">
                  <AlertCircle size={18} />
                  <span>{bookingsError}</span>
                </div>
              )}

              {bookingsLoading ? (
                <div className="admin-booking-empty">
                  <RefreshCw size={28} />
                  <h3>Loading bookings...</h3>
                  <p>Please wait while reservations are retrieved.</p>
                </div>
              ) : filteredBookings.length === 0 ? (
                <div className="admin-booking-empty">
                  <div className="booking-empty-icon">
                    <CalendarDays size={32} />
                  </div>
                  <h3>
                    {bookingSearch
                      ? "No matching bookings"
                      : "No bookings yet"}
                  </h3>
                  <p>
                    {bookingSearch
                      ? "Try searching with another booking ID, customer, or station."
                      : "Customer reservations will appear here when they are submitted."}
                  </p>
                </div>
              ) : (
                <div className="admin-customer-table-wrapper">
                  <table className="admin-customer-table">
                    <thead>
                      <tr>
                        <th>BOOKING ID</th>
                        <th>CUSTOMER</th>
                        <th>PC STATION</th>
                        <th>DATE</th>
                        <th>START TIME</th>
                        <th>DURATION</th>
                        <th>TOTAL</th>
                        <th>BOOKING STATUS</th>
                        <th>PAYMENT</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredBookings.map((booking) => (
                        <tr key={booking.id}>
                          <td title={booking.id}>
                            {booking.id.slice(0, 8)}
                          </td>

                          <td>
                            <strong>{booking.customerName || "Unknown"}</strong>
                            <br />
                            <small>{booking.customerEmail || ""}</small>
                          </td>

                          <td>{booking.stationLabel || booking.stationId}</td>

                          <td>{formatDate(booking.date)}</td>

                          <td>{booking.startTime || "Not available"}</td>

                          <td>
                            {booking.duration
                              ? `${booking.duration} hour(s)`
                              : "Not available"}
                          </td>

                          <td>
                            ₱{Number(booking.total || 0).toFixed(2)}
                          </td>

                          <td>
                            <select
                              className="admin-booking-status-select"
                              value={booking.status || "Pending"}
                              disabled={updatingBooking === booking.id}
                              onChange={(event) =>
                                handleBookingUpdate(booking.id, {
                                  status: event.target.value,
                                })
                              }
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>

                          <td>
                            <select
                              className="admin-booking-payment-select"
                              value={booking.paymentStatus || "Unpaid"}
                              disabled={updatingBooking === booking.id}
                              onChange={(event) =>
                                handleBookingUpdate(booking.id, {
                                  paymentStatus: event.target.value,
                                })
                              }
                            >
                              <option value="Unpaid">Unpaid</option>
                              <option value="Paid">Paid</option>
                            </select>

                            {updatingBooking === booking.id && (
                              <small className="station-saving">
                                Saving...
                              </small>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* CUSTOMERS */}
        {activePage === "Customers" && (
          <div className="admin-content">
            {!selectedCustomer && <CustomerInvitations />}

            {selectedCustomer ? (
              <section className="admin-panel admin-customer-details">
                <div className="admin-panel-heading">
                  <div>
                    <h2>Customer Information</h2>
                    <p>Complete account information.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    Back to Customers
                  </button>
                </div>

                <div className="admin-customer-profile">
                  <div className="admin-customer-avatar">
                    <User size={35} />
                  </div>

                  <div>
                    <h2>{selectedCustomer.username || "Unnamed Customer"}</h2>
                    <span className="admin-customer-role">CUSTOMER</span>
                  </div>
                </div>

                <div className="admin-detail-grid">
                  <div className="admin-detail-item">
                    <span>USERNAME</span>
                    <strong>{selectedCustomer.username || "Not available"}</strong>
                  </div>

                  <div className="admin-detail-item">
                    <span>EMAIL ADDRESS</span>
                    <strong>{selectedCustomer.email || "Not available"}</strong>
                  </div>

                  <div className="admin-detail-item">
                    <span>ACCOUNT ROLE</span>
                    <strong>{selectedCustomer.role}</strong>
                  </div>

                  <div className="admin-detail-item">
                    <span>DATE REGISTERED</span>
                    <strong>{formatDate(selectedCustomer.createdAt)}</strong>
                  </div>

                  <div className="admin-detail-item admin-detail-userid">
                    <span>FIREBASE USER ID</span>
                    <div>
                      <strong>{selectedCustomer.id}</strong>
                      <button
                        type="button"
                        onClick={() => copyUserId(selectedCustomer.id)}
                        title="Copy User ID"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <section className="admin-panel admin-customers-panel">
                <div className="admin-panel-heading">
                  <div>
                    <h2>Customer Management</h2>
                    <p>View all registered PC ZONE customers.</p>
                  </div>

                  <button
                    type="button"
                    onClick={loadCustomers}
                    disabled={customersLoading}
                  >
                    <RefreshCw size={15} />
                    {customersLoading ? "Loading..." : "Refresh"}
                  </button>
                </div>

                <div className="admin-customer-summary">
                  <Users size={22} />
                  <div>
                    <strong>{customers.length}</strong>
                    <span>Registered Customers</span>
                  </div>
                </div>

                <div className="admin-customer-search">
                  <Search size={18} />
                  <input
                    type="text"
                    placeholder="Search by username or email..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>

                {customersLoading ? (
                  <div className="admin-empty">
                    <p>Loading customers...</p>
                  </div>
                ) : customersError ? (
                  <div className="admin-empty">
                    <AlertCircle size={28} />
                    <p>{customersError}</p>
                  </div>
                ) : filteredCustomers.length === 0 ? (
                  <div className="admin-empty">
                    <Users size={32} />
                    <h3>
                      {customers.length === 0
                        ? "No customers yet"
                        : "No matching customers"}
                    </h3>
                    <p>
                      {customers.length === 0
                        ? "Customer accounts will appear here when you create them."
                        : "Try searching with another username or email."}
                    </p>
                  </div>
                ) : (
                  <div className="admin-customer-table-wrapper">
                    <table className="admin-customer-table">
                      <thead>
                        <tr>
                          <th>USERNAME</th>
                          <th>EMAIL ADDRESS</th>
                          <th>ACCOUNT TYPE</th>
                          <th>DATE REGISTERED</th>
                          <th>ACTION</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredCustomers.map((customer) => (
                          <tr key={customer.id}>
                            <td>{customer.username || "Unnamed Customer"}</td>
                            <td>
                              <span className="admin-customer-email">
                                <Mail size={14} />
                                {customer.email || "No email"}
                              </span>
                            </td>
                            <td>
                              <span className="admin-customer-role">
                                CUSTOMER
                              </span>
                            </td>
                            <td>{formatDate(customer.createdAt)}</td>
                            <td>
                              <button
                                type="button"
                                className="admin-view-customer"
                                onClick={() => setSelectedCustomer(customer)}
                              >
                                <Eye size={15} />
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </div>
        )}

        {/* REPORTS */}
        {activePage === "Reports" && (
          <AdminReports
            customers={customers}
            stations={stations}
          />
        )}

        {/* SETTINGS */}
        {activePage === "Settings" && (
          <AdminSettings adminEmail={adminEmail} />
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
