
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    id: 1,
    name: "Standard",
    tagline: "For casual gaming sessions",
    price: 60,
    unit: "/ hour",
    description: "Enjoy a full hour of gaming on our standard PC stations.",
    features: [
      "1 hour of gaming",
      "Access to available games",
      "Free high-speed internet",
    ],
  },
  {
    id: 2,
    name: "Extended",
    tagline: "For serious players",
    price: 150,
    unit: "for 3 hours",
    description: "More gaming time at a better overall price.",
    features: [
      "3 hours of gaming",
      "Access to available games",
      "Free high-speed internet",
    ],
    featured: true,
    badge: "POPULAR",
  },
  {
    id: 3,
    name: "Marathon",
    tagline: "For the dedicated gamer",
    price: 240,
    unit: "for 5 hours",
    description: "Stay longer and enjoy more time at PC ZONE.",
    features: [
      "5 hours of gaming",
      "Access to available games",
      "Free high-speed internet",
    ],
  },
];

function Pricing() {
  return (
    <main className="pricing-page">
      <div className="pricing-container">
        <header className="pricing-heading">
          <h1>Pay for the hours <span>you play.</span></h1>
          <p>
            Choose the gaming session that fits your schedule.
            No membership fee, just pure gaming.
          </p>
        </header>

        <section className="pricing-grid">
          {plans.map((plan) => (
            <article
              key={plan.id}
              className={`pricing-card ${plan.featured ? "featured" : ""}`}
            >
              {plan.badge && (
                <span className="pricing-badge">{plan.badge}</span>
              )}

              <div className="pricing-card-heading">
                <div>
                  <h3>{plan.name}</h3>
                  <p>{plan.tagline}</p>
                </div>

                {plan.featured && <Sparkles />}
              </div>

              <div className="pricing-price">
                <strong>₱{plan.price.toFixed(2)}</strong>
                <span>{plan.unit}</span>
              </div>

              <p className="pricing-description">
                {plan.description}
              </p>

              <ul className="pricing-features">
                {plan.features.map((feature) => (
                  <li key={feature}>
                    <Check />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>

        <section className="pricing-cta">
          <div>
            <h2>Ready to start gaming?</h2>
            <p>
              Book ahead so your machine is warmed up and waiting.
            </p>
          </div>

          <Link to="/reserve" className="pricing-reserve-button">
            Reserve Now
            <ArrowRight />
          </Link>
        </section>

        <p className="pricing-demo-note">
          * Demo pricing only. Actual rates can be managed through Firebase later.
        </p>
      </div>
    </main>
  );
}

export default Pricing;
