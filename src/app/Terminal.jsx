import { useEffect, useRef, useState } from "react";

const DIRECTORIES = new Set([
  "~",
  "~/Applications",
  "~/Desktop",
  "~/Documents",
  "~/Downloads",
  "~/Pictures",
]);

const DIRECTORY_CONTENTS = {
  "~": ["Applications/", "Desktop/", "Documents/", "Downloads/", "Pictures/", "README.md", "about.txt"],
  "~/Applications": ["Calendar.app/", "Calculator.app/", "Clock.app/", "Finder.app/", "Safari.app/", "TextEdit.app/"],
  "~/Desktop": ["Welcome.txt"],
  "~/Documents": ["Notes.txt", "Project.txt"],
  "~/Downloads": [],
  "~/Pictures": ["Wallpaper.jpg"],
};

const FILE_CONTENTS = {
  "README.md": "Welcome to this macOS web simulation.\nType `help` to see the commands available in this simulated terminal.",
  "about.txt": "A small browser-based Mac desktop. Nothing typed here runs on your computer.",
  "Desktop/Welcome.txt": "Hello from your simulated desktop!",
  "Documents/Notes.txt": "Ideas, lists, and little things worth remembering.",
  "Documents/Project.txt": "This project is a macOS-inspired desktop built with React.",
};

const HELP_TEXT = [
  "Available commands:",
  "  help              Show this list",
  "  ls                List items in the current folder",
  "  pwd               Show the current folder",
  "  cd <folder>       Change folder (try Documents or ..)",
  "  cat <file>        Read a sample text file",
  "  echo <text>       Print text",
  "  date              Show the current date and time",
  "  whoami            Show the simulated user",
  "  uname             Show simulated system information",
  "  neofetch          Show a Mac system summary",
  "  history           Show commands entered in this session",
  "  clear             Clear the terminal",
];

function tokenize(command) {
  return command.match(/"(?:[^"\\]|\\.)*"|'[^']*'|[^\s]+/g)?.map((part) =>
    part.replace(/^["']|["']$/g, ""),
  ) ?? [];
}

function resolveDirectory(currentPath, destination) {
  if (!destination || destination === "~") return "~";
  if (destination.startsWith("/")) return null;

  const segments = destination.startsWith("~/")
    ? destination.slice(2).split("/")
    : [...(currentPath === "~" ? [] : currentPath.slice(2).split("/")), ...destination.split("/")];
  const normalized = [];

  for (const segment of segments) {
    if (!segment || segment === ".") continue;
    if (segment === "..") normalized.pop();
    else normalized.push(segment);
  }

  const result = normalized.length ? `~/${normalized.join("/")}` : "~";
  return DIRECTORIES.has(result) ? result : null;
}

function resolveFile(currentPath, fileName) {
  if (!fileName) return null;
  const relativePath = fileName.startsWith("~/")
    ? fileName.slice(2)
    : `${currentPath === "~" ? "" : `${currentPath.slice(2)}/`}${fileName}`;
  return FILE_CONTENTS[relativePath] ?? null;
}

export default function Terminal() {
  const [currentPath, setCurrentPath] = useState("~");
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [lines, setLines] = useState([
    { kind: "system", text: "Last login: Today on ttys001" },
    { kind: "system", text: "Welcome to Terminal. Type `help` to see available commands." },
  ]);
  const inputRef = useRef(null);
  const outputRef = useRef(null);

  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  const runCommand = (rawCommand) => {
    const commandText = rawCommand.trim();
    if (!commandText) return;

    setCommandHistory((previous) => [...previous, commandText]);
    setHistoryIndex(commandHistory.length + 1);
    const [command, ...args] = tokenize(commandText);
    let result = "";
    let kind = "output";

    switch (command) {
      case "clear":
        setLines([]);
        setInput("");
        return;
      case "help":
      case "man":
        result = HELP_TEXT.join("\n");
        break;
      case "pwd":
        result = currentPath === "~" ? "/Users/guest" : `/Users/guest/${currentPath.slice(2)}`;
        break;
      case "ls":
        result = (DIRECTORY_CONTENTS[currentPath] ?? []).join("  ") || "The folder is empty.";
        break;
      case "cd": {
        const nextPath = resolveDirectory(currentPath, args[0]);
        if (nextPath) setCurrentPath(nextPath);
        else {
          result = `cd: no such folder: ${args[0] || ""}`;
          kind = "error";
        }
        break;
      }
      case "cat": {
        const fileContents = resolveFile(currentPath, args[0]);
        if (fileContents !== null) result = fileContents;
        else {
          result = `cat: ${args[0] || "missing file name"}: No such file`;
          kind = "error";
        }
        break;
      }
      case "echo":
        result = args.join(" ");
        break;
      case "date":
        result = new Date().toString();
        break;
      case "whoami":
        result = "guest";
        break;
      case "hostname":
        result = "MacBook-Pro.local";
        break;
      case "uname":
        result = "Darwin MacBook-Pro.local 24.0.0 Darwin Kernel Version 24.0.0 arm64";
        break;
      case "neofetch":
        result = [
          "             .:       guest@MacBook-Pro",
          "          .::::.      -----------------",
          "        .::::::::.    OS: macOS-inspired web desktop",
          "       :::::::::::    Shell: simulated zsh",
          "        '::::::::'    Terminal: browser sandbox",
          "          '::::'      Nothing runs on your host computer.",
        ].join("\n");
        break;
      case "history":
        result = [...commandHistory, commandText].map((entry, index) => `  ${index + 1}  ${entry}`).join("\n");
        break;
      case "sudo":
        result = "This simulated terminal does not support elevated commands.";
        kind = "error";
        break;
      default:
        result = `zsh: command not found: ${command}`;
        kind = "error";
    }

    setLines((previous) => [
      ...previous,
      { kind: "command", text: commandText, prompt: `guest@MacBook-Pro ${currentPath} %` },
      ...(result ? result.split("\n").map((text) => ({ kind, text })) : []),
    ]);
    setInput("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      runCommand(input);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIndex);
      setInput(commandHistory[nextIndex] ?? "");
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = Math.min(commandHistory.length, historyIndex + 1);
      setHistoryIndex(nextIndex);
      setInput(commandHistory[nextIndex] ?? "");
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-[#101114] font-mono text-[13px] text-[#e7e8ea]">
      <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 bg-[#1b1c20] px-4 text-xs text-white/65">
        <span>zsh — guest — 80×24</span>
        <span className="rounded-md bg-white/5 px-2 py-1 text-[10px] text-white/45">SIMULATED SHELL</span>
      </div>

      <div
        ref={outputRef}
        className="min-h-0 flex-1 overflow-y-auto px-5 py-4 scrollbar-light"
        onClick={() => inputRef.current?.focus()}
        role="log"
        aria-label="Terminal output"
        aria-live="polite"
      >
        {lines.map((line, index) => (
          <div key={`${index}-${line.text}`} className="min-h-5 whitespace-pre-wrap break-words leading-5">
            {line.kind === "command" ? (
              <>
                <span className="text-[#75d6a4]">{line.prompt}</span>
                <span className="text-white"> {line.text}</span>
              </>
            ) : (
              <span className={line.kind === "error" ? "text-[#ff7b72]" : line.kind === "system" ? "text-white/50" : "text-white/85"}>
                {line.text}
              </span>
            )}
          </div>
        ))}

        <div className="flex min-h-6 items-center gap-2">
          <span className="shrink-0 text-[#75d6a4]">guest@MacBook-Pro {currentPath} %</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            className="min-w-0 flex-1 border-0 bg-transparent p-0 text-white outline-none ring-0 placeholder:text-white/25 focus:outline-none focus:ring-0"
            aria-label="Enter a simulated terminal command"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            autoFocus
          />
          <span className="h-4 w-2 animate-pulse bg-[#75d6a4]" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
