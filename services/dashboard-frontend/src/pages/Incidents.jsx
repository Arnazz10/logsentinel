import { useMemo, useState } from 'react';
import { Bug, Check, Copy, Eye } from 'lucide-react';
import { PageHead, Readout, useNow } from '../components/ui';
import { fmtDur, fmtTime } from '../lib/engine';
import { useLive } from '../lib/store';

const FILTERS = ['active', 'open', 'ack', 'resolved', 'all'];
const sevTag = { SEV1: 'signal', SEV2: 'amber', SEV3: 'steel' };
const statusTag = { open: 'signal', ack: 'amber', resolved: 'ok' };

const postmortem = (i) => `## ${i.id} — ${i.service}

**Severity:** ${i.severity}
**Opened:** ${new Date(i.openedAt).toISOString()}
**Acknowledged:** ${i.ackAt ? new Date(i.ackAt).toISOString() : '—'}
**Resolved:** ${i.resolvedAt ? new Date(i.resolvedAt).toISOString() : '—'}
**Signals:** ${i.count} anomalous records · peak score ${i.peak.toFixed(3)}

### Summary
${i.title}

### Timeline
${[...i.events].reverse().map((e) => `- ${new Date(e.ts).toISOString().slice(11, 19)} — ${e.text}`).join('\n')}

### Follow-ups
- [ ] Root cause
- [ ] Alert threshold review
`;

export default function Incidents() {
  const { incidents, ack, resolve, addNote, inject } = useLive();
  const now = useNow(1000);
  const [filter, setFilter] = useState('active');
  const [selId, setSelId] = useState(null);
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);

  const list = useMemo(
    () =>
      incidents.filter((i) =>
        filter === 'all' ? true : filter === 'active' ? i.status !== 'resolved' : i.status === filter,
      ),
    [incidents, filter],
  );
  const sel = incidents.find((i) => i.id === selId) || list[0];

  const acked = incidents.filter((i) => i.ackAt);
  const resolved = incidents.filter((i) => i.resolvedAt);
  const mtta = acked.length ? acked.reduce((a, i) => a + (i.ackAt - i.openedAt), 0) / acked.length : null;
  const mttr = resolved.length ? resolved.reduce((a, i) => a + (i.resolvedAt - i.openedAt), 0) / resolved.length : null;
  const active = incidents.filter((i) => i.status !== 'resolved').length;

  const submitNote = (e) => {
    e.preventDefault();
    if (!note.trim() || !sel) return;
    setSelId(sel.id);
    addNote(sel.id, note.trim());
    setNote('');
  };

  return (
    <section className="page">
      <div className="wrap">
        <PageHead
          index="04"
          kicker="incident response"
          title={
            <>
              Incidents, <em>not alerts</em>
            </>
          }
          actions={
            <button className="btn signal" onClick={() => inject(null, 5)}>
              <Bug size={13} /> simulate outage
            </button>
          }
        >
          Two or more anomalies on the same service inside the correlation window open an incident. Further signals attach to it
          instead of paging again. Quiet incidents auto-resolve.
        </PageHead>

        <div className="strip" style={{ '--n': 4 }}>
          <Readout label="active" value={active} color={active ? 'var(--signal)' : 'var(--ok)'} />
          <Readout label="total (stored)" value={incidents.length} />
          <Readout label="mtta" value={fmtDur(mtta)} sub="mean time to acknowledge" />
          <Readout label="mttr" value={fmtDur(mttr)} sub="mean time to resolve" />
        </div>

        <div className="grid g-inc mt-12">
          <div className="panel">
            <div className="panel-head">
              <div className="seg">
                {FILTERS.map((f) => (
                  <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="inc-list scroll" style={{ maxHeight: 620 }}>
              {!list.length && (
                <div className="empty">
                  no {filter} incidents.
                  <br />
                  <br />
                  hit “simulate outage” to start one.
                </div>
              )}
              {list.map((i) => (
                <button key={i.id} className={`inc-item ${sel?.id === i.id ? 'sel' : ''}`} onClick={() => setSelId(i.id)}>
                  <div>
                    <div className="id">{i.id}</div>
                    <span className={`tag ${sevTag[i.severity]}`} style={{ marginTop: 6 }}>
                      {i.severity}
                    </span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="ttl">{i.service}</div>
                    <div className="meta" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {i.title}
                    </div>
                    <div className="meta">
                      {fmtDur((i.resolvedAt || now) - i.openedAt)} · {i.count} signals
                    </div>
                  </div>
                  <span className={`tag ${statusTag[i.status]}`}>{i.status}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel ticks">
            {!sel ? (
              <div className="empty" style={{ padding: 120 }}>
                select an incident
              </div>
            ) : (
              <>
                <div className="panel-head" style={{ flexWrap: 'wrap' }}>
                  <h3>
                    <span className="idx">{sel.id}</span> {sel.service}
                    <span className={`tag ${sevTag[sel.severity]}`}>{sel.severity}</span>
                    <span className={`tag ${statusTag[sel.status]}`}>{sel.status}</span>
                  </h3>
                  <div className="row">
                    <button className="btn sm" disabled={sel.status !== 'open'} onClick={() => { setSelId(sel.id); ack(sel.id); }}>
                      <Eye size={12} /> acknowledge
                    </button>
                    <button className="btn sm primary" disabled={sel.status === 'resolved'} onClick={() => { setSelId(sel.id); resolve(sel.id); }}>
                      <Check size={12} /> resolve
                    </button>
                    <button
                      className="btn sm ghost"
                      onClick={() => {
                        navigator.clipboard?.writeText(postmortem(sel));
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }}
                      title="Copy a Markdown post-mortem skeleton"
                    >
                      <Copy size={12} /> {copied ? 'copied' : 'post-mortem'}
                    </button>
                  </div>
                </div>
                <div className="panel-body">
                  <p className="mono" style={{ margin: 0, fontSize: 14 }}>
                    {sel.title}
                  </p>
                  <div className="strip mt-12" style={{ '--n': 4 }}>
                    <Readout label="opened" value={fmtTime(sel.openedAt)} />
                    <Readout label="duration" value={fmtDur((sel.resolvedAt || now) - sel.openedAt)} />
                    <Readout label="signals" value={sel.count} />
                    <Readout label="peak score" value={sel.peak.toFixed(3)} color="var(--signal)" />
                  </div>
                  <form onSubmit={submitNote} className="row mt-24">
                    <input className="field" style={{ flex: 1 }} placeholder="Add a note to the timeline — e.g. rolled back payment-svc to v2.3.1" value={note} onChange={(e) => setNote(e.target.value)} />
                    <button className="btn" type="submit">
                      add note
                    </button>
                  </form>
                  <div className="label mt-24" style={{ marginBottom: 14 }}>
                    timeline
                  </div>
                  <div className="timeline scroll" style={{ maxHeight: 360 }}>
                    {sel.events.map((e, idx) => (
                      <div key={`${e.ts}-${idx}`} className={`tl-ev ${e.kind}`}>
                        <div className="when">
                          {fmtTime(e.ts)} · {e.kind}
                        </div>
                        <div className="txt">{e.text}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
