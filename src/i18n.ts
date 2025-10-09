// Simplified i18n setup
export const locales = ['en', 'hi', 'mr'] as const
export type Locale = typeof locales[number]

export const defaultLocale: Locale = 'en'

// Simple message loading function
export async function getMessages(locale: Locale) {
  try {
    return (await import(`../messages/${locale}.json`)).default
  } catch {
    // Fallback to English if locale not found
    return (await import(`../messages/en.json`)).default
  }
}