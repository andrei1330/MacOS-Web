import { useState } from "react";

function cleanNumber(value) {
  if (!Number.isFinite(value)) return null;
  const rounded = Number.parseFloat(value.toPrecision(11));
  return Object.is(rounded, -0) ? 0 : rounded;
}

function displayNumber(value) {
  if (value === "Error") return value;
  const [whole, fraction] = String(value).split(".");
  const groupedWhole = Number(whole).toLocaleString("en-US");
  return fraction === undefined ? groupedWhole : `${groupedWhole}.${fraction}`;
}

export default function Calculator() {
  const [display, setDisplay] = useState("0");
  const [storedValue, setStoredValue] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  const clear = () => {
    setDisplay("0");
    setStoredValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setHasCalculated(false);
  };

  const enterDigit = (digit) => {
    if (display === "Error" || waitingForOperand || hasCalculated) {
      setDisplay(digit);
      setWaitingForOperand(false);
      setHasCalculated(false);
      return;
    }

    if (display.replace("-", "").replace(".", "").length >= 10) return;
    setDisplay(display === "0" ? digit : `${display}${digit}`);
  };

  const enterDecimal = () => {
    if (display === "Error" || waitingForOperand || hasCalculated) {
      setDisplay("0.");
      setWaitingForOperand(false);
      setHasCalculated(false);
    } else if (!display.includes(".")) {
      setDisplay(`${display}.`);
    }
  };

  const calculate = (left, right, operation) => {
    if (operation === "+") return cleanNumber(left + right);
    if (operation === "−") return cleanNumber(left - right);
    if (operation === "×") return cleanNumber(left * right);
    if (operation === "÷") return right === 0 ? null : cleanNumber(left / right);
    return right;
  };

  const chooseOperator = (nextOperator) => {
    if (display === "Error") return;
    const currentValue = Number(display);
    if (operator && storedValue !== null && !waitingForOperand) {
      const result = calculate(storedValue, currentValue, operator);
      if (result === null) {
        setDisplay("Error");
        setStoredValue(null);
        setOperator(null);
        setWaitingForOperand(true);
        return;
      }
      setDisplay(String(result));
      setStoredValue(result);
    } else {
      setStoredValue(currentValue);
    }
    setOperator(nextOperator);
    setWaitingForOperand(true);
    setHasCalculated(false);
  };

  const equals = () => {
    if (!operator || storedValue === null || waitingForOperand || display === "Error") return;
    const result = calculate(storedValue, Number(display), operator);
    setDisplay(result === null ? "Error" : String(result));
    setStoredValue(null);
    setOperator(null);
    setWaitingForOperand(true);
    setHasCalculated(true);
  };

  const performAction = (action) => {
    if (/^\d$/.test(action)) {
      enterDigit(action);
      return;
    }

    switch (action) {
      case ".":
        enterDecimal();
        break;
      case "AC":
        clear();
        break;
      case "±":
        if (display !== "0" && display !== "Error") setDisplay(String(Number(display) * -1));
        break;
      case "%":
        if (display !== "Error") setDisplay(String(cleanNumber(Number(display) / 100) ?? "Error"));
        break;
      case "+":
      case "−":
      case "×":
      case "÷":
        chooseOperator(action);
        break;
      case "=":
        equals();
        break;
      default:
        break;
    }
  };

  const handleKeyDown = (event) => {
    const keyMap = { "*": "×", "/": "÷", "-": "−", Enter: "=", "=": "=" };
    const action = keyMap[event.key] ?? event.key;
    if (/^\d$/.test(action) || [".", "AC", "±", "%", "+", "−", "×", "÷", "="].includes(action)) {
      event.preventDefault();
      performAction(action);
    } else if (event.key === "Escape") {
      event.preventDefault();
      clear();
    } else if (event.key === "Backspace" && !waitingForOperand) {
      event.preventDefault();
      setDisplay((value) => (value.length <= 1 || (value.length === 2 && value.startsWith("-")) ? "0" : value.slice(0, -1)));
    }
  };

  const buttons = [
    { label: display === "0" && !operator ? "AC" : "C", action: "AC", tone: "utility" },
    { label: "±", action: "±", tone: "utility" },
    { label: "%", action: "%", tone: "utility" },
    { label: "÷", action: "÷", tone: "operator" },
    { label: "7", action: "7" },
    { label: "8", action: "8" },
    { label: "9", action: "9" },
    { label: "×", action: "×", tone: "operator" },
    { label: "4", action: "4" },
    { label: "5", action: "5" },
    { label: "6", action: "6" },
    { label: "−", action: "−", tone: "operator" },
    { label: "1", action: "1" },
    { label: "2", action: "2" },
    { label: "3", action: "3" },
    { label: "+", action: "+", tone: "operator" },
    { label: "0", action: "0", wide: true },
    { label: ".", action: "." },
    { label: "=", action: "=", tone: "operator" },
  ];

  return (
    <section
      className="flex h-full min-h-0 flex-col items-center justify-center bg-[#222326] p-5 text-white"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      autoFocus
      aria-label="Calculator"
    >
      <div className="w-full max-w-[340px]">
        <div className="mb-4 flex h-24 items-end justify-end overflow-hidden px-2 pb-1 text-right">
          <output className="truncate text-[clamp(2.6rem,8vw,4.25rem)] font-light leading-none tracking-tight" aria-live="polite">
            {displayNumber(display)}
          </output>
        </div>
        <div className="grid grid-cols-4 gap-2.5">
          {buttons.map((button) => (
            <button
              key={button.action}
              type="button"
              onClick={() => performAction(button.action)}
              className={`flex aspect-square items-center justify-center rounded-full text-[clamp(1.2rem,3vw,1.65rem)] font-medium transition active:scale-95 ${
                button.wide ? "col-span-2 aspect-auto justify-start pl-7" : ""
              } ${
                button.tone === "operator"
                  ? "bg-[#ff9f0a] text-white hover:bg-[#ffb340]"
                  : button.tone === "utility"
                    ? "bg-[#a5a5a5] text-[#191919] hover:bg-[#c5c5c5]"
                    : "bg-[#3a3a3c] text-white hover:bg-[#56565a]"
              }`}
              aria-label={button.label === "±" ? "Toggle sign" : button.label}
            >
              {button.label}
            </button>
          ))}
        </div>
        <p className="mt-4 text-center text-[11px] text-white/35">Keyboard: 0–9, + − × ÷, Enter, Esc</p>
      </div>
    </section>
  );
}
