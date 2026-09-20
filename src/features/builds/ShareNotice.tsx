import type { BuildImportIssue } from '../../domain/builds/buildTypes'

export type ShareNoticeState = { kind: 'loaded'; issues: readonly BuildImportIssue[] } | { kind: 'error'; message: string }

type ShareNoticeProps = {
  notice: ShareNoticeState
  onDismiss: () => void
}

/**
 * What happened to the build link this page was opened with.
 *
 * **Said out loud either way.** A link that loads puts you straight into the planner wearing someone
 * else's gear, which is disorienting if nothing says why. A link that fails — cut off by a chat app,
 * say — leaves you on the front page, which would look like the link simply did nothing. And a link
 * that loads with dropped slots reports them, for the same reason a pasted import does: an item that
 * has left the catalogue is a change the sender did not make.
 */
export function ShareNotice({ notice, onDismiss }: ShareNoticeProps) {
  const isError = notice.kind === 'error'

  return (
    <div
      className={`share-notice${isError ? ' share-notice-error' : ''}`}
      role={isError ? 'alert' : 'status'}
      data-testid="share-notice"
    >
      <div className="share-notice-text">
        {isError ? (
          <p>{notice.message} Nothing was loaded.</p>
        ) : (
          <>
            <p>
              <strong>Loaded a shared build.</strong> Save it under a name on the Build tab if you want to keep it — a
              reload starts clean.
            </p>
            {notice.issues.length > 0 && (
              <ul className="share-notice-issues">
                {notice.issues.map((issue) => (
                  <li key={`${issue.slot ?? 'build'}-${issue.message}`}>{issue.message}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
      <button type="button" className="share-notice-dismiss" onClick={onDismiss} data-testid="share-notice-dismiss">
        Dismiss
      </button>
    </div>
  )
}
