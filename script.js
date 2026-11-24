const svg = document.querySelector('svg'),
  R = '#C91E30',
  B = '#F4DFC0',
  ns = 'http://www.w3.org/2000/svg'
function el(tag, attrs = {}, text) {
  let e = document.createElementNS(ns, tag)
  for (let k in attrs) e.setAttribute(k, attrs[k])
  if (text) e.textContent = text
  svg.append(e)
  return e
}
function rect(x, y, w, h, fill = B, stroke = R) {
  return el('rect', { x, y, width: w, height: h, fill, stroke, rx: 3 })
}
function txt(x, y, s, size = 20, fill = R) {
  return el('text', { x, y, fill, 'font-size': size, 'font-weight': 900 }, s)
}
function hit(e, label, fn) {
  e.setAttribute('role', 'button')
  e.setAttribute('tabindex', '0')
  e.setAttribute('aria-label', label)
  e.appendChild(document.createElementNS(ns, 'title')).textContent = label
  e.addEventListener('click', fn)
  e.addEventListener('keydown', (v) => {
    if (v.key === 'Enter' || v.key === ' ') {
      v.preventDefault()
      fn(v)
    }
  })
  return e
}
function area(x, y, w, h, label, fn) {
  return hit(rect(x, y, w, h, 'transparent', 'none'), label, fn)
}
function statusText(s) {
  svg.setAttribute('aria-label', s)
}
let bpm = txt(372, 848, '120 BPM', 28)
function tempo(d) {
  state.bpm = Math.max(65, Math.min(170, state.bpm + d))
  bpm.textContent = state.bpm + ' BPM'
}
area(523, 811, 48, 29, 'Increase BPM', () => tempo(5))
area(523, 841, 48, 29, 'Decrease BPM', () => tempo(-5))
area(15, 810, 103, 63, 'Play', play)
area(120, 810, 94, 63, 'Stop', stop)
area(216, 810, 103, 63, 'Toggle vinyl crackle', () => {
  state.vinyl = state.vinyl ? 0 : 0.35
  update()
  statusText(state.vinyl ? 'VINYL NOISE ON' : 'VINYL NOISE OFF')
})
hit(document.getElementById('record'), 'Play or stop record', () =>
  running ? stop() : play()
)
txt(1450, 835, 'CREATE THE', 19)
txt(1450, 860, 'SOUND OF VINYL', 19)
rect(601, 827, 794, 28, B, 'none')
let progress = rect(602, 828, 0, 26, R, 'none')
txt(1320, 515, 'SEQUENCER', 36, B)
const waves = ['sine', 'triangle', 'square', 'sawtooth'],
  symbols = ['SIN', 'TRI', 'SQR', 'SAW']
let buttons = [],
  wavepaths = []
function draw(i) {
  let v = state.voices[i],
    y = i ? 639 : 360,
    x = i ? 40 : 44
  let d = ''
  for (let j = 0; j <= 390; j++) {
    let a = (j / 390) * 3.25 * 2 * Math.PI,
      z =
        v.wave === 'sine'
          ? Math.sin(a)
          : v.wave === 'triangle'
            ? (2 / Math.PI) * Math.asin(Math.sin(a))
            : v.wave === 'square'
              ? Math.sign(Math.sin(a))
              : 2 * (a / (2 * Math.PI) - Math.floor(a / (2 * Math.PI) + 0.5))
    d += (j ? 'L' : 'M') + (x + j) + ' ' + (y - 32 * z) + ' '
  }
  wavepaths[i].setAttribute('d', d)
  buttons[i].forEach((b, j) => {
    b[0].setAttribute('fill', v.wave === waves[j] ? R : B)
    b[1].setAttribute('fill', v.wave === waves[j] ? B : R)
  })
}
for (let i = 0; i < 2; i++) {
  wavepaths[i] = el('path', { fill: 'none', stroke: R, 'stroke-width': 2.5 })
  buttons[i] = []
  for (let j = 0; j < 4; j++) {
    let y = (i ? 597 : 318) + j * 22,
      b = rect(454, y, 73, 19),
      t = txt(469, y + 14, symbols[j], 13)
    buttons[i].push([b, t])
    t.setAttribute('pointer-events', 'none')
    hit(b, symbols[j], () => {
      state.voices[i].wave = waves[j]
      draw(i)
    })
  }
  draw(i)
  let keys = ['tune', 'detune', 'cutoff', 'res'],
    ranges = [
      [-12, 12],
      [-35, 35],
      [200, 6000],
      [0.5, 7]
    ]
  for (let j = 0; j < 4; j++) {
    let x = (i ? 92 : 96) + 126 * j,
      y = i ? 714 : 433,
      n = document.getElementById(
        'needle' + [8, 11, 14, 17, 26, 29, 32, 35][i * 4 + j]
      ),
      k = keys[j],
      range = ranges[j]
    function set(v) {
      state.voices[i][k] = Math.max(range[0], Math.min(range[1], v))
      n.setAttribute(
        'transform',
        `rotate(${((state.voices[i][k] - range[0]) / (range[1] - range[0])) * 270 - 180} ${x} ${y})`
      )
      statusText(
        `SYNTH 0${i + 1} · ${k.toUpperCase()} ${state.voices[i][k].toFixed(1)}`
      )
    }
    let h = area(x - 34, y - 30, 68, 60, k, () => {})
    h.style.touchAction = 'none'
    h.addEventListener('pointerdown', (e) => {
      h.setPointerCapture(e.pointerId)
      let start = e.clientY,
        val = state.voices[i][k]
      h.onpointermove = (m) =>
        set(val + ((start - m.clientY) * (range[1] - range[0])) / 150)
      h.onpointerup = h.onpointercancel = h.onlostpointercapture = () => (h.onpointermove = null)
    })
    h.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
        set(
          state.voices[i][k] +
            ((e.key === 'ArrowUp' ? 1 : -1) * (range[1] - range[0])) / 20
        )
      }
    })
  }
}
let cells = []
for (let i = 0; i < 3; i++) {
  cells[i] = []
  for (let j = 0; j < 13; j++) {
    let e = document.getElementById(`d${i}-${j}`)
    cells[i].push(e)
    let render = () => e.setAttribute('fill', state.drums[i][j] ? R : B)
    render()
    hit(e, ['Kick', 'Snare', 'Hat'][i] + ' ' + (j + 1), () => {
      state.drums[i][j] = !state.drums[i][j]
      render()
    })
  }
}
let notes = []
for (let j = 0; j < 13; j++) {
  let x = 1101 + j * 38.1
  let n = rect(x, 0, 34, 9, R, 'none')
  notes.push(n)
  function drawNote() {
    n.setAttribute('y', 742 - state.notes[j] * 25)
  }
  drawNote()
  area(x, 550, 38, 208, 'Melody step ' + (j + 1), (e) => {
    if (e.clientY) {
      let p = svg.createSVGPoint()
      p.x = e.clientX
      p.y = e.clientY
      let y = p.matrixTransform(e.currentTarget.getScreenCTM().inverse()).y
      state.notes[j] = Math.max(0, Math.min(7, Math.round((742 - y) / 25)))
    } else state.notes[j] = (state.notes[j] + 1) % 8
    drawNote()
  })
}
function highlight(s) {
  progress.setAttribute('width', s < 0 ? 0 : (792 * (s + 1)) / 13)
  cells.forEach((row) =>
    row.forEach((e, j) => e.setAttribute('opacity', s === j ? 0.5 : 1))
  )
  notes.forEach((e, j) => e.setAttribute('opacity', s === j ? 0.45 : 1))
}
// Existing bottom bar controls master volume via wheel; record button toggles vinyl noise.
let volumeHit = area(
  600,
  825,
  795,
  32,
  'Master volume: scroll to adjust',
  () => {}
)
volumeHit.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault()
    state.master = Math.max(
      0,
      Math.min(1, state.master - Math.sign(e.deltaY) * 0.05)
    )
    update()
  },
  { passive: false }
)
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && e.target === document.body) {
    e.preventDefault()
    running ? stop() : play()
  }
})
// Adjust effects with keys 1–4, without adding visible controls.
document.addEventListener('keydown', (e) => {
  if (/^[1-4]$/.test(e.key)) {
    let i = +e.key - 1
    state.fx[i] = state.fx[i] ? 0 : [0.18, 0.22, 0.08, 0.16][i]
    update()
  }
})

// Reflow the original artwork without cloning controls or audio state.
const artwork = Array.from(svg.children)
const panelSpecs = {
  header: [0, 0, 1648, 205, 0, 0, 600 / 1648],
  record: [528, 220, 582, 582, 100, 85, 400 / 582],
  transport: [8, 800, 570, 85, 12, 500, 1],
  synth1: [8, 235, 562, 268, 12, 605, 1],
  synth2: [4, 516, 562, 268, 12, 895, 1],
  rhythm: [1055, 227, 576, 218, 12, 1185, 1],
  sequencer: [1055, 465, 576, 315, 12, 1425, 1],
  level: [590, 810, 815, 60, 12, 1765, 576 / 815],
  caption: [1440, 810, 200, 65, 12, 1830, 1]
}
const panels = {}
for (const name of Object.keys(panelSpecs)) {
  const group = document.createElementNS(ns, 'g')
  group.dataset.panel = name
  panels[name] = group
}
for (const node of artwork) {
  const box = node.getBBox()
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  if (box.width > 1000 && y >= 800) node.dataset.desktopOnly = ''
  let name
  if (node === svg.firstElementChild) name = 'background'
  else if (node.id === 'record') name = 'record'
  else if (y < 205) name = 'header'
  else if (y >= 800) name = x < 590 ? 'transport' : x < 1410 ? 'level' : 'caption'
  else if (x < 590) name = y < 510 ? 'synth1' : 'synth2'
  else name = y < 455 ? 'rhythm' : 'sequencer'
  if (name === 'background') node.dataset.background = ''
  else panels[name].append(node)
}
Object.values(panels).forEach(group => svg.append(group))
const mobileLayout = window.matchMedia('(max-width: 767px)')
function layout() {
  const mobile = mobileLayout.matches
  svg.setAttribute('viewBox', mobile ? '0 0 600 1910' : '0 0 1648 928')
  svg.setAttribute('width', mobile ? '600' : '1648')
  svg.setAttribute('height', mobile ? '1910' : '928')
  for (const [name, group] of Object.entries(panels)) {
    const [x, y, , , left, top, scale] = panelSpecs[name]
    if (mobile) group.setAttribute('transform', `translate(${left} ${top}) scale(${scale}) translate(${-x} ${-y})`)
    else group.removeAttribute('transform')
  }
}
mobileLayout.addEventListener('change', layout)
layout()

// The existing bottom bar doubles as a touch volume control.
function setVolumeFromPointer(event) {
  const point = svg.createSVGPoint()
  point.x = event.clientX
  point.y = event.clientY
  const local = point.matrixTransform(volumeHit.getScreenCTM().inverse())
  state.master = Math.max(0, Math.min(1, (local.x - 600) / 795))
  update()
  statusText(`VOLUME ${Math.round(state.master * 100)}%`)
}
volumeHit.setAttribute('aria-label', 'Master volume: drag to adjust')
volumeHit.style.touchAction = 'none'
volumeHit.addEventListener('pointerdown', event => {
  volumeHit.setPointerCapture(event.pointerId)
  setVolumeFromPointer(event)
})
volumeHit.addEventListener('pointermove', event => {
  if (volumeHit.hasPointerCapture(event.pointerId)) setVolumeFromPointer(event)
})
