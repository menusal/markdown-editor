import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Svg({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={40} height={40} aria-hidden {...props}>
      {children}
    </svg>
  )
}

export function ChromeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 12 L4.21 7.5 A9 9 0 0 1 19.79 7.5 Z" fill="#EA4335" />
      <path d="M12 12 L19.79 7.5 A9 9 0 0 1 12 21 Z" fill="#34A853" />
      <path d="M12 12 L12 21 A9 9 0 0 1 4.21 7.5 Z" fill="#FBBC05" />
      <circle cx="12" cy="12" r="5" fill="#ffffff" />
      <circle cx="12" cy="12" r="3.9" fill="#4285F4" />
    </Svg>
  )
}

export function ChromiumIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 12 L4.21 7.5 A9 9 0 0 1 19.79 7.5 Z" fill="#AECBFA" />
      <path d="M12 12 L19.79 7.5 A9 9 0 0 1 12 21 Z" fill="#669DF6" />
      <path d="M12 12 L12 21 A9 9 0 0 1 4.21 7.5 Z" fill="#4285F4" />
      <circle cx="12" cy="12" r="5" fill="#ffffff" />
      <circle cx="12" cy="12" r="3.9" fill="#0B57D0" />
    </Svg>
  )
}

export function EdgeIcon(props: IconProps) {
  return (
    <Svg {...props}>
      <defs>
        <linearGradient id="edge-notice-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0FBFB0" />
          <stop offset="1" stopColor="#0F6CBD" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="10" fill="url(#edge-notice-gradient)" />
      <path
        d="M2.6 13.1c2.7-2 6.6-2.2 9.8-.6 2.5 1.2 4.6 3.3 5.8 5.7"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity="0.92"
      />
    </Svg>
  )
}
