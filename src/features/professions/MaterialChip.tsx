import materialIcons from '../../domain/professions/materialIcons.json'

const ICONS: Record<string, { wowItemId: number; icon: string }> = materialIcons.materials

/**
 * A material, with its artwork when the mapping has it.
 *
 * **Degrades to the name rather than to a gap.** Four of the seventy-three gathered materials do not
 * resolve to an item in the pinned upstream — Netherdust Bush and Sorrowmoss among them, where the
 * node and the item it yields are named differently — and those four are listed in
 * `materialIcons.json` under `missing` so the absence is recorded rather than discovered. A chip with
 * no icon still reads correctly; a broken image would not.
 */
export function MaterialChip({ material }: { material: string }) {
  const entry = ICONS[material]

  return (
    <span className="material-chip" data-testid="material-chip">
      {entry && (
        <img
          className="material-chip-icon"
          src={`${import.meta.env.BASE_URL}icons/${entry.icon}.jpg`}
          alt=""
          loading="lazy"
        />
      )}
      {material}
    </span>
  )
}
