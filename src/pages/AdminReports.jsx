
import { useMemo, useState } from "react";
import {
  Users,
  Monitor,
  CalendarDays,
  Wallet,
  CheckCircle,
  Clock,
  Wrench,
  AlertCircle,
} from "lucide-react";

function getDateValue(date) {
  if (!date) return null;

  const value =
    typeof date.toDate === "function" ? date.toDate() : new Date(date);

  return Number.isNaN(value.getTime()) ? null : value;
}

function AdminReports({ customers = [], stations = [] }) {
  const [dateFilter, setDateFilter] = useState("all");

  const filteredCustomers = useMemo(() => {
    const now = new Date();

    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    if (dateFilter === "week") {
      const day = start.getDay();
      start.setDate(start.getDate() - day);
    } else if (dateFilter === "month") {
      start.setDate(1);
    }

    return customers.filter((customer) => {
      const registered = getDateValue(customer.createdAt);

      if (!registered) return false;
      if (dateFilter === "all") return true;

      if (dateFilter === "today") {
        return registered >= start;
      }

      if (dateFilter === "week" || dateFilter === "month") {
        return registered >= start;
      }

      return true;
    });
  }, [customers, dateFilter]);

  const available = stations.filter(
    (station) => station.status === "Available"
  ).length;

  const occupied = stations.filter(
    (station) => station.status === "Occupied"
  ).length;

  const maintenance = stations.filter(
    (station) => station.status === "Maintenance"
  ).length;

  const reportCards = [
    {
      title: "REGISTERED CUSTOMERS",
      value: filteredCustomers.length,
      detail:
        dateFilter === "all"
          ? "All registered customers"
          : "Customers registered in selected period",
      icon: Users,
      className: "report-customer",
    },
    {
      title: "TOTAL BOOKINGS",
      value: "Not available",
      detail: "Booking records are not connected yet",
      icon: CalendarDays,
      className: "report-booking",
    },
    {
      title: "TOTAL REVENUE",
      value: "Not available",
      detail: "No payment records are connected",
      icon: Wallet,
      className: "report-revenue",
    },
    {
      title: "TOTAL PC STATIONS",
      value: stations.length,
      detail: "Registered computer stations",
      icon: Monitor,
      className: "report-stations",
    },
  ];

  return (
    <div className="admin-content">
      <section className="admin-report-heading">
        <div>
          <h2>Business Reports</h2>
          <p>Overview of PC ZONE customers and computer stations.</p>
        </div>

        <select
          className="admin-report-filter"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="all">All Time</option>
        </select>
      </section>

      <section className="admin-report-grid">
        {reportCards.map((card) => {
          const Icon = card.icon;

          return (
            <article className="admin-report-card" key={card.title}>
              <div className={`report-icon ${card.className}`}>
                <Icon size={22} />
              </div>

              <span>{card.title}</span>
              <h3>{card.value}</h3>
              <p>{card.detail}</p>
            </article>
          );
        })}
      </section>

      <section className="admin-panel admin-report-station-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>PC Station Report</h2>
            <p>Current status of all computer stations.</p>
          </div>
        </div>

        <div className="admin-report-station-grid">
          <div className="report-station-item">
            <CheckCircle size={23} />
            <div>
              <strong>{available}</strong>
              <span>Available</span>
            </div>
          </div>

          <div className="report-station-item occupied">
            <Clock size={23} />
            <div>
              <strong>{occupied}</strong>
              <span>Occupied</span>
            </div>
          </div>

          <div className="report-station-item maintenance">
            <Wrench size={23} />
            <div>
              <strong>{maintenance}</strong>
              <span>Maintenance</span>
            </div>
          </div>
        </div>

        <div className="admin-report-progress">
          <div>
            <span>Available</span>
            <strong>{available}</strong>
          </div>
          <div className="report-progress-track">
            <div
              className="report-progress-available"
              style={{
                width: `${stations.length ? (available / stations.length) * 100 : 0}%`,
              }}
            />
          </div>

          <div>
            <span>Occupied</span>
            <strong>{occupied}</strong>
          </div>
          <div className="report-progress-track">
            <div
              className="report-progress-occupied"
              style={{
                width: `${stations.length ? (occupied / stations.length) * 100 : 0}%`,
              }}
            />
          </div>

          <div>
            <span>Maintenance</span>
            <strong>{maintenance}</strong>
          </div>
          <div className="report-progress-track">
            <div
              className="report-progress-maintenance"
              style={{
                width: `${stations.length ? (maintenance / stations.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      </section>

      <section className="admin-panel admin-report-customer-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Customer Registration Report</h2>
            <p>
              {filteredCustomers.length} customer(s) in the selected period.
            </p>
          </div>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="admin-empty">
            <Users size={30} />
            <p>No customer registrations found for this period.</p>
          </div>
        ) : (
          <div className="admin-customer-table-wrapper">
            <table className="admin-customer-table">
              <thead>
                <tr>
                  <th>USERNAME</th>
                  <th>EMAIL ADDRESS</th>
                  <th>DATE REGISTERED</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => {
                  const date = getDateValue(customer.createdAt);

                  return (
                    <tr key={customer.id}>
                      <td>{customer.username || "Unnamed Customer"}</td>
                      <td>{customer.email || "No email"}</td>
                      <td>
                        {date ? date.toLocaleDateString() : "Not available"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="admin-report-notice">
        <AlertCircle size={18} />
        <p>
          Booking and revenue reports are not available yet because actual
          booking and payment records have not been connected. Payments remain
          over the counter.
        </p>
      </div>
    </div>
  );
}

export default AdminReports;
