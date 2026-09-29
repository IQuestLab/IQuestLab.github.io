import { Fragment, useState } from 'react'
import { benchmarks as B, formatScore, reportedScores } from '../../shared'
import { useTr } from '../../lib/i18n'
import Figure from './Figure'

const HL = B.highlight

// A footnote paragraph: `backticks` become code, \n a line break.
function NoteText({ text }) {
  return text.split('\n').map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line.split('`').map((part, j) => (j % 2 ? <code key={j}>{part}</code> : part))}
    </Fragment>
  ))
}

// One panel per benchmark, with IQuest-Q1 highlighted.
const PANEL_LIMITS = {
  'Humanity’s Last Exam': [0, 50],
  'Terminal-Bench 2.1': [20, 95],
}
const FINAL_LIMITS = { 'DeepSWE v1.1': [0, 80], NL2Repo: [0, 80], 'Agents’ Last Exam': [0, 40] }

// Rounded lower bound with headroom above the highest bar, then the report's per-panel overrides.
function axisLimits(row) {
  const known = reportedScores(row.scores)
  const low = Math.min(...known), high = Math.max(...known)
  const unit = high <= 10 ? 1 : 5
  const span = Math.max(high - low, 3 * unit)
  let ymin = Math.max(0, Math.floor((low - 0.2 * span) / unit) * unit)
  let ymax = high + 0.16 * Math.max(high - ymin, 1)
  const hl = row.scores[HL]
  if (hl != null && 1 + known.filter(v => v > hl).length > 2) {
    // Full zero-based range when IQuest-Q1 is below the top two.
    ymin = 0
    ymax = Math.ceil((high * 1.1) / 20) * 20
  }
  if (PANEL_LIMITS[row.name]) {
    ;[ymin, ymax] = PANEL_LIMITS[row.name]
    if (high >= ymax) ymax = Math.ceil((high * 1.1) / 20) * 20
  }
  if (FINAL_LIMITS[row.name]) [ymin, ymax] = FINAL_LIMITS[row.name]
  if (row.name === 'JobBench') ymax = 70
  if (row.name === 'IQuest-CLIBench') ymax = 65
  if (row.name === 'CyberGym') ymin = 50
  return [ymin, ymax]
}

function BarPanel({ row }) {
  const [hover, setHover] = useState(null)
  const [ymin, ymax] = axisLimits(row)
  const at = v => `${(Math.min(Math.max(v, ymin), ymax) - ymin) / (ymax - ymin) * 100}%`
  // Highest first; ties keep the sheet's order (the report lifts IQuest-Q1 only on Terminal-Bench 2.1).
  const lift = model => (row.name === 'Terminal-Bench 2.1' && model === HL ? 0 : 1)
  const order = row.listed.map(model => ({ score: row.scores[model], model }))
    .sort((a, b) => b.score - a.score || lift(a.model) - lift(b.model))
  return (
    <figure className="v2-vbar" style={{ '--n': order.length }} onMouseLeave={() => setHover(null)}>
      <figcaption className="v2-vbar-title">{row.name}</figcaption>
      <div className="v2-vbar-plot">
        {order.map(({ score, model }) => {
          const name = B.models[model]
          const logo = B.logos[name]
          return (
            <div key={model} className={`v2-vbar-col${model === HL ? ' is-hl' : ''}`} tabIndex={0} aria-label={`${name}: ${formatScore(score)}`}
              onMouseEnter={() => setHover(model)} onFocus={() => setHover(model)} onBlur={() => setHover(null)}>
              <span className="v2-vbar-bar" style={{ height: at(score) }} />
              <span className="v2-vbar-value v2-num" style={{ bottom: at(score) }}>{formatScore(score)}</span>
              {logo && <span className="v2-vbar-logo"><img src={`./images/logos/${logo}.png`} alt="" loading="lazy" /></span>}
              {hover === model && <span className="v2-tip v2-vbar-tip" role="tooltip"><b>{name}</b> <span className="v2-num">{formatScore(score)}</span></span>}
            </div>
          )
        })}
      </div>
      <div className="v2-vbar-names" aria-hidden="true">
        {order.map(({ model }) => (
          <span key={model} className={model === HL ? 'is-hl' : undefined}>
            <span>{B.models[model]}</span>
          </span>
        ))}
      </div>
    </figure>
  )
}

function BarsView() {
  return (
    <div className="v2-bars">
      {/* Two rows, as in the report figure. */}
      <div className="v2-bars-grid" style={{ '--cols': Math.ceil(B.rows.length / 2) }}>
        {B.rows.map(row => <BarPanel key={row.name} row={row} />)}
      </div>
    </div>
  )
}

export default function BenchmarkFigure() {
  const tr = useTr()
  return (
    <Figure id="results-figure" className="v2-bench">
      <BarsView />
      <div className="v2-bench-foot">
        {B.sourceNote.map((line, i) => <p key={i}><NoteText text={tr(line)} /></p>)}
      </div>
    </Figure>
  )
}
