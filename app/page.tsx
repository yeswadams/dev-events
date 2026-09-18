// import { connection } from "next/server";
import ExploreBtn from "@/components/button";
import EventCard from "@/components/ui/EventCard";
import { getEvents } from "@/lib/fetches/events";
import { cacheLife } from "next/cache";

// const BASE_URL = process.env.NEXT_BASE_URL;
// export const dynamic = "force-dynamic"; // prevents prerendering of this page at build time, gets rendered when the request arrives.

const HomePage = async () => {
  
  "use cache";
  cacheLife("hours");
  // await connection();

  const events = await getEvents();
  // const res = await fetch(`${BASE_URL}/api/events`);
  // const { events } = await res.json();

  return (
    <section>
      <h1 className="text-center">
        The Hub of all Tech Events <br /> You Can&apos;t Miss
      </h1>
      <p className="text-center">
        Hackathons, Meetups and Conferences, All in one Place
      </p>
      <ExploreBtn />

      <div className="mt-20 space-y-7">
        <h3>Featured Events</h3>
        <ul className="events">
          {events.length > 0 &&
            events.map((event) => (
              <li key={event._id} className="list-none">
                <EventCard {...event} />
              </li>
            ))}
        </ul>
      </div>
    </section>
  );
};

export default HomePage;
