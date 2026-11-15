import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

/** Bulletin / newspaper tab icon */
export function IconBulletin(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5h12a1 1 0 0 1 1 1v13H5a1 1 0 0 1-1-1V5z" />
      <path d="M17 8h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-2" />
      <path d="M7 9h6M7 13h6M7 17h4" />
    </svg>
  );
}

/** Chat / assistant tab icon */
export function IconChat(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M5 6h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-4 3v-3H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" />
      <path d="M8 10h8M8 13h5" />
    </svg>
  );
}

/** Microphone (voice input) */
export function IconMic(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <path d="M12 18v3" />
    </svg>
  );
}

/** Play */
export function IconPlay(props: IconProps) {
  return (
    <svg {...base} fill="currentColor" stroke="none" {...props}>
      <path d="M8 5.5v13l11-6.5-11-6.5z" />
    </svg>
  );
}

/** Pause */
export function IconPause(props: IconProps) {
  return (
    <svg {...base} fill="currentColor" stroke="none" {...props}>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

/** Scam level dot (circle) — color via currentColor */
export function IconLevelDot(props: IconProps) {
  return (
    <svg {...base} fill="currentColor" stroke="none" {...props}>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

/** Font scale “Aa” stays text; radio markers use check circle */
export function IconRadioOn(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="3" fill="#fff" stroke="none" />
    </svg>
  );
}

export function IconRadioOff(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

/** Share to Zalo / Messenger / download */
export function IconShare(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" />
    </svg>
  );
}

/** Close (sheet, modal) */
export function IconClose(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
