// Ambient declaration for the generated catalogue. Deliberately global (no top-level import) so this
// stays an ambient module declaration rather than a module augmentation.
declare module '*/itemCatalogue.json' {
  const catalogue: import('./catalogueTypes').RawCatalogue
  export default catalogue
}
