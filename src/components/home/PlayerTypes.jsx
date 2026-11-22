
import { Crosshair, Joystick, Users } from "lucide-react";
import SectionHeading from "../SectionHeading";

const playerTypes = [
  {
    icon: Crosshair,
    title: "Competitive",
    subtitle: "Ranked-ready rigs",
    description:
      "High refresh displays and consistent frame times, so the only variable left is you.",
  },
  {
    icon: Joystick,
    title: "Casual",
    subtitle: "Zero setup nights",
    description:
      "Every machine boots straight into the games you already play. Show up, log in, relax.",
  },
  {
    icon: Users,
    title: "Squads",
    subtitle: "Sit together",
    description:
      "Book neighbouring stations for the whole group and keep the voice chat in the same room.",
  },
];

function PlayerTypes() {
  return (
    <section className="player-types-section">
      <SectionHeading
        title="Built for every kind of player"
        description="Solo grinders, casual evenings and full squads — the floor is laid out so everyone lands on a machine that fits."
      />

      <div className="player-types-grid">
        {playerTypes.map(({ icon: Icon, title, subtitle, description }) => (
          <article className="player-card" key={title}>
            <Icon className="player-card-icon" />
            <p className="player-card-tag">{subtitle}</p>
            <h3>{title}</h3>
            <p className="player-card-copy">{description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default PlayerTypes;
