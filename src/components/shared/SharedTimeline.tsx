/**
 * Shared Timeline component for both account and admin dashboards.
 *
 * Usage with account CSS: <SharedTimeline events={[...]} prefix="account" />
 * Usage with admin CSS:   <SharedTimeline events={[...]} prefix="admin" />
 */

interface TimelineEvent {
  event: string;
  date: string | Date;
  description?: string;
}

interface SharedTimelineProps {
  events: TimelineEvent[];
  prefix?: "account" | "admin";
}

function formatTimelineDate(dateInput: string | Date): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function SharedTimeline({
  events,
  prefix = "account",
}: SharedTimelineProps) {
  // Display events in reverse chronological order (newest first)
  const sortedEvents = [...events].reverse();

  return (
    <div className={`${prefix}-timeline`}>
      {sortedEvents.map((event, index) => (
        <div key={index} className={`${prefix}-timeline-item`}>
          <div className={`${prefix}-timeline-text`}>{event.event}</div>
          {event.description && (
            <div
              style={{
                fontSize: "12px",
                color: "#6B7280",
                marginTop: "2px",
              }}
            >
              {event.description}
            </div>
          )}
          <div className={`${prefix}-timeline-date`}>
            {formatTimelineDate(event.date)}
          </div>
        </div>
      ))}
    </div>
  );
}
