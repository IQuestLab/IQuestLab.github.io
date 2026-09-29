import { larkScenarios } from '../shared'
import { useLanguageCode, useTr } from '../lib/i18n'
import AsideRow from './components/AsideRow'
import BenchmarkFigure from './components/BenchmarkFigure'
import DemoViewer from './components/DemoViewer'
import Figure from './components/Figure'
import { RecordingCuts, RecordingTabs } from './components/RecordingChooser'
import Section from './components/Section'
import { contact as CT, frontend as FE, limitations as LIM, office as OF, overview as OV, rdCases as RD, results as RS, tocLabels, training as TR } from './copy'

const runinEnd = { en: '. ', zh: '：' }

// `gloss` is the English term for a Chinese head: dotted underline, shown on hover, focus, or tap.
// A styled tooltip rather than a native title, which touch devices and some in-app browsers never show.
function RunIn({ head, gloss, children, className = '' }) {
  const tr = useTr()
  const language = useLanguageCode()
  const label = gloss && language === 'zh'
    ? <span className="v2-gloss" tabIndex={0}>{tr(head)}<span className="v2-gloss-tip" lang="en">{gloss}</span></span>
    : tr(head)
  return <p className={className}><strong className="v2-runin">{label}{tr(runinEnd)}</strong>{children}</p>
}

function Notes({ notes }) {
  const tr = useTr()
  return notes.map(([head, body, gloss], i) => <RunIn key={i} head={head} gloss={gloss}>{tr(body)}</RunIn>)
}

export function Overview() {
  const tr = useTr()
  return (
    <Section id="overview" title={OV.title}>
      <p>{tr(OV.intro)}</p>
    </Section>
  )
}

// The outlook: a short introduction, the interactive loop, and one iteration of the recorded run.
export function Training() {
  return (
    <Section id="training" title={TR.title} intro={TR.intro}>
      <Notes notes={TR.notes} />
    </Section>
  )
}

export function Results() {
  return (
    <Section id="results" title={RS.title} intro={RS.figureTitle}>
      <BenchmarkFigure />
    </Section>
  )
}

export function RdCases({ selected, onSelect, autoPlay }) {
  const tr = useTr()
  return (
    <Section id="rd-cases" title={RD.title}>
      <Figure id="rd-figure">
        <RecordingTabs items={RD.items} selected={selected} onSelect={onSelect} autoPlay={autoPlay} label={tocLabels['rd-cases']} />
      </Figure>
      <div className="v2-stack">
        {RD.items.map(item => {
          const active = item.id === selected
          return (
            <AsideRow key={item.id} className={active ? 'is-active' : ''} aria-hidden={!active} inert={active ? undefined : ''}
              aside={item.stats} asideTitle={item.statsTitle}>
              <h3>{tr(item.title)}</h3>
              <p>{tr(item.lead)}</p>
              <Notes notes={item.notes} />
            </AsideRow>
          )
        })}
      </div>
    </Section>
  )
}

export function Office({ cut, onCut, autoPlay }) {
  const tr = useTr()
  const recorded = larkScenarios.find(s => s.id === OF.recorded.id)
  return (
    <Section id="office" title={OF.title} intro={OF.intro}>
      <Figure id="lark-figure">
        <RecordingCuts title={recorded.title} cuts={recorded.recordings} selected={cut} onSelect={onCut} autoPlay={autoPlay}
          label={OF.cutsLabel} aspectRatio={2} />
      </Figure>
      <p>{tr(OF.recorded.lead)}</p>
      <Notes notes={OF.recorded.notes} />
    </Section>
  )
}

export function Frontend({ demoRef }) {
  return (
    <Section id="frontend" title={FE.title} intro={FE.intro}>
      <DemoViewer ref={demoRef} />
    </Section>
  )
}

export function Limitations() {
  const tr = useTr()
  return (
    <Section id="limitations" title={LIM.title}>
      <ul className="v2-limits">
        {LIM.items.map(([head, body], i) => <li key={i}><strong className="v2-runin">{tr(head)}{tr(runinEnd)}</strong>{tr(body)}</li>)}
      </ul>
    </Section>
  )
}

export function Contact() {
  const tr = useTr()
  return (
    <Section id="contact" title={CT.title}>
      <p>{tr(CT.body)}</p>
    </Section>
  )
}
