import ExploreBtn from "@/components/button";
import { events } from "@/lib/constants";
import EventCard from "@/components/ui/EventCard";

const HomePage = () => {
  return (
    <section>
      <h1 className="text-center">
        The Hub of all Tech Events <br /> You Can&apos;t Miss
      </h1>
      <p className="text-center">Hackathons, Meetups and Conferences, All in one Place</p>
      <ExploreBtn />

      <div className="mt-20 space-y-7">
        <h3>Featured Events</h3>
        <ul className="events">
          {events.map((event, i) => (
            <li key={i} className="list-none">
              <EventCard {...event} />
            </li>
        ))}
        </ul>
        
        
        
      </div>
    </section>
  );
}

export default HomePage