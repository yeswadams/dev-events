// events details page:
import { getEventBySlug } from "@/lib/fetches/events";
import Image from "next/image";
import { IEvent } from "@/database";
import BookEvent from "@/components/BookEvent";
import { getSimilarEventsBySlug } from "@/lib/actions/event.actions";
import EventCard from "@/components/ui/EventCard";

type PropsType = {
  icon: string;
  alt: string;
  label: string;
};



const EventDetailsPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  const bookings = 10;

  const similarEvents: IEvent[] = await getSimilarEventsBySlug(slug);

  const {
    title,
    description,
    image,
    overview,
    date,
    time,
    location,
    mode,
    agenda,
    audience,
    tags,
    organizer
  }: IEvent = event;

  if (!event) {
    return "Event not found";
  }

  return (
    <section id="event">
      <div className="header">
        <h1>{title}</h1>
        <p className="mt-2">{description}</p>
      </div>

      <div className="details">
        {/* left side */}
        <div className="content">
          <Image
            src={image}
            alt="Event Banner"
            width={800}
            height={800}
            className="banner"
          />

          <section className="flex flex-col gap-2">
            <h2>Overview</h2>
            <p>{overview}</p>
          </section>

          <section className="flex flex-col gap-2">
            <h2>Event Details</h2>
            <EventDetailItem
              icon="/icons/calendar.svg"
              alt="calendar"
              label={date}
            />
            <EventDetailItem
              icon="/icons/clock.svg"
              alt="calendar"
              label={time}
            />
            <EventDetailItem
              icon="/icons/pin.svg"
              alt="calendar"
              label={location}
            />
            <EventDetailItem
              icon="/icons/mode.svg"
              alt="calendar"
              label={mode}
            />
            <EventDetailItem
              icon="/icons/audience.svg"
              alt="calendar"
              label={audience}
            />
          </section>

          <EventAgenda agendaItems={JSON.parse(agenda[0])} />

          <section className="flex-col-gap-2">
            <h2>About the Organizer</h2>
            <p>{organizer}</p>
          </section>

          <EventTags tags={JSON.parse(tags[0])} />
        </div>

        {/* Right side */}
        <aside className="booking">
            <div className="signup-card">
                <h2>Book Your Spot</h2>
                {bookings > 0 ? (
                    <p className='text-sm'>
                        Join {bookings} people who have already booked their spot
                    </p>
                ): (
                    <p className="text-sm">
                        Be the first to book
                    </p>
                )}
                <BookEvent />
            </div>
        </aside>
      </div>

      <div className="flex w-full flex-col gap-4 pt-20">
        <h2>Similar Events</h2>
        <div className='events'>
            {similarEvents.length > 0 && similarEvents.map((similarEvent: IEvent) => (
                <EventCard key={similarEvent.id} {...similarEvent} />
            ))}
        </div>
      </div>
    </section>
  );
};

export default EventDetailsPage;

const EventDetailItem = ({ icon, alt, label }: PropsType) => {
  return (
    <div className="flex-row-gap-2">
      <Image src={icon} alt={alt} width={17} height={17} />
      <p className="capitalize">{label}</p>
    </div>
  );
};

const EventAgenda = ({ agendaItems }: { agendaItems: string[] }) => {
  return (
    <div>
      <h2>Agenda</h2>
      <ul className="gap-2 mt-2">
        {agendaItems.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

const EventTags = ({tags}: {tags: string[]}) => (
        <div className='flex flex-row gap-1.5 flex-wrap'>
            {tags.map((tag) => (
                <div className="pill" key={tag}>
                    {tag}
                </div>
            ))}
        </div>
)
