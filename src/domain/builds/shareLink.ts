import { validateBuild } from './buildSerialization'
import type { BuildImportResult, SavedBuild } from './buildTypes'

/**
 * A whole build in a URL, so a build made on one machine opens on another from a link.
 *
 * Builds were browser-local — named saves live in `localStorage`, which does not follow you from the
 * desktop to a phone — and the only way across was copying a JSON blob by hand. A link needs no
 * server: everything is in the address, which is what keeps this app local-first.
 *
 * **It lives in the fragment (`#build=`), not the query string.** A fragment never leaves the browser —
 * GitHub Pages is never sent it, so a shared build is not in anyone's access log — and it cannot
 * collide with `?simulation=1`.
 *
 * **Compressed, because a plain link does not fit where people paste them.** Measured on the fullest
 * realistic build — every slot filled, 26 gems, twenty buffs, talents spent — the JSON is 3,171 bytes:
 * 4,228 characters as plain base64url and 1,424 deflated. Discord caps a message at 2,000, and sending
 * a build to a raid leader is the case this is for. `CompressionStream` is built into every browser
 * this app targets, so it costs no dependency.
 *
 * The value is `<encoding>.<payload>`. Encoding `1` is deflate; `0` is the same JSON uncompressed,
 * written only where `CompressionStream` is missing and always readable. The build inside carries its
 * own format version, and decoding goes through `validateBuild` — the same checks a pasted build gets —
 * so a link is exactly as trusted as an import, which is to say not at all until it is checked.
 */

export const SHARE_HASH_KEY = 'build'

const DEFLATE = '1'
const PLAIN = '0'

/**
 * Upper bounds on untrusted input, well clear of real builds.
 *
 * The fullest build encodes to about 1,400 characters and 3,200 bytes of JSON, so ten times that is
 * room for growth. The decoded cap is what stops a small link inflating into something that hangs the
 * tab — compressed data is the one place a few kilobytes can legitimately claim to be megabytes.
 */
const MAX_PAYLOAD_CHARS = 16_000
const MAX_DECODED_BYTES = 256_000

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ''
  // Chunked: spreading a large array into `fromCharCode` overflows the call stack.
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlToBytes(text: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) throw new Error('not base64url')
  const padded = text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index)
  return bytes
}

async function readCapped(stream: ReadableStream<Uint8Array>, limit: number): Promise<Uint8Array> {
  const reader = stream.getReader()
  const chunks: Uint8Array[] = []
  let total = 0

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > limit) {
      await reader.cancel()
      throw new Error('too large')
    }
    chunks.push(value)
  }

  const joined = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    joined.set(chunk, offset)
    offset += chunk.byteLength
  }
  return joined
}

// Typed as `BufferSource` because that is what the compression streams' writable side is declared to
// accept; a `ReadableStream<Uint8Array>` is not assignable to it under TypeScript's DOM types.
function streamOf(bytes: Uint8Array<ArrayBuffer>): ReadableStream<BufferSource> {
  return new ReadableStream<BufferSource>({
    start(controller) {
      controller.enqueue(bytes)
      controller.close()
    },
  })
}

/**
 * The link value for a build. `savedAt` is dropped, so the same build always produces the same link —
 * a timestamp would make two shares of one build look different for no reason. Reading it back fills
 * `savedAt` in, as it does for any build without one.
 */
export async function encodeBuildForLink(build: SavedBuild): Promise<string> {
  const { savedAt: _savedAt, ...stable } = build
  const json = new TextEncoder().encode(JSON.stringify(stable))

  if (typeof CompressionStream === 'undefined') return `${PLAIN}.${bytesToBase64Url(json)}`

  const compressed = await readCapped(streamOf(json).pipeThrough(new CompressionStream('deflate')), Number.POSITIVE_INFINITY)
  return `${DEFLATE}.${bytesToBase64Url(compressed)}`
}

/** A full address that opens this app with the build loaded. */
export function shareUrlFor(value: string, location: Pick<Location, 'origin' | 'pathname'>): string {
  // The query string is left behind on purpose: `?simulation=1` is a development switch, not part of
  // anyone's build.
  return `${location.origin}${location.pathname}#${SHARE_HASH_KEY}=${value}`
}

/** The link value in a URL fragment, if the fragment is a shared build at all. */
export function readShareValue(hash: string): string | undefined {
  const params = new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
  const value = params.get(SHARE_HASH_KEY)
  return value === null || value === '' ? undefined : value
}

/**
 * Turns a link value back into a build, through the same validation a pasted build gets.
 *
 * Never throws. A link is text someone else wrote, or text a chat app mangled, so every failure is a
 * sentence the page can show rather than an exception it has to catch.
 */
export async function decodeBuildFromLink(value: string): Promise<BuildImportResult> {
  const broken = (why: string): BuildImportResult => ({ ok: false, error: `That build link could not be read — ${why}.` })

  if (value.length > MAX_PAYLOAD_CHARS) return broken('it is far longer than any build')

  const separator = value.indexOf('.')
  const encoding = separator === -1 ? '' : value.slice(0, separator)
  const payload = separator === -1 ? '' : value.slice(separator + 1)
  if (encoding !== DEFLATE && encoding !== PLAIN) return broken('it is not in a format this app writes')

  let bytes: Uint8Array<ArrayBuffer>
  try {
    bytes = base64UrlToBytes(payload)
  } catch {
    return broken('it looks cut off or altered')
  }

  let json: Uint8Array
  if (encoding === PLAIN) {
    if (bytes.byteLength > MAX_DECODED_BYTES) return broken('it is far larger than any build')
    json = bytes
  } else {
    if (typeof DecompressionStream === 'undefined') return broken('this browser cannot decompress it')
    try {
      json = await readCapped(streamOf(bytes).pipeThrough(new DecompressionStream('deflate')), MAX_DECODED_BYTES)
    } catch {
      return broken('it looks cut off or altered')
    }
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(new TextDecoder().decode(json))
  } catch {
    return broken('it looks cut off or altered')
  }

  return validateBuild(parsed)
}
