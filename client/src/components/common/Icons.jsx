/** Small inline SVG icon set (presentation only). All icons are decorative: aria-hidden. */
const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.25,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: 'false',
};

const make = (paths, size = 16) =>
  function Icon({ className = '', ...rest }) {
    return (
      <svg {...base} width={size} height={size} className={className} {...rest}>
        {paths}
      </svg>
    );
  };

export const LibraryIcon = make(
  <>
    <rect x="2" y="2.5" width="12" height="11" />
    <path d="M2 6h12M6 6v7.5M10 6v7.5" />
  </>,
  18
);
export const CartIcon = make(
  <>
    <path d="M1.5 2h2l1.6 7.5h7.2L13.8 4H4.2" />
    <circle cx="6" cy="12.8" r=".9" />
    <circle cx="11.6" cy="12.8" r=".9" />
  </>,
  18
);
export const UserIcon = make(
  <>
    <circle cx="8" cy="8" r="6.5" />
    <circle cx="8" cy="6.3" r="2" />
    <path d="M3.8 12.6c.9-1.6 2.4-2.4 4.2-2.4s3.3.8 4.2 2.4" />
  </>,
  18
);
export const SearchIcon = make(
  <>
    <circle cx="7" cy="7" r="4.5" />
    <path d="M10.4 10.4L14 14" />
  </>
);
export const ChevronDownIcon = make(<path d="M3 6l5 5 5-5" />);
export const ArrowRightIcon = make(<path d="M2 8h11M9 4l4 4-4 4" />);
export const BookmarkIcon = make(<path d="M4 2h8v12l-4-3-4 3z" />);
export const CheckIcon = make(<path d="M3 8.5l3.2 3.2L13 4.8" />);
export const CloseIcon = make(<path d="M3.5 3.5l9 9M12.5 3.5l-9 9" />);
export const MenuIcon = make(<path d="M2 4h12M2 8h12M2 12h12" />, 20);
export const MinusIcon = make(<path d="M3 8h10" />);
export const PlusIcon = make(<path d="M8 3v10M3 8h10" />);
export const CardIcon = make(
  <>
    <rect x="1.5" y="3.5" width="13" height="9" />
    <path d="M1.5 6.5h13" />
  </>
);
export const HeartIcon = make(<path d="M8 13.5S2 9.8 2 6a3 3 0 0 1 6-1 3 3 0 0 1 6 1c0 3.800-6 7.500-6 7.500z" />);

export function StarIcon({ filled = false, className = '', size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" focusable="false" className={className}>
      <path
        d="M8 1.5l1.9 4.200 4.600.5-3.400 3.100 1 4.500L8 11.400 3.900 13.800l1-4.500L1.500 6.200l4.600-.5z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
