import { parseAsBoolean, parseAsString, parseAsStringEnum } from 'nuqs'

export type ViewMode = 'split' | 'editor' | 'preview'

export const VIEW_MODES: ViewMode[] = ['split', 'editor', 'preview']

export const projectParam = parseAsString

export const fileParam = parseAsString

export const viewParam = parseAsStringEnum<ViewMode>(VIEW_MODES).withDefault('split')

export const sidebarParam = parseAsBoolean.withDefault(true)
