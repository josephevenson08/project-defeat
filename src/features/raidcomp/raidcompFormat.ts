import type { RaidBuild } from '../../domain/raidcomp'

/** A vendored icon's address, built from `BASE_URL` so it works under GitHub Pages' sub-path too. */
export const iconUrl = (name: string | undefined) => (name ? `${import.meta.env.BASE_URL}icons/${name}.jpg` : undefined)

/** "An" for "An Enhancement Shaman", "A" for "A Holy Paladin". */
export const article = (name: string) => (/^[AEIOU]/.test(name) ? 'An' : 'A')

/** "Feral (Bear) Druid": the build as the palette names it, with its class. */
export const buildName = (build: RaidBuild) => `${build.label} ${build.className}`

/** "Strength of Earth Totem, Grace of Air Totem and Windfury Totem". */
export const inWords = (names: readonly string[]) => (names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`)
