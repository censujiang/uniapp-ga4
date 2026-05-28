/// <reference types="gtag.js" />

import "core-js/actual/url"
import "core-js/actual/url-search-params"

export const GA4_COLLECT_ENDPOINT = "https://www.google-analytics.com/g/collect"

const defaultSessionTimeoutMs = 30 * 60 * 1000
const defaultStoragePrefix = "uni_ga4"
const defaultAppOrigin = "https://uniapp.local"
const fileExtensionPattern = /^(pdf|xlsx?|docx?|txt|rtf|csv|exe|key|pp(s|t|tx)|7z|pkg|rar|gz|zip|avi|mov|mp4|mpe?g|wmv|midi?|mp3|wav|wma)$/i
const searchQueryKeys = ["q", "s", "search", "query", "keyword"]
const pageViewDedupeMs = 750

/** Primitive values accepted by GA4 event and user-property parameters. */
export type GA4Value = string | number | boolean | null | undefined

/** gtag.js parameter surface that is serializable through this direct-collect client. */
export type GA4SerializableGtagParams = Gtag.ConfigParams & Gtag.ControlParams & Gtag.EventParams

/** Built-in gtag.js event names plus project-defined custom event names. */
export type GA4EventName = Gtag.EventNames | (string & {})

/** Event parameters accepted by `event()` and the helper tracking methods. */
export type GA4Params = {
  [K in keyof GA4SerializableGtagParams]?: Extract<NonNullable<GA4SerializableGtagParams[K]>, GA4Value>
} & Record<string, GA4Value>

/** Consent mode values sent with each collect hit when configured. */
export type ConsentState = {
  ad_user_data?: "GRANTED" | "DENIED"
  ad_personalization?: "GRANTED" | "DENIED"
}

/** Normalized request passed to a custom transport adapter. */
export type UniGA4HttpRequest = {
  url: string
  method: "GET" | "POST"
  eventName: string
  params: Record<string, string>
}

/** Result returned by a custom transport adapter. */
export type UniGA4HttpResponse = {
  ok: boolean
  statusCode?: number
  raw?: unknown
}

/** Internal reason labels used when an automatic `page_view` is emitted. */
export type AutoTrackReason =
  | "init"
  | "app-show"
  | "history"
  | "uni-navigation"

/** Page information mapped to GA4 `dl`, `dr`, and `dt` URL parameters. */
export type PageContext = {
  pageLocation: string
  pageReferrer: string
  pageTitle: string
}

/** Read-only snapshot of runtime identity and session state. */
export type GA4ContextSnapshot = {
  measurementId: string
  clientId: string
  userId?: string
  sessionId: number
  sessionNumber: number
  lastEngagementTime: number
  optOut: boolean
}

/** Parameters for a GA4 `file_download` event. */
export type FileDownloadOptions = {
  url: string
  fileName?: string
  fileExtension?: string
  linkId?: string
  linkText?: string
  linkClasses?: string
}

/** Parameters for an outbound-link click event. */
export type OutboundOptions = {
  linkId?: string
  linkText?: string
  linkClasses?: string
  open?: boolean
}

/** Shared form metadata for `form_start` and `form_submit`. */
export type FormOptions = {
  formId?: string
  formName?: string
  formDestination?: string
}

/** Parameters for a GA4 `form_submit` event. */
export type FormSubmitOptions = FormOptions & {
  formSubmitText?: string
}

/** Metadata used to create a GA4 enhanced-measurement style video tracker. */
export type VideoTrackerOptions = {
  videoId?: string
  title?: string
  url?: string
  provider?: string
  visible?: boolean
}

/** Imperative callbacks to wire uni-app video component lifecycle into GA4 events. */
export type VideoTracker = {
  /** Send `video_start` the first time playback starts. */
  onPlay(): void
  /** Flush pending engagement when playback pauses. */
  onPause(): void
  /** Update progress and emit 10/25/50/75 percent milestones. */
  onTimeUpdate(detail: {
    currentTime: number
    duration: number
  }): void
  /** Send `video_complete`. */
  onEnded(): void
  /** Mark the tracker as seeking and update current progress. */
  onSeek?(detail: {
    currentTime: number
    duration: number
  }): void
  /** Toggle whether video engagement should currently be counted. */
  onVisibilityChange?(visible: boolean): void
  /** Flush pending engagement when the page hides. */
  onPageHide?(): void
  /** Stop timers and prevent additional video events from this tracker. */
  destroy(): void
}

/** Configuration used by `createUniAppGA4`. */
export interface CreateUniAppGA4Config {
  /** GA4 Measurement ID, for example `G-XXXXXXXXXX`. */
  measurementId: string
  /**
   * Direct GA4 web collection endpoint.
   *
   * Defaults to the gtag.js endpoint `https://www.google-analytics.com/g/collect`.
   */
  collectEndpoint?: string
  /** Enable console diagnostics for collect URLs, adapter failures, and automatic tracking. */
  debug?: boolean
  /** Send an initial `page_view` from `init()` and automatic page views from supported hooks. */
  autoPageView?: boolean
  /** Infer `view_search_results` from common search query keys on page views. */
  autoViewSearchResults?: boolean
  /** Register uni interceptors for navigation, download, and open-document APIs. */
  autoUniInterceptors?: boolean
  /** Track H5 `history.pushState`, `replaceState`, and `popstate` route changes. */
  autoHistory?: boolean
  /** Track file downloads from H5 clicks and uni download/open-document APIs. */
  autoFileDownload?: boolean
  /** Track outbound H5 anchor clicks before optionally opening the target URL. */
  autoOutboundClick?: boolean
  /** Track H5 form start and submit events. */
  autoForm?: boolean
  /** Track one GA4 `scroll` event after the page reaches the configured threshold. */
  autoScroll?: boolean
  /** Session timeout in milliseconds. Defaults to 30 minutes. */
  sessionTimeoutMs?: number
  /** Optional debounce window for batching queued hits. `0` sends immediately. */
  batchIntervalMs?: number
  /** Storage key prefix for client ID, user ID, opt-out state, and session state. */
  storagePrefix?: string
  /**
   * App-side origin used to build GA4 `page_location` when the runtime has no browser `location.href`.
   *
   * Defaults to `https://uniapp.local`.
   */
  appOrigin?: string
  /** Optional app name sent as GA4 app metadata. */
  appName?: string
  /** Optional app version sent as GA4 app metadata. */
  appVersion?: string
  /** Send the GA-style anonymize IP flag. */
  anonymizeIp?: boolean
  /** Respect browser Do Not Track when available. */
  respectDoNotTrack?: boolean
  /** Respect browser Global Privacy Control when available. */
  respectGlobalPrivacyControl?: boolean
  /** Store `user_id` in memory only or persist it through uni storage. */
  userIdPersistence?: "memory" | "storage"
  /** Logger used when `debug` is enabled. Defaults to the runtime console. */
  logger?: Pick<Console, "debug" | "info" | "warn" | "error">
  /** Custom transport for environments that need to override the default `uni.request` transport. */
  requestAdapter?: (req: UniGA4HttpRequest) => Promise<UniGA4HttpResponse>
}

/** Runtime client returned by `createUniAppGA4`. */
export interface UniAppGA4 {
  /** Initialize storage, automatic collectors, and the first page view. */
  init(): void
  /** Remove registered H5 listeners and stop pending flush timers. */
  destroy(): void
  /** Set or clear GA4 `user_id`. */
  setUserId(userId?: string): void
  /** Set GA4 user properties to be sent with subsequent hits. */
  setUserProperties(props: Record<string, string | number | boolean>): void
  /** Set consent mode values for subsequent hits. */
  setConsent(consent: ConsentState): void
  /** Enable or disable local opt-out. Disabled clients drop new events. */
  optOut(disabled: boolean): void
  /** Send any GA4 event name with typed gtag.js parameters. */
  event(name: GA4EventName, params?: GA4Params): Promise<void>
  /** Send a GA4 `page_view` with optional page context overrides. */
  pageView(ctx?: Partial<PageContext>): Promise<void>
  /** Hook for uni `onShow`; refreshes session state and may send a page view. */
  appShow(opts?: unknown): Promise<void>
  /** Hook for uni `onHide`; flushes pending hits. */
  appHide(): Promise<void>
  /** Hook for page `onShow`; sends a page view when automatic page views are enabled. */
  pageShow(ctx?: Partial<PageContext>): Promise<void>
  /** Hook for page `onHide`; flushes pending hits. */
  pageHide(): Promise<void>
  /** Hook for page `onPageScroll`; sends the configured scroll event once per page. */
  onPageScroll(e: { scrollTop: number }): void
  /** Send GA4 `view_search_results`. */
  viewSearchResults(searchTerm: string, extras?: GA4Params): Promise<void>
  /** Track an outbound click and optionally open the URL through uni APIs. */
  openExternal(url: string, opts?: OutboundOptions): Promise<void>
  /** Send GA4 `file_download`. */
  trackFileDownload(input: FileDownloadOptions): Promise<void>
  /** Send GA4 `form_start`. */
  formStart(input: FormOptions): Promise<void>
  /** Send GA4 `form_submit`. */
  formSubmit(input: FormSubmitOptions): Promise<void>
  /** Create a video-event tracker for uni video component callbacks. */
  createVideoTracker(opts: VideoTrackerOptions): VideoTracker
  /** Flush queued hits immediately. */
  flush(reason?: string): Promise<void>
  /** Start a new GA4 session and persist the updated session counter. */
  resetSession(): void
  /** Return a read-only snapshot of identity, session, and opt-out state. */
  getContext(): Readonly<GA4ContextSnapshot>
}

type StoredSession = {
  id: number
  number: number
  startedAt: number
  lastEngagementTs: number
}

type QueuedEvent = {
  name: string
  params: GA4Params
  timestamp: number
}

type PageViewDedupeState = {
  key: string
  timestamp: number
}

type StorageDriver = {
  get(key: string): unknown
  set(key: string, value: unknown): void
  remove(key: string): void
}

type UniApi = {
  getStorageSync?: (key: string) => unknown
  setStorageSync?: (key: string, value: unknown) => void
  removeStorageSync?: (key: string) => void
  addInterceptor?: (name: string, options: UniNamespace.InterceptorOptions) => void
  request?: (options: {
    url: string
    method: string
    success: (response: { statusCode?: number }) => void
    fail: (error: unknown) => void
  }) => void
  getSystemInfoSync?: () => {
    language?: string
    screenWidth?: number
    screenHeight?: number
    windowWidth?: number
    windowHeight?: number
  }
}

type UniPageLike = {
  route?: string
  options?: Record<string, unknown>
  $page?: {
    fullPath?: string
    path?: string
    options?: Record<string, unknown>
  }
}

type InterceptorMethodName =
  | "navigateTo"
  | "redirectTo"
  | "reLaunch"
  | "switchTab"
  | "navigateBack"
  | "downloadFile"
  | "openDocument"

type DomLikeElement = {
  id?: string
  className?: string
  textContent?: string | null
  closest(selector: string): DomLikeElement | null
  getAttribute(name: string): string | null
}

export function createUniAppGA4(config: CreateUniAppGA4Config): UniAppGA4 {
  return new UniAppGA4Client(config)
}

class UniAppGA4Client implements UniAppGA4 {
  private readonly config: Required<Pick<CreateUniAppGA4Config, "measurementId" | "collectEndpoint" | "debug" | "autoPageView" | "autoViewSearchResults" | "autoUniInterceptors" | "autoHistory" | "autoFileDownload" | "autoOutboundClick" | "autoForm" | "autoScroll" | "sessionTimeoutMs" | "batchIntervalMs" | "storagePrefix" | "appOrigin" | "anonymizeIp" | "respectDoNotTrack" | "respectGlobalPrivacyControl" | "userIdPersistence">> & CreateUniAppGA4Config
  private readonly storage: StorageDriver
  private readonly logger: Pick<Console, "debug" | "info" | "warn" | "error">
  private readonly queue: QueuedEvent[] = []
  private readonly cleanupTasks: Array<() => void> = []
  private readonly userProperties: Record<string, string | number | boolean> = {}
  private readonly startedForms = new Set<string>()
  private readonly sentSearchTerms = new Set<string>()
  private clientId = ""
  private userId: string | undefined
  private consent: ConsentState = {}
  private session: StoredSession
  private flushTimer: ReturnType<typeof setTimeout> | undefined
  private hitSequence = 0
  private pageId = randomInt(100000000, 999999999)
  private lastPage: PageContext | undefined
  private lastPageViewDedupe: PageViewDedupeState | undefined
  private scrollSentKey = ""
  private initialized = false
  private uniInterceptorsRegistered = false
  private browserCollectorsRegistered = false
  private disabled = false

  constructor(config: CreateUniAppGA4Config) {
    if (!config.measurementId) {
      throw new Error("createUniAppGA4 requires a measurementId.")
    }

    this.config = {
      ...config,
      collectEndpoint: config.collectEndpoint || GA4_COLLECT_ENDPOINT,
      debug: config.debug ?? false,
      autoPageView: config.autoPageView ?? true,
      autoViewSearchResults: config.autoViewSearchResults ?? true,
      autoUniInterceptors: config.autoUniInterceptors ?? true,
      autoHistory: config.autoHistory ?? true,
      autoFileDownload: config.autoFileDownload ?? true,
      autoOutboundClick: config.autoOutboundClick ?? true,
      autoForm: config.autoForm ?? true,
      autoScroll: config.autoScroll ?? true,
      sessionTimeoutMs: config.sessionTimeoutMs ?? defaultSessionTimeoutMs,
      batchIntervalMs: config.batchIntervalMs ?? 0,
      storagePrefix: config.storagePrefix || defaultStoragePrefix,
      appOrigin: normalizeAppOrigin(config.appOrigin),
      anonymizeIp: config.anonymizeIp ?? false,
      respectDoNotTrack: config.respectDoNotTrack ?? true,
      respectGlobalPrivacyControl: config.respectGlobalPrivacyControl ?? true,
      userIdPersistence: config.userIdPersistence || "memory",
    }
    this.logger = config.logger || console
    this.storage = createStorageDriver()
    this.disabled = this.readBoolean("opt_out") || this.shouldRespectBrowserPrivacySignals()
    this.clientId = this.getOrCreateClientId()
    this.session = this.getOrCreateSession()

    if (this.config.userIdPersistence === "storage") {
      const storedUserId = this.readString("user_id")
      this.userId = storedUserId || undefined
    }
  }

  init() {
    if (this.initialized) {
      return
    }
    this.initialized = true
    this.registerUniInterceptors()
    // #ifdef H5
    this.registerBrowserCollectors()
    // #endif
    if (this.config.autoPageView) {
      void this.trackAutoPageView("init")
    }
  }

  destroy() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = undefined
    }
    while (this.cleanupTasks.length > 0) {
      const cleanup = this.cleanupTasks.pop()
      cleanup?.()
    }
    void this.flush("destroy")
  }

  setUserId(userId?: string) {
    this.userId = normalizeOptionalString(userId)
    if (this.config.userIdPersistence === "storage") {
      if (this.userId) {
        this.write("user_id", this.userId)
      } else {
        this.remove("user_id")
      }
    }
  }

  setUserProperties(props: Record<string, string | number | boolean>) {
    Object.entries(props).forEach(([key, value]) => {
      if (isAllowedParamName(key)) {
        this.userProperties[key] = value
      }
    })
  }

  setConsent(consent: ConsentState) {
    this.consent = {
      ...this.consent,
      ...consent,
    }
  }

  optOut(disabled: boolean) {
    this.disabled = disabled
    this.write("opt_out", disabled)
  }

  async event(name: GA4EventName, params: GA4Params = {}) {
    const eventName = normalizeEventName(name)
    if (!eventName || this.disabled) {
      return
    }

    this.ensureSession()
    const engagementTime = this.consumeEngagementTime()
    const debugMode = params.debug_mode ?? this.config.debug
    this.queue.push({
      name: eventName,
      params: {
        ...params,
        engagement_time_msec: params.engagement_time_msec ?? engagementTime,
        session_id: this.session.id,
        ...(debugMode ? { debug_mode: true } : {}),
      },
      timestamp: Date.now(),
    })
    this.persistSession()

    if (this.config.batchIntervalMs > 0) {
      this.scheduleFlush()
      return
    }
    await this.flush("event")
  }

  async pageView(ctx: Partial<PageContext> = {}) {
    const page = this.resolvePageContext(ctx)
    const now = Date.now()
    if (this.shouldSkipPageView(page, now)) {
      this.rememberPageView(page, now)
      this.rememberPageContext(page)
      return
    }
    this.rememberPageView(page, now)
    await this.sendPageView(page)
  }

  private async sendPageView(page: PageContext) {
    await this.event("page_view", {
      page_location: page.pageLocation,
      page_referrer: page.pageReferrer,
      page_title: page.pageTitle,
    })
    this.rememberPageContext(page)

    if (this.config.autoViewSearchResults) {
      const searchTerm = getSearchTerm(page.pageLocation)
      if (searchTerm) {
        await this.viewSearchResults(searchTerm, {
          page_location: page.pageLocation,
          page_title: page.pageTitle,
        })
      }
    }
  }

  async appShow(_opts?: unknown) {
    this.ensureSession()
    if (this.config.autoPageView) {
      await this.trackAutoPageView("app-show")
    }
  }

  async appHide() {
    await this.flush("app-hide")
  }

  async pageShow(ctx: Partial<PageContext> = {}) {
    await this.pageView(ctx)
  }

  async pageHide() {
    await this.flush("page-hide")
  }

  onPageScroll(e: { scrollTop: number }) {
    if (!this.config.autoScroll || this.disabled) {
      return
    }
    const percent = getCurrentScrollPercent(e.scrollTop)
    const pageLocation = this.lastPage?.pageLocation || getCurrentLocation(this.config.appOrigin)
    const key = `${this.session.id}:${pageLocation}`
    if (percent >= 90 && this.scrollSentKey !== key) {
      this.scrollSentKey = key
      void this.event("scroll", {
        percent_scrolled: 90,
        page_location: pageLocation,
        page_title: this.lastPage?.pageTitle,
      })
    }
  }

  async viewSearchResults(searchTerm: string, extras: GA4Params = {}) {
    const normalized = searchTerm.trim()
    if (!normalized) {
      return
    }
    const key = `${this.session.id}:${normalized.toLowerCase()}`
    if (this.sentSearchTerms.has(key)) {
      return
    }
    this.sentSearchTerms.add(key)
    await this.event("view_search_results", {
      ...extras,
      search_term: normalized,
    })
  }

  async openExternal(url: string, opts: OutboundOptions = {}) {
    const normalizedUrl = normalizeOptionalString(url)
    if (!normalizedUrl) {
      return
    }

    await this.event("click", {
      link_url: normalizedUrl,
      link_domain: getUrlHostname(normalizedUrl),
      link_id: opts.linkId,
      link_text: opts.linkText,
      link_classes: opts.linkClasses,
      outbound: true,
    })

    if (isDownloadUrl(normalizedUrl)) {
      await this.trackFileDownload({
        url: normalizedUrl,
        linkId: opts.linkId,
        linkText: opts.linkText,
        linkClasses: opts.linkClasses,
      })
    }

    // #ifdef H5
    if (opts.open && typeof window !== "undefined") {
      window.open(normalizedUrl, "_blank", "noopener,noreferrer")
    }
    // #endif
  }

  async trackFileDownload(input: FileDownloadOptions) {
    const normalizedUrl = normalizeOptionalString(input.url)
    if (!normalizedUrl) {
      return
    }
    const parsed = parseFileInfo(normalizedUrl, input.fileName, input.fileExtension)
    if (!parsed.extension || !fileExtensionPattern.test(parsed.extension)) {
      return
    }
    await this.event("file_download", {
      file_extension: parsed.extension.toLowerCase(),
      file_name: parsed.fileName,
      link_url: normalizedUrl,
      link_id: input.linkId,
      link_text: input.linkText,
      link_classes: input.linkClasses,
    })
  }

  async formStart(input: FormOptions) {
    const key = `${this.session.id}:${input.formId || input.formName || input.formDestination || "form"}`
    if (this.startedForms.has(key)) {
      return
    }
    this.startedForms.add(key)
    await this.event("form_start", toFormParams(input))
  }

  async formSubmit(input: FormSubmitOptions) {
    await this.event("form_submit", {
      ...toFormParams(input),
      form_submit_text: input.formSubmitText,
    })
  }

  createVideoTracker(opts: VideoTrackerOptions): VideoTracker {
    return new GA4VideoTracker(this, opts)
  }

  async flush(_reason = "manual") {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = undefined
    }
    if (this.disabled || this.queue.length === 0) {
      return
    }

    const events = this.queue.splice(0)
    for (const item of events) {
      try {
        await this.sendEvent(item)
      } catch (error) {
        this.logger.warn("ga4-uniapp failed to send event.", error)
        this.queue.unshift(item)
        break
      }
    }
  }

  resetSession() {
    this.session = this.createSession(true)
    this.persistSession()
    this.scrollSentKey = ""
  }

  getContext(): Readonly<GA4ContextSnapshot> {
    return {
      measurementId: this.config.measurementId,
      clientId: this.clientId,
      userId: this.userId,
      sessionId: this.session.id,
      sessionNumber: this.session.number,
      lastEngagementTime: this.session.lastEngagementTs,
      optOut: this.disabled,
    }
  }

  private async trackAutoPageView(reason: AutoTrackReason) {
    const page = this.resolvePageContext({})
    const now = Date.now()
    if (this.shouldSkipPageView(page, now)) {
      this.rememberPageView(page, now)
      return
    }
    this.rememberPageView(page, now)
    this.logger.debug("ga4-uniapp auto page_view", reason, page.pageLocation)
    await this.sendPageView(page)
  }

  private shouldSkipPageView(page: PageContext, now = Date.now()) {
    return this.lastPageViewDedupe?.key === this.getPageViewDedupeKey(page)
      && now - this.lastPageViewDedupe.timestamp < pageViewDedupeMs
  }

  private rememberPageView(page: PageContext, timestamp = Date.now()) {
    this.lastPageViewDedupe = {
      key: this.getPageViewDedupeKey(page),
      timestamp,
    }
  }

  private rememberPageContext(page: PageContext) {
    this.lastPage = page
    this.write("last_page", page)
    this.scrollSentKey = ""
  }

  private getPageViewDedupeKey(page: PageContext) {
    return `${this.session.id}:${page.pageLocation}`
  }

  private scheduleAutoPageView(reason: AutoTrackReason) {
    if (!this.config.autoPageView || this.disabled) {
      return
    }
    setTimeout(() => {
      void this.trackAutoPageView(reason)
    }, 80)
  }

  private registerUniInterceptors() {
    if (this.uniInterceptorsRegistered || !this.config.autoUniInterceptors) {
      return
    }
    const uniApi = getUniApi()
    const addInterceptor = uniApi?.addInterceptor
    if (!addInterceptor) {
      return
    }

    this.uniInterceptorsRegistered = true
    const navigationMethods: InterceptorMethodName[] = ["navigateTo", "redirectTo", "reLaunch", "switchTab", "navigateBack"]
    navigationMethods.forEach((method) => {
      addInterceptor(method, {
        success: () => {
          this.scheduleAutoPageView("uni-navigation")
        },
      })
    })

    if (this.config.autoFileDownload) {
      this.addFileInterceptor(addInterceptor, "downloadFile", (input) => normalizeOptionalString(toRecord(input).url))
      this.addFileInterceptor(addInterceptor, "openDocument", (input) => normalizeOptionalString(toRecord(input).filePath))
    }
  }

  private addFileInterceptor(
    addInterceptor: (name: string, options: UniNamespace.InterceptorOptions) => void,
    method: InterceptorMethodName,
    resolveUrl: (input: unknown) => string,
  ) {
    let lastTrackedUrl = ""
    addInterceptor(method, {
      invoke: (input: unknown) => {
        const url = resolveUrl(input)
        if (!url || url === lastTrackedUrl) {
          return
        }
        lastTrackedUrl = url
        void this.trackFileDownload({
          url,
        })
      },
    })
  }

  // #ifdef H5
  private registerBrowserCollectors() {
    if (this.browserCollectorsRegistered || typeof window === "undefined" || typeof document === "undefined") {
      return
    }
    this.browserCollectorsRegistered = true

    this.registerBrowserHistoryCollector()
    this.registerBrowserClickCollector()
    this.registerBrowserFormCollector()
    this.registerBrowserScrollCollector()
    this.registerBrowserFlushCollectors()
  }

  private registerBrowserHistoryCollector() {
    if (!this.config.autoHistory || typeof history === "undefined") {
      return
    }

    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState
    history.pushState = ((...args: Parameters<History["pushState"]>) => {
      const result = originalPushState.apply(history, args)
      this.scheduleAutoPageView("history")
      return result
    }) as History["pushState"]
    history.replaceState = ((...args: Parameters<History["replaceState"]>) => {
      const result = originalReplaceState.apply(history, args)
      this.scheduleAutoPageView("history")
      return result
    }) as History["replaceState"]

    const onPopState = () => {
      this.scheduleAutoPageView("history")
    }
    window.addEventListener("popstate", onPopState)
    this.cleanupTasks.push(() => {
      history.pushState = originalPushState
      history.replaceState = originalReplaceState
      window.removeEventListener("popstate", onPopState)
    })
  }

  private registerBrowserClickCollector() {
    if (!this.config.autoFileDownload && !this.config.autoOutboundClick) {
      return
    }

    const onClick = (event: MouseEvent) => {
      const eventTarget = toDomLikeElement(event.target)
      const target = eventTarget?.closest("a[href], [data-ga4-link-url], [data-ga4-download-url]")
      if (!target) {
        return
      }

      const rawUrl = target.getAttribute("data-ga4-download-url")
        || target.getAttribute("data-ga4-link-url")
        || target.getAttribute("href")
        || ""
      const url = normalizeBrowserUrl(rawUrl)
      if (!url) {
        return
      }

      const linkOptions = {
        linkId: target.id || undefined,
        linkText: normalizeOptionalString(target.textContent),
        linkClasses: target.className || undefined,
      }

      if (this.config.autoOutboundClick && isOutboundUrl(url)) {
        void this.event("click", {
          link_url: url,
          link_domain: getUrlHostname(url),
          link_id: linkOptions.linkId,
          link_text: linkOptions.linkText,
          link_classes: linkOptions.linkClasses,
          outbound: true,
        })
      }
      if (this.config.autoFileDownload && isDownloadUrl(url)) {
        void this.trackFileDownload({
          url,
          ...linkOptions,
        })
      }
    }

    document.addEventListener("click", onClick, true)
    this.cleanupTasks.push(() => {
      document.removeEventListener("click", onClick, true)
    })
  }

  private registerBrowserFormCollector() {
    if (!this.config.autoForm) {
      return
    }

    const onFormStart = (event: Event) => {
      const form = getEventForm(event)
      if (form) {
        void this.formStart(getFormOptions(form))
      }
    }
    const onSubmit = (event: Event) => {
      const form = getEventForm(event)
      if (form) {
        void this.formSubmit(getFormOptions(form))
      }
    }
    const onSubmitClick = (event: MouseEvent) => {
      const eventTarget = toDomLikeElement(event.target)
      const target = eventTarget?.closest('button[type="submit"], input[type="submit"], uni-button[form-type="submit"], [data-ga4-form-submit]')
      if (!target) {
        return
      }
      const form = target.closest("form, uni-form, [data-ga4-form]")
      if (form) {
        void this.formSubmit(getFormOptions(form))
      }
    }

    document.addEventListener("focusin", onFormStart, true)
    document.addEventListener("input", onFormStart, true)
    document.addEventListener("submit", onSubmit, true)
    document.addEventListener("click", onSubmitClick, true)
    this.cleanupTasks.push(() => {
      document.removeEventListener("focusin", onFormStart, true)
      document.removeEventListener("input", onFormStart, true)
      document.removeEventListener("submit", onSubmit, true)
      document.removeEventListener("click", onSubmitClick, true)
    })
  }

  private registerBrowserScrollCollector() {
    if (!this.config.autoScroll) {
      return
    }

    let ticking = false
    const onScroll = () => {
      if (ticking) {
        return
      }
      ticking = true
      window.requestAnimationFrame(() => {
        ticking = false
        this.onPageScroll({
          scrollTop: window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0,
        })
      })
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    this.cleanupTasks.push(() => {
      window.removeEventListener("scroll", onScroll)
    })
  }

  private registerBrowserFlushCollectors() {
    const onPageHide = () => {
      void this.flush("page-hide")
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void this.flush("visibility-hidden")
      }
    }

    window.addEventListener("pagehide", onPageHide)
    document.addEventListener("visibilitychange", onVisibilityChange)
    this.cleanupTasks.push(() => {
      window.removeEventListener("pagehide", onPageHide)
      document.removeEventListener("visibilitychange", onVisibilityChange)
    })
  }
  // #endif

  private async sendEvent(item: QueuedEvent) {
    const params = this.buildCollectParams(item)
    const url = appendQuery(this.config.collectEndpoint, params)
    this.logger.debug("ga4-uniapp collect", item.name, url)
    const response = this.config.requestAdapter
      ? await this.config.requestAdapter({
        url,
        method: "GET",
        eventName: item.name,
        params,
      })
      : await defaultRequestAdapter({
        url,
        method: "GET",
        eventName: item.name,
        params,
      })
    if (!response.ok) {
      throw new Error(`GA4 collect returned ${response.statusCode || "a transport error"}.`)
    }
  }

  private buildCollectParams(item: QueuedEvent) {
    this.hitSequence += 1
    const params: Record<string, string> = {
      v: "2",
      tid: this.config.measurementId,
      cid: this.clientId,
      en: item.name,
      _p: String(this.pageId),
      _s: String(this.hitSequence),
      sid: String(this.session.id),
      sct: String(this.session.number),
      seg: "1",
      ul: getLanguage(),
      sr: getScreenResolution(),
    }

    if (this.config.appName) {
      params.an = this.config.appName
    }
    if (this.config.appVersion) {
      params.av = this.config.appVersion
    }
    if (this.userId) {
      params.uid = this.userId
    }
    if (this.config.anonymizeIp) {
      params.aip = "1"
    }
    if (this.consent.ad_personalization === "DENIED") {
      params.npa = "1"
    }

    Object.entries(item.params).forEach(([key, value]) => {
      if (value === undefined || value === null || !isAllowedParamName(key)) {
        return
      }
      const mappedKey = mapReservedParamName(key)
      if (mappedKey) {
        params[mappedKey] = stringifyParamValue(value)
        return
      }
      const prefix = typeof value === "number" && Number.isFinite(value) ? "epn." : "ep."
      params[`${prefix}${key}`] = stringifyParamValue(value)
    })

    Object.entries(this.userProperties).forEach(([key, value]) => {
      const prefix = typeof value === "number" && Number.isFinite(value) ? "upn." : "up."
      params[`${prefix}${key}`] = String(value)
    })

    return params
  }

  private resolvePageContext(ctx: Partial<PageContext>): PageContext {
    const storedLastPage = this.readObject<PageContext>("last_page")
    const pageLocation = normalizePageLocation(ctx.pageLocation, this.config.appOrigin)
      || getCurrentLocation(this.config.appOrigin)
    const pageTitle = normalizeOptionalString(ctx.pageTitle) || getCurrentTitle(pageLocation)
    const pageReferrer = normalizeOptionalString(ctx.pageReferrer)
      || this.lastPage?.pageLocation
      || storedLastPage?.pageLocation
      || getDocumentReferrer()

    return {
      pageLocation,
      pageReferrer,
      pageTitle,
    }
  }

  private ensureSession() {
    const now = Date.now()
    if (now - this.session.lastEngagementTs > this.config.sessionTimeoutMs) {
      this.session = this.createSession(true)
    }
  }

  private consumeEngagementTime() {
    const now = Date.now()
    const elapsed = Math.max(1, now - this.session.lastEngagementTs)
    this.session.lastEngagementTs = now
    this.persistSession()
    return elapsed
  }

  private getOrCreateClientId() {
    const existing = this.readString("client_id")
    if (existing) {
      this.write("client_id", existing)
      return existing
    }
    const created = `${randomInt(1000000000, 9999999999)}.${Math.floor(Date.now() / 1000)}`
    this.write("client_id", created)
    if (!this.readNumber("install_time")) {
      this.write("install_time", Date.now())
    }
    return created
  }

  private getOrCreateSession() {
    const stored = this.readObject<StoredSession>("session")
    if (stored?.id && stored.number && stored.lastEngagementTs) {
      if (Date.now() - stored.lastEngagementTs <= this.config.sessionTimeoutMs) {
        return stored
      }
    }
    return this.createSession(true)
  }

  private createSession(increment: boolean): StoredSession {
    const now = Date.now()
    const currentNumber = this.readNumber("session_number") || 0
    const nextNumber = increment ? currentNumber + 1 : Math.max(1, currentNumber)
    this.write("session_number", nextNumber)
    return {
      id: Math.floor(now / 1000),
      number: nextNumber,
      startedAt: now,
      lastEngagementTs: now,
    }
  }

  private persistSession() {
    this.write("session", this.session)
  }

  private scheduleFlush() {
    if (this.flushTimer) {
      return
    }
    this.flushTimer = setTimeout(() => {
      void this.flush("timer")
    }, this.config.batchIntervalMs)
  }

  private shouldRespectBrowserPrivacySignals() {
    let shouldRespect = false
    // #ifdef H5
    const nav = typeof navigator !== "undefined" ? navigator : undefined
    if (this.config.respectDoNotTrack && nav?.doNotTrack === "1") {
      shouldRespect = true
    }
    if (this.config.respectGlobalPrivacyControl && Boolean((nav as Navigator & { globalPrivacyControl?: boolean } | undefined)?.globalPrivacyControl)) {
      shouldRespect = true
    }
    // #endif
    return shouldRespect
  }

  private key(name: string) {
    return `${this.config.storagePrefix}_${name}`
  }

  private readString(name: string) {
    const value = this.storage.get(this.key(name))
    return typeof value === "string" ? value : ""
  }

  private readNumber(name: string) {
    const value = this.storage.get(this.key(name))
    return typeof value === "number" && Number.isFinite(value) ? value : 0
  }

  private readBoolean(name: string) {
    return this.storage.get(this.key(name)) === true
  }

  private readObject<T>(name: string): T | undefined {
    const value = this.storage.get(this.key(name))
    return value && typeof value === "object" ? value as T : undefined
  }

  private write(name: string, value: unknown) {
    this.storage.set(this.key(name), value)
  }

  private remove(name: string) {
    this.storage.remove(this.key(name))
  }
}

class GA4VideoTracker implements VideoTracker {
  private readonly sentProgress = new Set<number>()
  private hasStarted = false
  private visible: boolean
  private destroyed = false
  private lastCurrentTime = 0
  private lastDuration = 0

  constructor(private readonly ga4: UniAppGA4, private readonly opts: VideoTrackerOptions) {
    this.visible = opts.visible ?? true
  }

  onPlay() {
    if (this.destroyed || this.hasStarted) {
      return
    }
    this.hasStarted = true
    void this.ga4.event("video_start", this.videoParams(0, this.lastDuration, 0))
  }

  onPause() {
    this.emitProgressFromLastTime()
  }

  onTimeUpdate(detail: { currentTime: number; duration: number }) {
    if (this.destroyed) {
      return
    }
    this.lastCurrentTime = sanitizeNumber(detail.currentTime)
    this.lastDuration = sanitizeNumber(detail.duration)
    this.emitProgressFromLastTime()
  }

  onEnded() {
    if (this.destroyed) {
      return
    }
    this.emitProgressFromLastTime()
    void this.ga4.event("video_complete", this.videoParams(this.lastCurrentTime, this.lastDuration, 100))
  }

  onSeek(detail: { currentTime: number; duration: number }) {
    this.onTimeUpdate(detail)
  }

  onVisibilityChange(visible: boolean) {
    this.visible = visible
  }

  onPageHide() {
    this.emitProgressFromLastTime()
  }

  destroy() {
    this.destroyed = true
    this.sentProgress.clear()
  }

  private emitProgressFromLastTime() {
    if (!this.lastDuration || this.lastDuration <= 0) {
      return
    }
    const percent = Math.floor((this.lastCurrentTime / this.lastDuration) * 100)
    ;[10, 25, 50, 75].forEach((threshold) => {
      if (percent >= threshold && !this.sentProgress.has(threshold)) {
        this.sentProgress.add(threshold)
        void this.ga4.event("video_progress", this.videoParams(this.lastCurrentTime, this.lastDuration, threshold))
      }
    })
  }

  private videoParams(currentTime: number, duration: number, percent: number): GA4Params {
    return {
      video_current_time: Math.floor(currentTime),
      video_duration: Math.floor(duration),
      video_percent: percent,
      video_provider: this.opts.provider || "html5",
      video_title: this.opts.title,
      video_url: this.opts.url,
      visible: this.visible,
    }
  }
}

function createStorageDriver(): StorageDriver {
  const uniApi = getUniApi()
  if (uniApi?.getStorageSync && uniApi?.setStorageSync) {
    const getStorageSync = uniApi.getStorageSync.bind(uniApi)
    const setStorageSync = uniApi.setStorageSync.bind(uniApi)
    const removeStorageSync = uniApi.removeStorageSync?.bind(uniApi)
    return {
      get(key) {
        try {
          return getStorageSync(key)
        } catch {
          return undefined
        }
      },
      set(key, value) {
        try {
          setStorageSync(key, value)
        } catch {
          // Ignore storage failures so analytics never interrupts app code.
        }
      },
      remove(key) {
        try {
          removeStorageSync?.(key)
        } catch {
          // Ignore storage failures so analytics never interrupts app code.
        }
      },
    }
  }

  const memory = new Map<string, unknown>()
  return {
    get: (key) => memory.get(key),
    set: (key, value) => {
      memory.set(key, value)
    },
    remove: (key) => {
      memory.delete(key)
    },
  }
}

async function defaultRequestAdapter(req: UniGA4HttpRequest): Promise<UniGA4HttpResponse> {
  const uniApi = getUniApi()
  const request = uniApi?.request?.bind(uniApi)
  if (!request) {
    return {
      ok: false,
    }
  }

  return new Promise((resolve) => {
    request({
      url: req.url,
      method: req.method,
      success(response: { statusCode?: number }) {
        const statusCode = response.statusCode || 0
        resolve({
          ok: statusCode >= 200 && statusCode < 400,
          statusCode,
          raw: response,
        })
      },
      fail(error: unknown) {
        resolve({
          ok: false,
          raw: error,
        })
      },
    })
  })
}

function getUniApi(): UniApi | undefined {
  return (globalThis as typeof globalThis & { uni?: UniApi }).uni
}

function appendQuery(endpoint: string, params: Record<string, string>) {
  const query = Object.entries(params)
    .filter(([, value]) => value !== "")
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&")
  return endpoint.includes("?") ? `${endpoint}&${query}` : `${endpoint}?${query}`
}

function mapReservedParamName(key: string) {
  const mapping: Record<string, string> = {
    page_location: "dl",
    page_referrer: "dr",
    page_title: "dt",
    language: "ul",
    screen_resolution: "sr",
    session_id: "sid",
    engagement_time_msec: "_et",
    debug_mode: "_dbg",
  }
  return mapping[key]
}

function stringifyParamValue(value: GA4Value) {
  if (typeof value === "boolean") {
    return value ? "1" : "0"
  }
  return String(value ?? "")
}

function normalizeEventName(name: string) {
  const normalized = name.trim().replace(/[^\w]/g, "_").slice(0, 40)
  return /^[a-zA-Z][\w]{0,39}$/.test(normalized) ? normalized : ""
}

function isAllowedParamName(name: string) {
  return /^[a-zA-Z][\w]{0,39}$/.test(name) && !name.startsWith("ga_")
}

function normalizeOptionalString(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function sanitizeNumber(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

function getLanguage() {
  let language = ""
  // #ifdef H5
  if (typeof navigator !== "undefined" && typeof navigator.language === "string") {
    language = navigator.language
  }
  // #endif
  // #ifndef H5
  if (!language) {
    language = normalizeOptionalString(getSystemInfoSafe()?.language)
  }
  // #endif
  return language.toLowerCase()
}

function getScreenResolution() {
  let width = 0
  let height = 0
  // #ifdef H5
  if (typeof screen !== "undefined") {
    width = screen.width
    height = screen.height
  }
  // #endif
  // #ifndef H5
  if (!width || !height) {
    const systemInfo = getSystemInfoSafe()
    width = sanitizeNumber(systemInfo?.screenWidth || systemInfo?.windowWidth || 0)
    height = sanitizeNumber(systemInfo?.screenHeight || systemInfo?.windowHeight || 0)
  }
  // #endif
  return width && height ? `${width}x${height}` : ""
}

function getCurrentLocation(appOrigin = defaultAppOrigin) {
  let pageLocation = ""
  // #ifdef H5
  if (typeof location !== "undefined" && typeof location.href === "string" && location.href) {
    pageLocation = location.href
  }
  // #endif
  // #ifndef H5
  if (!pageLocation) {
    const appPath = getCurrentAppPath()
    pageLocation = createRuntimeUrl(appPath, `${normalizeAppOrigin(appOrigin)}/`)?.href || ""
  }
  // #endif
  return pageLocation || `${normalizeAppOrigin(appOrigin)}/`
}

// #ifndef H5
function getCurrentAppPath() {
  const pages = getCurrentPagesSafe()
  const currentPage = pages[pages.length - 1]
  const fullPath = normalizeOptionalString(currentPage?.$page?.fullPath)
  if (fullPath) {
    return withLeadingSlash(fullPath)
  }

  const route = normalizeOptionalString(currentPage?.route || currentPage?.$page?.path)
  if (!route) {
    return "/"
  }
  const path = withLeadingSlash(route)
  const query = currentPage?.options || currentPage?.$page?.options
  return appendRouteQuery(path, query)
}
// #endif

function getCurrentTitle(fallback: string) {
  // #ifdef H5
  if (typeof document !== "undefined" && document.title) {
    return document.title
  }
  // #endif
  return fallback
}

function getDocumentReferrer() {
  let referrer = ""
  // #ifdef H5
  if (typeof document !== "undefined") {
    referrer = document.referrer
  }
  // #endif
  return referrer
}

function normalizePageLocation(value: unknown, appOrigin = defaultAppOrigin) {
  const normalized = normalizeOptionalString(value)
  if (!normalized) {
    return ""
  }
  return createRuntimeUrl(normalized, getPageLocationBase(appOrigin))?.href || ""
}

function normalizeAppOrigin(value: unknown) {
  const normalized = normalizeOptionalString(value) || defaultAppOrigin
  const parsed = createRuntimeUrl(normalized)
  if (!parsed || (parsed.protocol !== "https:" && parsed.protocol !== "http:")) {
    return defaultAppOrigin
  }
  return parsed.origin
}

// #ifndef H5
function withLeadingSlash(value: string) {
  return value.startsWith("/") ? value : `/${value}`
}

function appendRouteQuery(path: string, query: Record<string, unknown> | undefined) {
  if (!query) {
    return path
  }
  const searchParams = createRuntimeSearchParams("")
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return
    }
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null) {
          searchParams.append(key, String(item))
        }
      })
      return
    }
    searchParams.set(key, String(value))
  })
  const queryString = searchParams.toString()
  return queryString ? `${path}?${queryString}` : path
}

function getCurrentPagesSafe(): UniPageLike[] {
  const getCurrentPagesFn = (globalThis as typeof globalThis & { getCurrentPages?: () => UniPageLike[] }).getCurrentPages
  if (typeof getCurrentPagesFn !== "function") {
    return []
  }
  try {
    return getCurrentPagesFn()
  } catch {
    return []
  }
}

function getSystemInfoSafe() {
  const getSystemInfoSync = getUniApi()?.getSystemInfoSync
  if (typeof getSystemInfoSync !== "function") {
    return undefined
  }
  try {
    return getSystemInfoSync()
  } catch {
    return undefined
  }
}
// #endif

function getSearchTerm(pageLocation: string) {
  const candidates = [pageLocation]
  const hashIndex = pageLocation.indexOf("#")
  if (hashIndex >= 0) {
    candidates.push(pageLocation.slice(hashIndex + 1))
  }

  for (const candidate of candidates) {
    const searchParams = getSearchParams(candidate)
    for (const key of searchQueryKeys) {
      const value = searchParams.get(key)
      if (value) {
        return value
      }
    }
  }
  return ""
}

function getSearchParams(value: string) {
  const normalized = normalizeOptionalString(value)
  const parsedUrl = normalized ? createRuntimeUrl(normalized, getCurrentLocationBase()) : undefined
  if (parsedUrl?.search) {
    return parsedUrl.searchParams
  }
  return createRuntimeSearchParams(looksLikeSearchParams(normalized) ? normalized : "")
}

function getCurrentScrollPercent(scrollTop: number) {
  let percent = 0
  // #ifdef H5
  if (typeof document === "undefined" || typeof window === "undefined") {
    return 0
  }
  const doc = document.documentElement
  const body = document.body
  const scrollHeight = Math.max(doc.scrollHeight, body?.scrollHeight || 0)
  const viewportHeight = window.innerHeight || doc.clientHeight
  const maxScrollTop = Math.max(1, scrollHeight - viewportHeight)
  percent = Math.min(100, Math.floor((scrollTop / maxScrollTop) * 100))
  // #endif
  return percent
}

function getUrlHostname(url: string) {
  const normalized = normalizeOptionalString(url)
  if (!normalized) {
    return ""
  }
  const parsedUrl = createRuntimeUrl(normalized, getCurrentLocationBase())
  if (!parsedUrl || isIgnoredUrlProtocol(parsedUrl.protocol)) {
    return ""
  }
  return parsedUrl.hostname.toLowerCase()
}

// #ifdef H5
function normalizeBrowserUrl(url: string) {
  const normalized = normalizeOptionalString(url)
  if (!normalized) {
    return ""
  }
  const parsedUrl = createRuntimeUrl(normalized, getCurrentLocationBase())
  if (!parsedUrl || isIgnoredUrlProtocol(parsedUrl.protocol)) {
    return ""
  }
  return parsedUrl.href
}

function isOutboundUrl(url: string) {
  const currentHostname = getUrlHostname(getCurrentLocation())
  const targetHostname = getUrlHostname(url)
  if (!currentHostname || !targetHostname) {
    return false
  }
  return targetHostname !== currentHostname
}
// #endif

function isDownloadUrl(url: string) {
  return fileExtensionPattern.test(parseFileInfo(url).extension)
}

function parseFileInfo(url: string, fileName?: string, fileExtension?: string) {
  const pathname = createRuntimeUrl(url, getCurrentLocationBase())?.pathname || url
  const cleanName = fileName || safeDecode(pathname.split("/").filter(Boolean).pop() || "")
  const extension = fileExtension || cleanName.split(".").pop() || ""
  return {
    fileName: cleanName || url,
    extension: extension.toLowerCase(),
  }
}

function toFormParams(input: FormOptions): GA4Params {
  return {
    form_id: input.formId,
    form_name: input.formName,
    form_destination: input.formDestination,
  }
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {}
}

// #ifdef H5
function getEventForm(event: Event) {
  return toDomLikeElement(event.target)?.closest("form, uni-form, [data-ga4-form]") || undefined
}

function getFormOptions(form: DomLikeElement): FormOptions {
  const formId = form.getAttribute("id") || form.getAttribute("name") || undefined
  return {
    formId,
    formName: form.getAttribute("aria-label") || form.getAttribute("name") || formId || undefined,
    formDestination: form.getAttribute("action") || getCurrentLocation(),
  }
}

function toDomLikeElement(value: unknown): DomLikeElement | undefined {
  if (!value || typeof value !== "object") {
    return undefined
  }
  const candidate = value as Partial<DomLikeElement>
  return typeof candidate.closest === "function" && typeof candidate.getAttribute === "function"
    ? candidate as DomLikeElement
    : undefined
}
// #endif

function createRuntimeUrl(input: string, base?: string) {
  try {
    const URLConstructor = globalThis.URL
    if (typeof URLConstructor !== "function") {
      return undefined
    }
    return base === undefined ? new URLConstructor(input) : new URLConstructor(input, base)
  } catch {
    return undefined
  }
}

function createRuntimeSearchParams(input: string) {
  const URLSearchParamsConstructor = globalThis.URLSearchParams
  return new URLSearchParamsConstructor(input)
}

function getCurrentLocationBase(appOrigin = defaultAppOrigin) {
  const origin = normalizeAppOrigin(appOrigin)
  return createRuntimeUrl(getCurrentLocation(origin), `${origin}/`)?.href || `${origin}/`
}

function getPageLocationBase(appOrigin = defaultAppOrigin) {
  // #ifdef H5
  if (typeof location !== "undefined" && typeof location.href === "string" && location.href) {
    return location.href
  }
  // #endif
  return `${normalizeAppOrigin(appOrigin)}/`
}

function looksLikeSearchParams(value: string) {
  return value.startsWith("?") || (!value.includes("/") && value.includes("="))
}

function isIgnoredUrlProtocol(protocol: string) {
  return protocol === "javascript:" || protocol === "mailto:" || protocol === "tel:"
}

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}
