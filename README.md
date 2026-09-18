# devEvents

A full-stack event discovery platform for discovering, exploring, and booking technology events.

devEvents is built around a simple idea: make it easier for developers, engineers, founders, and technology communities to find relevant events in one place. The application provides event discovery, detailed event pages, similar-event recommendations, and event booking flows.

## Overview

devEvents is a Next.js application backed by MongoDB and Mongoose.

The application currently supports:

- Event discovery and featured event listings
- Dynamic event detail pages
- Slug-based event URLs
- Event metadata including date, time, location, mode, audience, agenda, organizer, and tags
- Similar-event recommendations based on shared tags
- Event booking UI
- Image optimization through Next.js Image
- MongoDB persistence through Mongoose
- Server-side data fetching
- Serializable data passed from server-side data access into UI components

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 |
| Language | TypeScript |
| UI | React |
| Styling | Tailwind CSS |
| Database | MongoDB |
| ODM | Mongoose |
| Image hosting | Cloudinary |
| Package Manager | npm / pnpm |
| Runtime | Node.js |

## Architecture

The project follows a simple separation between routing, data access, persistence, and presentation.

```text
Browser
   │
   ▼
Next.js App Router
   │
   ├── /events/[slug]
   │       │
   │       ▼
   │   Event Details Page
   │       │
   │       ▼
   │   Data Access Functions
   │       │
   │       ▼
   │   Mongoose
   │       │
   │       ▼
   │   MongoDB
   │
   └── Event UI Components
           │
           ├── EventCard
           ├── EventAgenda
           ├── EventTags
           └── BookEvent
```

The important principle is that React components should not need to understand how MongoDB is queried.

For example:

```text
Event Details Page
        ↓
getEventBySlug(slug)
        ↓
Mongoose query
        ↓
MongoDB
        ↓
Serializable event data
        ↓
React UI
```

This keeps database concerns inside the data-access layer and keeps presentation components focused on rendering.

## Project Structure

A simplified project structure looks like:

```text
devEvents/
├── app/
│   ├── api/
│   │   └── events/
│   │       └── route.ts
│   │
│   ├── events/
│   │   └── [slug]/
│   │       └── page.tsx
│   │
│   ├── layout.tsx
│   ├── page.tsx
│   └── not-found.tsx
│
├── components/
│   ├── BookEvent.tsx
│   ├── button/
│   └── ui/
│       └── EventCard.tsx
│
├── database/
│   ├── index.ts
│   └── models/
│       └── Event.ts
│
├── lib/
│   ├── mongodb.ts
│   ├── fetches/
│   │   └── events.ts
│   └── actions/
│       └── event.actions.ts
│
├── public/
│   └── icons/
│
├── .env.local
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Getting Started

### Prerequisites

Make sure the following are installed:

- Node.js 24+
- npm or pnpm
- A MongoDB database
- Git

Verify your Node.js installation:

```bash
node --version
```

Verify your package manager:

```bash
npm --version
```

or:

```bash
pnpm --version
```

### Clone the Repository

```bash
git clone <repository-url>
cd devEvents
```

### Install Dependencies

Using npm:

```bash
npm install
```

Using pnpm:

```bash
pnpm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
MONGODB_URI="your-mongodb-connection-string"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

Do not commit `.env.local` or expose database credentials in source control.

### Run the Development Server

Using npm:

```bash
npm run dev
```

Using pnpm:

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

## Data Model

Events are stored in MongoDB using a Mongoose schema.

A simplified event document looks like:

```ts
{
  title: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  date: string;
  time: string;
  mode: "online" | "offline" | "hybrid";
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  slug: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Event Identity

Each event has a MongoDB `_id` for persistence and a unique `slug` for public URLs.

Example:

```text
/events/webflow-lauch-workshop
```

The slug is preferred for public routing because it produces human-readable URLs without exposing MongoDB ObjectIds.

### Data Consistency

The application expects `agenda` and `tags` to be stored as arrays.

Correct:

```json
{
  "agenda": [
    "08:30 AM - 09:30 AM | Keynote",
    "09:45 AM - 11:00 AM | Deep Dives"
  ],
  "tags": [
    "Cloud",
    "DevOps",
    "Kubernetes"
  ]
}
```

Avoid storing arrays as JSON strings:

```json
{
  "tags": [
    "[\"Cloud\", \"DevOps\", \"Kubernetes\"]"
  ]
}
```

Keeping the database shape consistent means the application does not need to parse or normalize malformed data during rendering.

## Event Details

Event detail pages use the Next.js dynamic route:

```text
app/events/[slug]/page.tsx
```

For a request such as:

```text
/events/webflow-lauch-workshop
```

Next.js provides:

```ts
params.slug
```

The page then retrieves the event:

```ts
const event = await getEventBySlug(slug);
```

The resulting flow is:

```text
/events/webflow-lauch-workshop
          ↓
slug = "webflow-lauch-workshop"
          ↓
getEventBySlug(slug)
          ↓
Event.findOne({ slug })
          ↓
MongoDB
          ↓
Event
```

If the event does not exist, the application should render the Next.js 404 experience.

## Similar Events

Similar events are determined using shared tags.

Conceptually:

```text
Current Event
     │
     ├── Cloud
     ├── DevOps
     ├── Kubernetes
     └── AI
          │
          ▼
Find other events
whose tags overlap
with these tags
          │
          ▼
Exclude the current event
          │
          ▼
Return similar events
```

The MongoDB query uses:

```ts
{
  _id: { $ne: event._id },
  tags: { $in: event.tags }
}
```

This means:

1. Do not return the current event.
2. Return events containing at least one tag shared with the current event.

## Database Connection

MongoDB connectivity is centralized in:

```text
lib/mongodb.ts
```

The connection helper caches the Mongoose connection/promise so repeated requests do not unnecessarily establish new database connections.

Conceptually:

```text
Request
  ↓
connectDB()
  ↓
Existing connection?
  ├── Yes → reuse it
  └── No  → establish connection
```

This is particularly important in development environments where Next.js may reload modules frequently.

## API

The project exposes an events API under:

```text
/api/events
```

The API can be used by clients that need HTTP access to event data.

The application itself should generally prefer calling the data-access layer directly from Server Components instead of making an HTTP request from the server to its own API route.

Preferred:

```text
Server Component
      ↓
getEvents()
      ↓
MongoDB
```

Instead of:

```text
Server Component
      ↓
fetch("/api/events")
      ↓
API route
      ↓
MongoDB
```

The second approach introduces an unnecessary HTTP hop when both pieces are running inside the same application.

The API remains useful for external consumers and client-side integrations.

## Server and Client Boundaries

Next.js Server Components can access the database directly through server-side data-access functions.

Client Components should receive serializable data.

MongoDB/Mongoose values such as:

- `ObjectId`
- `Date`
- Mongoose documents

should be converted before crossing a Server Component → Client Component boundary.

For example:

```ts
return {
  ...event,
  _id: event._id.toString(),
  createdAt: event.createdAt.toISOString(),
  updatedAt: event.updatedAt.toISOString(),
};
```

This creates a clean boundary:

```text
MongoDB
   ↓
Mongoose document
   ↓
Data access layer
   ↓
Serializable application data
   ↓
React components
```

## Next.js Dynamic Rendering

The application uses Next.js caching and rendering features.

For request-time database access in routes using `cacheComponents`, the application uses:

```ts
import { connection } from "next/server";

await connection();
```

before accessing request-time data.

This allows Next.js to distinguish dynamic database work from content that can be prerendered.

Avoid using:

```ts
export const dynamic = "force-dynamic";
```

in routes where `cacheComponents` is enabled, because the route segment configuration is incompatible with that configuration.

## Development Guidelines

### Keep Database Logic Out of Components

Avoid writing Mongoose queries directly inside UI components.

Prefer:

```ts
const events = await getEvents();
```

over:

```ts
const events = await Event.find();
```

inside a page component.

### Keep Data Shapes Consistent

If the schema says:

```ts
tags: string[];
```

every event should satisfy that contract.

Do not compensate for inconsistent database records with repeated parsing logic in the UI.

### Serialize Database Values at the Boundary

Convert:

```ts
ObjectId → string
Date → string
```

when returning data intended for UI consumption.

### Use Stable React Keys

Prefer:

```tsx
<EventCard key={event._id} {...event} />
```

over:

```tsx
<EventCard key={index} {...event} />
```

The database identifier represents the identity of the resource and remains stable when the list changes.

## Common Issues

### MongoDB SRV DNS Errors

If MongoDB Atlas reports an error similar to:

```text
querySrv ECONNREFUSED _mongodb._tcp.<cluster>.mongodb.net
```

the problem can be related to Node.js DNS resolution rather than MongoDB credentials.

Check:

```bash
node --version
```

and verify DNS resolution from Node:

```bash
node -e "require('dns').resolveSrv('_mongodb._tcp.<cluster>.mongodb.net', console.log)"
```

Also verify that your installed Node.js version correctly recognizes the system DNS configuration.

### Event Details Page Fails for Some Events

Check that all documents use the same data shape.

For example, this is correct:

```js
tags: ["Cloud", "AI"]
```

while this is a different type of value:

```js
tags: ['["Cloud", "AI"]']
```

The application should not require:

```ts
JSON.parse(tags[0])
```

when `tags` is already an array.

### Similar Events Are Empty

Verify the query has separate MongoDB conditions:

```ts
Event.find({
  _id: { $ne: event._id },
  tags: { $in: event.tags },
});
```

Also verify that:

- The requested slug exists.
- The current event has tags.
- Other events contain overlapping tags.
- Tags use consistent casing and values.
- The current event is excluded intentionally.

## Development Philosophy

devEvents is being developed with an emphasis on understanding the systems behind the application rather than simply making the UI work.

The project uses the following principles:

### Separation of Concerns

```text
Routing
   ↓
Data Access
   ↓
Persistence
   ↓
Domain/Application Data
   ↓
Presentation
```

Each layer should have a clear responsibility.

### Predictable Contracts

A component should be able to assume that its input follows the defined data contract.

If:

```ts
tags: string[]
```

is the contract, the UI should receive a `string[]`, not a JSON string that requires additional parsing.

### Explicit Data Flow

Data should have an understandable path through the application:

```text
User Request
    ↓
Route
    ↓
Page
    ↓
Data Access
    ↓
Database
    ↓
Serialized Data
    ↓
Component
    ↓
Rendered UI
```

Understanding this flow makes debugging substantially easier because each layer can be inspected independently.

## Roadmap

Potential future development areas include:

- [ ] Event creation and management
- [ ] Event editing and deletion
- [ ] User authentication
- [ ] Persistent event bookings
- [ ] Booking confirmation
- [ ] User profiles
- [ ] Search and filtering
- [ ] Event categories
- [ ] Pagination
- [ ] Event sharing
- [ ] Calendar integration
- [ ] Email notifications
- [ ] Organizer accounts
- [ ] Admin dashboard
- [ ] Event analytics
- [ ] Improved recommendation system
- [ ] Automated event validation
- [ ] API documentation
- [ ] Automated testing
- [ ] Production observability

## Contributing

Contributions are welcome.

Before submitting changes:

1. Create a feature branch.
2. Keep changes focused.
3. Follow the existing project structure.
4. Preserve the application's data contracts.
5. Test affected functionality locally.
6. Make sure environment secrets are not committed.
7. Open a pull request describing the change and its impact.

Example:

```bash
git checkout -b feature/event-search
```

Then:

```bash
git add .
git commit -m "feat: add event search"
git push origin feature/event-search
```

## License

License information should be added here once the project's licensing terms have been established.

---

Built with Next.js, React, TypeScript, Mongoose, and MongoDB.
