import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Icon({ size = 18, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...props}
    />
  );
}

export const Icons = {
  panel: (p: IconProps) => (
    <Icon {...p}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </Icon>
  ),
  board: (p: IconProps) => (
    <Icon {...p}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M8 4v16M16 4v16" />
    </Icon>
  ),
  calendar: (p: IconProps) => (
    <Icon {...p}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </Icon>
  ),
  appointments: (p: IconProps) => (
    <Icon {...p}>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </Icon>
  ),
  team: (p: IconProps) => (
    <Icon {...p}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="16" cy="9" r="2.5" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M14 19a4.5 4.5 0 0 1 6.5-4" />
    </Icon>
  ),
  catalog: (p: IconProps) => (
    <Icon {...p}>
      <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V7z" />
      <path d="M8 5v14M12 11h4M12 15h3" />
    </Icon>
  ),
  orders: (p: IconProps) => (
    <Icon {...p}>
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.5H17a2 2 0 0 0 2-1.5L21 8H7" />
    </Icon>
  ),
  customers: (p: IconProps) => (
    <Icon {...p}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19a7 7 0 0 1 14 0" />
    </Icon>
  ),
  users: (p: IconProps) => (
    <Icon {...p}>
      <circle cx="12" cy="8" r="3" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
      <path d="M16 4.5a2.5 2.5 0 0 1 0 5" />
    </Icon>
  ),
  sections: (p: IconProps) => (
    <Icon {...p}>
      <rect x="4" y="4" width="16" height="4" rx="1" />
      <rect x="4" y="10" width="16" height="4" rx="1" />
      <rect x="4" y="16" width="16" height="4" rx="1" />
    </Icon>
  ),
  settings: (p: IconProps) => (
    <Icon {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M3 12h2M19 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Icon>
  ),
  images: (p: IconProps) => (
    <Icon {...p}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="M3 16l5-4 4 3 3-2 6 4" />
    </Icon>
  ),
  sponsors: (p: IconProps) => (
    <Icon {...p}>
      <path d="M12 3l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.8 7.2 18l.9-5.4L4.2 8.7l5.4-.8L12 3z" />
    </Icon>
  ),
  instagram: (p: IconProps) => (
    <Icon {...p}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </Icon>
  ),
  billing: (p: IconProps) => (
    <Icon {...p}>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10h18M7 14h3" />
    </Icon>
  ),
  external: (p: IconProps) => (
    <Icon {...p}>
      <path d="M14 4h6v6M10 14L20 4M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </Icon>
  ),
  logout: (p: IconProps) => (
    <Icon {...p}>
      <path d="M15 12H4" />
      <path d="M10 7l5 5-5 5" />
      <path d="M20 5v14" />
    </Icon>
  ),
  menu: (p: IconProps) => (
    <Icon {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
  ),
  close: (p: IconProps) => (
    <Icon {...p}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Icon>
  ),
};
