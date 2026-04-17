/** כתובת האתר הציבורית (לינקי תצוגה מקדימה בפאנל) */
export const PUBLIC_SITE_URL = (
  import.meta.env.VITE_PUBLIC_SITE_URL || 'https://dishly.co.il'
).replace(/\/$/, '')

/** כתובת האפליקציה (לינקים לכניסת משתמשים) */
export const APP_URL = (
  import.meta.env.VITE_APP_URL || 'https://app.dishly.co.il'
).replace(/\/$/, '')

export const BRAND = {
  name: 'Dishly',
  tagline: 'אוכל ביתי אמיתי עד הדלת',
  color: '#3985b9',
  logo: '/logo.png',
} as const
