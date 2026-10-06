import {
  ChromeIcon,
  ChromiumIcon,
  EdgeIcon,
} from '@/components/ui/browser-icons'

const BROWSERS = [
  { name: 'Chrome', Icon: ChromeIcon },
  { name: 'Chromium', Icon: ChromiumIcon },
  { name: 'Edge', Icon: EdgeIcon },
] as const

export function BrowserNotice() {
  return (
    <div
      role="alert"
      className="w-full max-w-[520px] rounded-2xl border border-sienna-brand/25 bg-highlight-wash px-24 py-24 text-center"
    >
      <div className="mb-16 flex items-end justify-center gap-24">
        {BROWSERS.map(({ name, Icon }) => (
          <div key={name} className="flex flex-col items-center gap-8">
            <Icon width={44} height={44} />
            <span className="text-caption leading-caption font-medium text-graphite">
              {name}
            </span>
          </div>
        ))}
      </div>

      <p className="text-subheading leading-subheading font-semibold tracking-heading text-ink">
        This browser isn&apos;t supported
      </p>
      <p className="mx-auto mt-8 max-w-[420px] text-body leading-body text-graphite">
        Reading and saving files uses the File System Access API, which only
        Chromium browsers implement. Open this app in one of the browsers above
        to get started.
      </p>
    </div>
  )
}
