
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import {
  User,
  CalendarDays,
  Clock,
  Monitor,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";

import { auth, db } from "../firebase";

function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [bookings, setBookings] = useState([]);
  const [stations, setStations] = useState([]);

  const [activeSection, setActiveSection] = useState(null);
  const [dataError, setDataError] = useState("");

  useEffect(() => {
    let unsubscribeBookings = null;
    let unsubscribeStations = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setUserData(null);
      setBookings([]);
      setStations([]);
      setActiveSection(null);
      setDataError("");

      if (unsubscribeBookings) unsubscribeBookings();
      if (unsubscribeStations) unsubscribeStations();

      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        // Listen to this customer's bookings.
        const bookingsQuery = query(
          collection(db, "bookings"),
          where("userId", "==", user.uid)
        );

        unsubscribeBookings = onSnapshot(
          bookingsQuery,
          (snapshot) => {
            const bookingList = snapshot.docs.map((bookingDoc) => ({
              id: bookingDoc.id,
              ...bookingDoc.data(),
            }));

            setBookings(bookingList);
          },
          (error) => {
            console.error("Bookings error:", error);
            setDataError("Unable to load your bookings.");
          }
        );

        // Listen to all PC stations.
        unsubscribeStations = onSnapshot(
          collection(db, "stations"),
          (snapshot) => {
            const stationList = snapshot.docs.map((stationDoc) => ({
              id: stationDoc.id,
              ...stationDoc.data(),
            }));

            setStations(stationList);
          },
          (error) => {
            console.error("Stations error:", error);
            setDataError("Unable to load gaming stations.");
          }
        );
      } catch (error) {
        console.error("Profile error:", error);
        setDataError("Unable to load your profile information.");
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();

      if (unsubscribeBookings) unsubscribeBookings();
      if (unsubscribeStations) unsubscribeStations();
    };
  }, []);

  const getBookingDate = (booking) => {
    if (!booking.date) return null;

    const date = new Date(
      `${booking.date}T${booking.startTime || "00:00"}`
    );

    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date unavailable";

    const date = new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) return dateString;

    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time) => {
    if (!time) return "Time unavailable";

    const [hours, minutes] = time.split(":");
    const date = new Date();

    date.setHours(Number(hours), Number(minutes || 0), 0, 0);

    return date.toLocaleTimeString("en-PH", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatMoney = (amount) => {
    return `₱${Number(amount || 0).toFixed(2)}`;
  };

  const upcomingBookings = bookings
    .filter((booking) => {
      const date = getBookingDate(booking);
      const status = (booking.status || "").toLowerCase();

      return (
        date &&
        date >= new Date() &&
        status !== "cancelled" &&
        status !== "completed"
      );
    })
    .sort((a, b) => getBookingDate(a) - getBookingDate(b));

  const bookingHistory = bookings
    .filter((booking) => {
      const date = getBookingDate(booking);
      const status = (booking.status || "").toLowerCase();

      return (
        status === "completed" ||
        status === "cancelled" ||
        (date && date < new Date())
      );
    })
    .sort((a, b) => getBookingDate(b) - getBookingDate(a));

  const getStationStatus = (station) => {
    const status = (station.status || "").toLowerCase();

    if (status === "maintenance") return "Maintenance";
    if (status === "offline") return "Offline";
    if (status === "occupied" || station.occupied) return "Occupied";

    return "Available";
  };

  const toggleSection = (section) => {
    setActiveSection((current) =>
      current === section ? null : section
    );
  };

  if (loading) {
    return <main className="profile-page">Loading profile...</main>;
  }

  if (!userData) {
    return (
      <main className="profile-page">
        <h1>PROFILE NOT FOUND</h1>
        <p>Please log in to view your account.</p>
        <Link to="/login" className="book-button">
          LOG IN
        </Link>
      </main>
    );
  }

  return (
    <main className="profile-page">
      <section className="profile-header">
        <p className="section-eyebrow">PLAYER ACCOUNT</p>
        <h1>MY PROFILE</h1>
        <p>Manage your PC ZONE gaming account.</p>
      </section>

      <section className="profile-card">
        <div className="profile-avatar">
          <User size={40} />
        </div>

        <div>
          <h2>Welcome, {userData.username || "Player"}!</h2>
          <p>{userData.email || auth.currentUser?.email}</p>
          <p>Account Type: {userData.role}</p>
        </div>
      </section>

      {dataError && <p role="alert">{dataError}</p>}

      <section className="profile-options">
        <button
          type="button"
          className="profile-option"
          onClick={() => toggleSection("reservations")}
          aria-expanded={activeSection === "reservations"}
          style={{ textAlign: "left", width: "100%", cursor: "pointer" }}
        >
          <CalendarDays />
          <h3>My Reservations</h3>
          <p>View your upcoming bookings.</p>
          <span>
            {upcomingBookings.length} upcoming
            {activeSection === "reservations" ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </span>
        </button>

        <button
          type="button"
          className="profile-option"
          onClick={() => toggleSection("history")}
          aria-expanded={activeSection === "history"}
          style={{ textAlign: "left", width: "100%", cursor: "pointer" }}
        >
          <Clock />
          <h3>Booking History</h3>
          <p>Check your previous sessions.</p>
          <span>
            {bookingHistory.length} past bookings
            {activeSection === "history" ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </span>
        </button>

        <button
          type="button"
          className="profile-option"
          onClick={() => toggleSection("stations")}
          aria-expanded={activeSection === "stations"}
          style={{ textAlign: "left", width: "100%", cursor: "pointer" }}
        >
          <Monitor />
          <h3>Gaming Stations</h3>
          <p>Explore available PC stations.</p>
          <span>
            {stations.length} stations
            {activeSection === "stations" ? (
              <ChevronUp size={18} />
            ) : (
              <ChevronDown size={18} />
            )}
          </span>
        </button>
      </section>

      {activeSection && (
        <section className="profile-details">
          {activeSection === "reservations" && (
            <>
              <h2>MY RESERVATIONS</h2>

              {upcomingBookings.length === 0 ? (
                <p>You don't have any upcoming reservations.</p>
              ) : (
                upcomingBookings.map((booking) => (
                  <div className="profile-booking" key={booking.id}>
                    <h3>{booking.stationLabel || booking.stationId}</h3>
                    <p>Date: {formatDate(booking.date)}</p>
                    <p>Start: {formatTime(booking.startTime)}</p>
                    <p>Duration: {booking.duration} hour(s)</p>
                    <p>Total: {formatMoney(booking.total)}</p>
                    <p>Status: {booking.status}</p>
                    <p>Payment: {booking.paymentStatus || "Unpaid"}</p>
                  </div>
                ))
              )}
            </>
          )}

          {activeSection === "history" && (
            <>
              <h2>BOOKING HISTORY</h2>

              {bookingHistory.length === 0 ? (
                <p>You don't have any previous bookings yet.</p>
              ) : (
                bookingHistory.map((booking) => (
                  <div className="profile-booking" key={booking.id}>
                    <h3>{booking.stationLabel || booking.stationId}</h3>
                    <p>Date: {formatDate(booking.date)}</p>
                    <p>Start: {formatTime(booking.startTime)}</p>
                    <p>Duration: {booking.duration} hour(s)</p>
                    <p>Total: {formatMoney(booking.total)}</p>
                    <p>Status: {booking.status}</p>
                    <p>Payment: {booking.paymentStatus || "Unpaid"}</p>
                  </div>
                ))
              )}
            </>
          )}

          {activeSection === "stations" && (
            <>
              <h2>GAMING STATIONS</h2>

              {stations.length === 0 ? (
                <p>No gaming stations are registered yet.</p>
              ) : (
                stations.map((station) => (
                  <div className="profile-booking" key={station.id}>
                    <h3>{station.label || station.name || station.id}</h3>
                    <p>
                      Status: <strong>{getStationStatus(station)}</strong>
                    </p>
                    {station.hourly_rate !== undefined && (
                      <p>
                        Rate: {formatMoney(station.hourly_rate)} / hour
                      </p>
                    )}
                  </div>
                ))
              )}
            </>
          )}
        </section>
      )}

      <Link to="/reserve" className="book-button">
        BOOK A STATION <ArrowRight size={18} />
      </Link>
    </main>
  );
}

export default Profile;
