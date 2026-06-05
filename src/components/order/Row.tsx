// src/components/checkout/Row.tsx
export default function Row({
  label,
  value,
  freeText,
  greenWhenZero,
  formatFn,
}: {
  label: string;
  value: number;
  freeText?: string;
  greenWhenZero?: boolean;
  formatFn?: (value: number) => string;
}) {
  const display =
    value === 0 && freeText
      ? freeText
      : formatFn
      ? formatFn(value)
      : value.toString();

  return (
    <div
      className={`flex justify-between ${
        greenWhenZero && value === 0 ? "text-green-600" : ""
      }`}
    >
      <span>{label}</span>
      <span>₹{display}</span>
    </div>
  );
}
