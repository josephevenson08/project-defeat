import { setScenePreference, useSceneState } from './sceneControl'

/**
 * "3D scene: on", the prototypes' switch, at the end of the top bar (on a narrow screen, of the wordmark's row).
 *
 * It stays focusable when it cannot be pressed (reduced motion, a device that gets the still backdrop),
 * so a keyboard or screen reader can still reach it and hear why.
 */
export function SceneSwitch() {
  const scene = useSceneState()
  const pressed = scene.status === 'on' || scene.status === 'loading'
  const fixed = scene.status === 'reduced' || scene.status === 'unavailable'
  const word = scene.status === 'reduced' ? 'off (reduced motion)' : scene.status === 'unavailable' ? 'unavailable' : pressed ? 'on' : 'off'

  return (
    <button
      type="button"
      className="scene-switch"
      aria-pressed={pressed}
      aria-disabled={fixed || undefined}
      title={scene.status === 'unavailable' ? `The still backdrop instead: ${scene.why}.` : undefined}
      onClick={() => {
        if (!fixed) setScenePreference(!pressed)
      }}
      data-testid="scene-switch"
      data-status={scene.status}
    >
      3D scene: {word}
      {scene.status === 'unavailable' && <span className="visually-hidden">, {scene.why}</span>}
    </button>
  )
}
