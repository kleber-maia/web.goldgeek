import { formatDate } from "@/lib/account";

interface TimelineProps {
  events: { event: string; date: string | Date; description?: string }[];
}

export default function Timeline({ events }: TimelineProps) {
  // Display events in reverse chronological order (newest first)
  const sortedEvents = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="account-timeline">
      {sortedEvents.length === 0 && <p>No updates yet.</p>}
      {sortedEvents.map((event, index) => (
        <div key={index} className="account-timeline-item">
          <div className="account-timeline-text">{event.event}</div>
          {event.description && <p className="text-sm text-gray-600">{event.description}</p>}
          <div className="account-timeline-date">{formatDate(event.date)}</div>
        </div>
      ))}
    </div>
  );
}
