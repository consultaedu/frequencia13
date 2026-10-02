export type IconName =
  | "map"
  | "camera"
  | "phone"
  | "radio"
  | "units"
  | "folder"
  | "terminal"
  | "system"
  | "power"
  | "pause"
  | "play"
  | "arrow"
  | "volume";
const paths: Record<IconName, string> = {
  map: "m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16",
  camera: "M3 6h12v12H3z m12 4 6-3v10l-6-3",
  phone: "M7 3 3 5c0 8 8 16 16 16l2-4-5-3-2 3-7-7 3-2-3-5Z",
  radio: "M4 9h16v11H4z m2 0L18 3M7 13h1m3 0h6M7 16h1m3 0h6",
  units:
    "M4 19v-3c0-4 10-4 10 0v3M9 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm7 0a3 3 0 0 1 0 6m2 3c3 0 3 3 3 6",
  folder: "M3 6h7l2 3h9v11H3V6Z",
  terminal: "m5 7 5 5-5 5m8 0h6",
  system: "M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-5 0v6",
  power: "M12 2v10M6 5a9 9 0 1 0 12 0",
  pause: "M8 5v14m8-14v14",
  play: "m7 4 13 8-13 8V4Z",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  volume: "m3 9 5 0 5-5v16l-5-5H3V9Zm13-2c4 3 4 7 0 10m3-13c6 5 6 11 0 16",
};
export default function Icon({
  name,
  size = 20,
}: {
  name: IconName;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
