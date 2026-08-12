
declare module "*/icons.json" {
  const icons: {
    mappedCount: number
    distinctIconCount: number
    /** Keyed by wowItemId as a string, because JSON object keys are strings. */
    icons: Record<string, string>
  }
  export default icons
}
