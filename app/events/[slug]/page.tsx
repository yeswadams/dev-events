// events details page:
import { getEventBySlug } from "@/lib/fetches/events";

const EventDetailsPage = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if(!event) {
    return "Event not found"
  }

  console.log(slug);
  return <div>{event.title}</div>;
};

export default EventDetailsPage;
