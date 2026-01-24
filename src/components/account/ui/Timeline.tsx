import { TimelineEvent, formatDate } from "@/lib/account";

interface TimelineProps {
  events: TimelineEvent[];
}

export default function Timeline({ events }: TimelineProps) {
  // Display events in reverse chronological order (newest first)
  const sortedEvents = [...events].reverse();

  return (
    <div className="account-timeline">
      {sortedEvents.map((event, index) => (
        <div key={index} className="account-timeline-item">
          <div className="account-timeline-text">{event.event}</div>
          <div className="account-timeline-date">{formatDate(event.date)}</div>
        </div>
      ))}
    </div>
  );
}
