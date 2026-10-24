import { useEffect, useRef, useState } from "react";

const CITIES = [
  { city: "Bucharest", zone: "Europe/Bucharest" },
  { city: "London", zone: "Europe/London" },
  { city: "New York", zone: "America/New_York" },
  { city: "Tokyo", zone: "Asia/Tokyo" },
];

const TABS = ["World Clock", "Stopwatch", "Timer"];

function formatDuration(milliseconds, showHundredths = false) {
  const totalCentiseconds = Math.floor(milliseconds / 10);
  const centiseconds = totalCentiseconds % 100;
  const totalSeconds = Math.floor(totalCentiseconds / 100);
  const seconds = totalSeconds % 60;
  const minutes = Math.floor(totalSeconds / 60) % 60;
  const hours = Math.floor(totalSeconds / 3600);
  const base = hours ? `${hours}:${String(minutes).padStart(2, "0")}` : String(minutes).padStart(2, "0");
  return `${base}:${String(seconds).padStart(2, "0")}${showHundredths ? `.${String(centiseconds).padStart(2, "0")}` : ""}`;
}

function cityTime(date, zone, options = {}) {
  return new Intl.DateTimeFormat(undefined, { timeZone: zone, ...options }).format(date);
}

export default function Clock() {
  const [now, setNow] = useState(() => new Date());
  const [activeTab, setActiveTab] = useState("World Clock");
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchStartedAt, setStopwatchStartedAt] = useState(null);
  const [stopwatchElapsed, setStopwatchElapsed] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [timerRemaining, setTimerRemaining] = useState(300);
  const timerRemainingRef = useRef(300);
  const timerDeadline = useRef(null);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!stopwatchRunning || stopwatchStartedAt === null) return undefined;
    const interval = window.setInterval(() => setStopwatchElapsed(Date.now() - stopwatchStartedAt), 40);
    return () => window.clearInterval(interval);
  }, [stopwatchRunning, stopwatchStartedAt]);

  useEffect(() => {
    if (!timerRunning) return undefined;
    timerDeadline.current = Date.now() + timerRemainingRef.current * 1000;
    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((timerDeadline.current - Date.now()) / 1000));
      timerRemainingRef.current = remaining;
      setTimerRemaining(remaining);
      if (remaining === 0) setTimerRunning(false);
    };
    const interval = window.setInterval(() => {
      updateTimer();
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  const startStopwatch = () => {
    setStopwatchStartedAt(Date.now() - stopwatchElapsed);
    setStopwatchRunning(true);
  };

  const stopStopwatch = () => {
    if (stopwatchStartedAt !== null) setStopwatchElapsed(Date.now() - stopwatchStartedAt);
    setStopwatchRunning(false);
  };

  const adjustTimer = (amount) => {
    const next = Math.min(99 * 60 + 59, Math.max(0, timerSeconds + amount));
    setTimerSeconds(next);
    if (!timerRunning) {
      timerRemainingRef.current = next;
      setTimerRemaining(next);
    }
  };

  const hour = now.getHours() % 12;
  const minute = now.getMinutes();
  const second = now.getSeconds();

  return (
    <section className="flex h-full min-h-0 flex-col bg-[#17181b] text-white">
      <nav className="flex shrink-0 gap-1 border-b border-white/10 px-4 pt-3" aria-label="Clock views">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-t-lg px-3 py-2 text-xs transition ${
              activeTab === tab ? "border-b-2 border-[#ff9f0a] text-white" : "text-white/50 hover:text-white/80"
            }`}
            aria-pressed={activeTab === tab}
          >
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === "World Clock" && (
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="mb-6 flex flex-col items-center gap-2">
            <div className="relative h-36 w-36 rounded-full border border-white/15 bg-gradient-to-br from-[#2d3037] to-[#111215] shadow-[0_14px_45px_rgba(0,0,0,0.35)]">
              {Array.from({ length: 12 }, (_, index) => (
                <span
                  key={index}
                  className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rounded-full bg-white/40"
                  style={{
                    transform: `rotate(${index * 30}deg) translateY(-60px)`,
                    transformOrigin: "0 0",
                  }}
                />
              ))}
              <span className="absolute left-1/2 top-1/2 h-9 w-[3px] -translate-x-1/2 -translate-y-full rounded-full bg-white" style={{ transform: `translate(-50%, -100%) rotate(${hour * 30 + minute / 2}deg)`, transformOrigin: "50% 100%" }} />
              <span className="absolute left-1/2 top-1/2 h-12 w-[2px] -translate-x-1/2 -translate-y-full rounded-full bg-[#ff9f0a]" style={{ transform: `translate(-50%, -100%) rotate(${minute * 6 + second / 10}deg)`, transformOrigin: "50% 100%" }} />
              <span className="absolute left-1/2 top-1/2 h-14 w-px -translate-x-1/2 -translate-y-full rounded-full bg-[#ff6259]" style={{ transform: `translate(-50%, -100%) rotate(${second * 6}deg)`, transformOrigin: "50% 100%" }} />
              <span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ff9f0a]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">Cupertino</p>
              <p className="text-xs text-white/50">{cityTime(now, Intl.DateTimeFormat().resolvedOptions().timeZone, { weekday: "long", month: "long", day: "numeric" })}</p>
              <p className="mt-1 text-2xl font-light tabular-nums">{now.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", second: "2-digit" })}</p>
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
            {CITIES.map(({ city, zone }) => (
              <article key={zone} className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
                <p className="text-xs text-white/45">{city}</p>
                <p className="mt-1 text-2xl font-light tabular-nums">{cityTime(now, zone, { hour: "numeric", minute: "2-digit" })}</p>
                <p className="mt-1 text-[11px] text-white/40">{cityTime(now, zone, { weekday: "long", month: "short", day: "numeric" })}</p>
              </article>
            ))}
          </div>
        </div>
      )}

      {activeTab === "Stopwatch" && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-white/45">Stopwatch</p>
          <p className="mb-8 font-mono text-6xl font-light tabular-nums tracking-tight sm:text-7xl" aria-live="polite">
            {formatDuration(stopwatchElapsed, true)}
          </p>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setStopwatchRunning(false); setStopwatchElapsed(0); setStopwatchStartedAt(null); }} className="rounded-full bg-white/10 px-5 py-2.5 text-sm hover:bg-white/15">
              Reset
            </button>
            <button
              type="button"
              onClick={stopwatchRunning ? stopStopwatch : startStopwatch}
              className={`rounded-full px-5 py-2.5 text-sm font-medium ${stopwatchRunning ? "bg-[#ff6259]/20 text-[#ff8179] hover:bg-[#ff6259]/30" : "bg-[#30d158]/20 text-[#50e176] hover:bg-[#30d158]/30"}`}
            >
              {stopwatchRunning ? "Stop" : "Start"}
            </button>
          </div>
        </div>
      )}

      {activeTab === "Timer" && (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center p-6">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-white/45">Timer</p>
          <p className="mb-8 font-mono text-7xl font-light tabular-nums tracking-tight sm:text-8xl" aria-live="polite">
            {formatDuration(timerRemaining * 1000)}
          </p>
          {!timerRunning && timerRemaining === timerSeconds && (
            <div className="mb-6 flex items-center gap-4">
              <button type="button" onClick={() => adjustTimer(-60)} className="h-9 w-9 rounded-full bg-white/10 text-lg hover:bg-white/20" aria-label="Subtract one minute">−</button>
              <span className="min-w-20 text-center text-xs text-white/50">Set minutes</span>
              <button type="button" onClick={() => adjustTimer(60)} className="h-9 w-9 rounded-full bg-white/10 text-lg hover:bg-white/20" aria-label="Add one minute">+</button>
            </div>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setTimerRunning(false);
                timerRemainingRef.current = timerSeconds;
                setTimerRemaining(timerSeconds);
              }}
              className="rounded-full bg-white/10 px-5 py-2.5 text-sm hover:bg-white/15"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => {
                if (timerRunning) setTimerRunning(false);
                else if (timerRemaining > 0) setTimerRunning(true);
              }}
              disabled={!timerRunning && timerRemaining === 0}
              className="rounded-full bg-[#30d158]/20 px-5 py-2.5 text-sm font-medium text-[#50e176] hover:bg-[#30d158]/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {timerRunning ? "Pause" : "Start"}
            </button>
          </div>
          {timerRemaining === 0 && <p className="mt-4 text-sm text-[#ff9f0a]">Time is up</p>}
        </div>
      )}
    </section>
  );
}
