import { createUniAppGA4 } from "ga4-uniapp"

export const ga4MeasurementId = import.meta.env.VITE_GA4_MEASUREMENT_ID || "G-XXXXXXXXXX"

export const ga4 = createUniAppGA4({
  measurementId: ga4MeasurementId,
  appOrigin: "https://ga4-uniapp.local",
  appName: "ga4-uniapp-playground",
  appVersion: "0.1.0",
  debug: true,
  autoPageView: true,
  autoUniInterceptors: true,
  autoHistory: true,
  autoFileDownload: true,
  autoOutboundClick: true,
  autoForm: true,
  autoScroll: true,
  respectDoNotTrack: false,
  respectGlobalPrivacyControl: false,
  logger: {
    debug: (...args) => console.log("[ga4-uniapp]", ...args),
    info: (...args) => console.info("[ga4-uniapp]", ...args),
    warn: (...args) => console.warn("[ga4-uniapp]", ...args),
    error: (...args) => console.error("[ga4-uniapp]", ...args),
  },
})
