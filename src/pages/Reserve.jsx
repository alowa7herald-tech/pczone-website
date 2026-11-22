
import { useEffect, useState } from "react";
import {
  CalendarDays,
  Clock,
  Timer,
  Monitor,
  Wrench,
  CheckCircle2,
  ArrowRight,
  CalendarCheck,
  AlertCircle,
} from "lucide-react";

import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../firebase";

const getToday = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const defaultStations = Array.from({ length: 12 }, (_, index) => ({
  id: `PC-${String(index + 1).padStart(2, "0")}`,
  label: `PC ${String(index + 1).padStart(2, "0")}`,
  status: "available",
  hourly_rate: 60,
}));

const timeSlots = Array.from({ length: 14 }, (_, index) => {
  const hour = index + 10;
  return `${String(hour).padStart(2, "0")}:00`;
});

function Reserve() {
  const [date, setDate] = useState(getToday);
  const [startTime, setStartTime] = useState("18:00");
  const [duration, setDuration] = useState(2);
  const [selectedId, setSelectedId] = useState(null);
  const [checked, setChecked] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState(null);
  const [confirmation, setConfirmation] = useState(false);

  const [stations, setStations] = useState(defaultStations);
  const [loading, setLoading] = useState(true);
  const [stationsError, setStationsError] = useState("");

  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "stations"),
      (snapshot) => {
        const stationData = new Map(
          snapshot.docs.map((document) => [
            document.id,
            document.data(),
          ])
        );

        const updatedStations = defaultStations.map((station) => {
          const data = stationData.get(station.id);

          return {
            ...station,
            status: (data?.status || "Available").toLowerCase(),
            hourly_rate: Number(data?.hourly_rate) || station.hourly_rate,
          };
        });

        setStations(updatedStations);
        setStationsError("");
        setLoading(false);
      },
      (error) => {
        console.error("Reservation station loading error:", error);
        setStationsError(
          "Unable to load station availability. Please try again later."
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const selectedStation = stations.find(
    (station) =>
      station.id === selectedId &&
      station.status === "available"
  );

  const total = selectedStation
    ? selectedStation.hourly_rate * duration
    : 0;

  const availableCount = stations.filter(
    (station) => station.status === "available"
  ).length;

  function checkAvailability() {
    if (loading || stationsError) return;

    setChecked(true);
    setSelectedId(null);
    setConfirmation(false);
    setBookingError("");

    setAvailabilityMessage({
      tone: "success",
      message: `${availableCount} stations are currently available.`,
    });
  }

  function selectStation(station) {
    if (loading || stationsError || station.status !== "available") {
      return;
    }

    setSelectedId((current) =>
      current === station.id ? null : station.id
    );

    setConfirmation(false);
    setBookingError("");
  }

  async function bookStation() {
    if (!selectedStation || bookingLoading) return;

    setBookingError("");
    setConfirmation(false);

    try {
      const user = auth.currentUser;

      if (!user) {
        setBookingError("Please log in before making a reservation.");
        return;
      }

      setBookingLoading(true);

      const stationRef = doc(db, "stations", selectedStation.id);
      const stationSnapshot = await getDoc(stationRef);

      if (stationSnapshot.exists()) {
        const latestStatus = (
          stationSnapshot.data().status || "Available"
        ).toLowerCase();

        if (latestStatus !== "available") {
          setBookingError(
            "This station is no longer available. Please select another station."
          );
          return;
        }
      }

      const userRef = doc(db, "users", user.uid);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        setBookingError(
          "Your customer profile could not be found. Please contact the administrator."
        );
        return;
      }

      const userData = userSnapshot.data();

      await addDoc(collection(db, "bookings"), {
        userId: user.uid,
        customerName: userData.username || user.email,
        customerEmail: user.email || "",
        stationId: selectedStation.id,
        stationLabel: selectedStation.label,
        date: date,
        startTime: startTime,
        duration: duration,
        hourlyRate: selectedStation.hourly_rate,
        total: total,
        status: "Pending",
        paymentStatus: "Unpaid",
        createdAt: serverTimestamp(),
      });

      setConfirmation(true);
      setAvailabilityMessage(null);
    } catch (error) {
      console.error("Booking submission error:", error);

      setBookingError(
        "Unable to save your reservation. Please try again."
      );
    } finally {
      setBookingLoading(false);
    }
  }

  return (
    <main className="reserve-page">
      <div className="reserve-container">
        <header className="reserve-heading">
          <h1>Lock your <span>seat.</span></h1>
          <p>
            Choose your session, find an available station,
            and secure your spot at PC ZONE.
          </p>
        </header>

        <div className="reserve-layout">
          <section className="session-panel">
            <div className="reserve-panel-heading">
              <span><CalendarDays /></span>
              <div>
                <h2>Session Details</h2>
                <p>STEP 01 — SET YOUR WINDOW</p>
              </div>
            </div>

            <div className="reserve-field">
              <label htmlFor="reserve-date">Date</label>
              <input
                id="reserve-date"
                type="date"
                min={getToday()}
                value={date}
                onChange={(event) => {
                  setDate(event.target.value);
                  setSelectedId(null);
                  setChecked(false);
                  setAvailabilityMessage(null);
                  setConfirmation(false);
                  setBookingError("");
                }}
              />
            </div>

            <div className="reserve-field">
              <label htmlFor="reserve-time">Start Time</label>
              <select
                id="reserve-time"
                value={startTime}
                onChange={(event) => {
                  setStartTime(event.target.value);
                  setSelectedId(null);
                  setChecked(false);
                  setAvailabilityMessage(null);
                  setConfirmation(false);
                  setBookingError("");
                }}
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            <div className="reserve-field">
              <label><Timer /> Duration</label>
              <div className="duration-options">
                {[1, 2, 3].map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    className={duration === hours ? "active" : ""}
                    onClick={() => {
                      setDuration(hours);
                      setSelectedId(null);
                      setChecked(false);
                      setAvailabilityMessage(null);
                      setConfirmation(false);
                      setBookingError("");
                    }}
                  >
                    {hours}h
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              className="availability-button"
              onClick={checkAvailability}
              disabled={loading || !!stationsError}
            >
              <Clock size={17} />
              Check Availability
            </button>

            {availabilityMessage && (
              <div className="availability-message">
                <CheckCircle2 size={17} />
                {availabilityMessage.message}
              </div>
            )}
          </section>

          <section className="floor-selection">
            <div className="reserve-panel-heading">
              <span><Monitor /></span>
              <div>
                <h2>Select Your Station</h2>
                <p>STEP 02 — PICK YOUR RIG</p>
              </div>
            </div>

            <div className="reserve-floor-info">
              <span>PC ZONE FLOOR PLAN</span>
              <span className="floor-live">
                <i /> LIVE STATUS
              </span>
            </div>

            {stationsError && (
              <div className="availability-message">
                <AlertCircle size={17} />
                {stationsError}
              </div>
            )}

            <div className="reserve-station-grid">
              {loading
                ? defaultStations.map((station) => (
                    <button
                      key={station.id}
                      type="button"
                      className="reserve-station"
                      disabled
                    >
                      <Monitor />
                      <strong>{station.label}</strong>
                      <small>LOADING</small>
                    </button>
                  ))
                : stations.map((station) => {
                    const selected = selectedId === station.id;

                    return (
                      <button
                        key={station.id}
                        type="button"
                        disabled={
                          !!stationsError ||
                          station.status !== "available"
                        }
                        onClick={() => selectStation(station)}
                        className={`reserve-station ${station.status} ${
                          selected ? "selected" : ""
                        }`}
                      >
                        {station.status === "maintenance"
                          ? <Wrench />
                          : <Monitor />
                        }

                        <strong>{station.label}</strong>

                        <small>
                          {selected
                            ? "SELECTED"
                            : station.status === "occupied"
                              ? "IN USE"
                              : station.status === "maintenance"
                                ? "MAINTENANCE"
                                : "AVAILABLE"}
                        </small>
                      </button>
                    );
                  })}
            </div>

            <div className="reserve-legend">
              <span><i className="legend-free" /> Available</span>
              <span><i className="legend-selected" /> Selected</span>
              <span><i className="legend-busy" /> In use</span>
              <span><i className="legend-repair" /> Maintenance</span>
            </div>

            {!checked && (
              <p className="reserve-hint">
                Check availability to review your selected session.
              </p>
            )}
          </section>
        </div>

        <section className="booking-summary">
          <div>
            <p>YOUR RESERVATION</p>
            <h2>
              {selectedStation
                ? selectedStation.label
                : "No station selected"}
            </h2>
            <span>
              {date} · {startTime} · {duration} hour(s)
            </span>
          </div>

          <div className="booking-total">
            <p>TOTAL PRICE</p>
            <h2>₱{total.toFixed(2)}</h2>
          </div>

          <button
            type="button"
            disabled={
              !selectedStation ||
              loading ||
              !!stationsError ||
              bookingLoading
            }
            onClick={bookStation}
          >
            <CalendarCheck size={17} />
            {bookingLoading ? "SAVING..." : "Book Your Seat"}
            {!bookingLoading && <ArrowRight size={17} />}
          </button>
        </section>

        {bookingError && (
          <div className="booking-confirmation">
            <AlertCircle />
            <div>
              <h3>Reservation Not Submitted</h3>
              <p>{bookingError}</p>
            </div>
          </div>
        )}

        {confirmation && selectedStation && (
          <div className="booking-confirmation">
            <CheckCircle2 />
            <div>
              <h3>Reservation Submitted Successfully!</h3>
              <p>
                {selectedStation.label} · {date} · {startTime}
                {" · "}₱{total.toFixed(2)}
              </p>
              <small>
                Your reservation is pending. Please pay over the counter.
              </small>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default Reserve;
