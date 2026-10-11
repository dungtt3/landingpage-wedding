import type { AssetEntry, AssetStatus, ResolvedAsset, StorybookState } from '../engine/sceneTypes';

/** Status a manifest entry will get, without loading it (used by the debug panel). */
export function staticStatus(a: AssetEntry, present: ReadonlySet<string>): AssetStatus {
  if (present.has(a.src)) return 'available';
  if (a.placeholder) return 'placeholder';
  return a.requirement === 'optional' ? 'optional' : 'missing';
}

/**
 * Debug panel (`?debug`): manifest checklist with live status, so missing and
 * placeholder art is visible at a glance while the experience runs.
 */
export function AssetReport({
  manifest,
  assets,
  present,
  state,
  layout,
}: {
  manifest: AssetEntry[];
  assets: Record<string, ResolvedAsset>;
  present: ReadonlySet<string>;
  state: StorybookState;
  layout: string;
}) {
  const rows = manifest.map((a) => ({ a, status: assets[a.id]?.status ?? staticStatus(a, present), loaded: a.id in assets }));
  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.status] = (counts[r.status] ?? 0) + 1;
  return (
    <details className="sb-debug">
      <summary>
        Storybook · {state} · {layout} ·{' '}
        {Object.entries(counts)
          .map(([k, v]) => `${k} ${v}`)
          .join(' · ')}
      </summary>
      <div className="sb-debug__scroll">
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Asset</th>
              <th>Req.</th>
              <th>Expected path</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ a, status, loaded }) => (
              <tr key={a.id} data-status={status}>
                <td>
                  {status}
                  {loaded ? '' : ' (not loaded)'}
                </td>
                <td>{a.id}</td>
                <td>{a.requirement}</td>
                <td>
                  <code>public{a.src}</code>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
