import { render } from '@testing-library/react'
import { NuqsAdapter } from 'nuqs/adapters/react'
import type { ReactElement } from 'react'

/** Renders a component wrapped in the nuqs adapter required by useQueryState. */
export function renderWithNuqs(ui: ReactElement) {
  return render(<NuqsAdapter>{ui}</NuqsAdapter>)
}
