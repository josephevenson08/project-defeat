declare module "*/raidcompIcons.json" {
  const icons: {
    spellIcons: Record<string, { name: string; spellId: number; icon: string; spellName?: string }>
    specIcons: Record<string, { className: string; spec: string; icon: string; fromTalent: string }>
  }
  export default icons
}
