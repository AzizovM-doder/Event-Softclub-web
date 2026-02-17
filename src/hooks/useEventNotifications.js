import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { pushNotification, markFired } from "../features/notifications/notificationsSlice";
import { playNotificationSound } from "../utils/sound";

const DEFAULT_INTERVAL = 10_000;

const THRESHOLDS = [
  { key: "1d", label: "1 day", ms: 24 * 60 * 60 * 1000 },
  { key: "12h", label: "12 hours", ms: 12 * 60 * 60 * 1000 },
  { key: "6h", label: "6 hours", ms: 6 * 60 * 60 * 1000 },
  { key: "3h", label: "3 hours", ms: 3 * 60 * 60 * 1000 },
  { key: "1h", label: "1 hour", ms: 60 * 60 * 1000 },
  { key: "30m", label: "30 minutes", ms: 30 * 60 * 1000 },
  { key: "15m", label: "15 minutes", ms: 15 * 60 * 1000 },
  { key: "10m", label: "10 minutes", ms: 10 * 60 * 1000 },
  { key: "5m", label: "5 minutes", ms: 5 * 60 * 1000 },
];


// ✅ extract HH:mm from any ISO string without timezone shifting
function extractHHMM(iso) {
  if (!iso || typeof iso !== "string") return null;
  const m = iso.match(/T(\d{2}):(\d{2})/);
  if (!m) return null;
  return { hh: Number(m[1]), mm: Number(m[2]) };
}

// ✅ MAIN: build local datetime (no UTC)
function getEventStartLocal(e) {
  if (!e?.date) return null;

  // date string like "2026-02-13T00:00:00.000Z"
  // we only need YYYY-MM-DD (no timezone)
  const dm = String(e.date).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!dm) return null;

  const y = Number(dm[1]);
  const mo = Number(dm[2]) - 1;
  const da = Number(dm[3]);

  // time can be 1970... or 2026... doesn't matter, take HH:mm from string
  const hm = extractHHMM(e.time) || { hh: 0, mm: 0 };

  // ✅ local start (this respects your +05 automatically)
  return new Date(y, mo, da, hm.hh, hm.mm, 0, 0);
}

export default function useEventNotifications(events = [], opts = {}) {
  const dispatch = useDispatch();
  const { firedIds } = useSelector((s) => s.notifications); // ✅ Get global fired history
  const interval = opts.pollMs ?? DEFAULT_INTERVAL;

  const prevDiff = useRef(new Map());

  // We don't need a local 'fired' set anymore, we use Redux 'firedIds'
  // But strictly for the "first encounter" logic, we might want to know if we just fired it in this tick? 
  // actually Redux state update is enough.

  useEffect(() => {
    const tick = () => {
      const now = Date.now();

      for (const e of events) {
        if (!e?.id || !e?.title) continue;
        if (e.status === false) continue; // bool check just in case, though schema is enum now

        const start = getEventStartLocal(e);
        if (!start || Number.isNaN(start.getTime())) continue;

        const diff = start.getTime() - now;
        if (diff <= 0) continue;

        // On first encounter, find closest threshold and only notify if NOT ALREADY fired globally
        const firstKey = `${e.id}__seen`;
        const isFirstEncounter = !prevDiff.current.has(firstKey);

        if (isFirstEncounter) {
          prevDiff.current.set(firstKey, true);

          // Find closest matching threshold
          let closestIdx = -1;
          for (let i = 0; i < THRESHOLDS.length; i++) {
            if (diff <= THRESHOLDS[i].ms) closestIdx = i;
          }

          // Mark all thresholds as fired (locally in prevDiff to set baseline), 
          // and notify the closest one IF it hasn't been fired globally yet.
          for (let i = 0; i < THRESHOLDS.length; i++) {
            const th = THRESHOLDS[i];
            const k = `${e.id}_${th.key}`;

            if (diff <= th.ms) {
              // Always update prevDiff so we don't fire "crossed" event immediately next tick
              prevDiff.current.set(k, diff);

              // Only fire notification for the closest threshold
              if (i === closestIdx) {
                // ✅ Check GLOBAL fired history
                if (firedIds.includes(k)) continue;

                const title = "Event is coming";
                const body = `${th.label} left • ${e.title}`;

                // Mark as fired globally BEFORE (or with) push to prevent double firing
                dispatch(markFired(k));

                dispatch(
                  pushNotification({
                    title,
                    body,
                    eventId: e.id,
                    location: e.location || "",
                    createdAt: Date.now(),
                    read: false,
                  })
                );

                toast(title, { description: body, duration: 6500 });
                playNotificationSound();
              } else {
                // For other thresholds that we are already past (e.g. 3h left, so we are past 6h, 12h etc)
                // We should probably mark them as fired too so we don't fire them if we somehow jump back in time? 
                // Or just leave them. The "crossed" logic requires prev > th.ms, so they won't fire anyway since we set prevDiff to current diff (which is < th.ms)
                // But let's mark them fired to be safe? No, might overly fill state. 
                // Just marking the closest one is sufficient for the "notify me" requirement.
              }
            } else {
              // diff > th.ms (we haven't reached this threshold yet)
              prevDiff.current.set(k, diff);
            }
          }
          continue; // skip normal threshold loop for this event
        }

        // Normal loop: check if we CROSSED a threshold since last tick
        for (const th of THRESHOLDS) {
          const k = `${e.id}_${th.key}`;
          const prev = prevDiff.current.get(k);

          // If we don't have a prev, we can't detect a cross. 
          // (Should be covered by isFirstEncounter, but being safe)
          if (typeof prev !== "number") {
             prevDiff.current.set(k, diff);
             continue;
          }

          const crossed = prev > th.ms && diff <= th.ms;

          if (crossed) {
            // ✅ Check GLOBAL fired history
            if (!firedIds.includes(k)) {
              dispatch(markFired(k));
              
              const title = "Event is coming";
              const body = `${th.label} left • ${e.title}`;

              dispatch(
                pushNotification({
                  title,
                  body,
                  eventId: e.id,
                  location: e.location || "",
                  createdAt: Date.now(),
                  read: false,
                })
              );

              toast(title, { description: body, duration: 6500 });
              playNotificationSound();
            }
          }

          prevDiff.current.set(k, diff);
        }
      }
    };

    tick();
    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [dispatch, events, interval, firedIds]);
}
