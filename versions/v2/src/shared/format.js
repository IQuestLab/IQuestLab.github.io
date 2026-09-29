// Small helpers so prose can reuse shared numbers without hard-coding them.
const EN_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
const ZH_WORDS = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十']

// Number words for small counts ("six customers", "三天"); larger numbers stay as digits.
export const enWord = n => EN_WORDS[n] ?? String(n)
export const zhWord = n => ZH_WORDS[n] ?? String(n)
// Count before a measure word: 2 reads 两 (两个), not 二.
export const zhCount = n => (n === 2 ? '两' : zhWord(n))
// Sentence-initial English number word: "Two".
export const enCountCap = n => enWord(n).replace(/^./, c => c.toUpperCase())

// Benchmark scores: one decimal; '—' when not reported. Averages rounded to one decimal.
export const formatScore = s => (s == null ? '—' : s.toFixed(1))
export const formatAverage = n => (Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10))

// "A, B, and C" / "A、B、C"
export const enList = items => (items.length < 3 ? items.join(' and ') : `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`)
export const zhList = items => items.join('、')
