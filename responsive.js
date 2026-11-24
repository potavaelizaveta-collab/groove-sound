// Phone and tablet controls share the original engine and state.
const compact = document.createElement('div')
compact.className = 'compact-synth'
compact.innerHTML = `
  <header class="compact-header"><h1>GROOVE SOUND</h1><p>CREATE THE<br>SOUND OF VINYL</p></header>
  <div class="compact-record"></div>
  <section class="compact-transport" aria-label="Playback">
    <div class="transport-buttons"><button data-action="play" aria-label="Play">▶</button><button data-action="stop" aria-label="Stop">■</button><button data-action="vinyl" aria-label="Vinyl crackle" aria-pressed="true">●</button></div>
    <div class="tempo"><button data-action="slower" aria-label="Decrease tempo">−</button><output class="tempo-value">120 BPM</output><button data-action="faster" aria-label="Increase tempo">+</button></div>
  </section>
  <section class="compact-panel synth-panel synth-0"><h2>SYNTH 01</h2></section>
  <section class="compact-panel synth-panel synth-1"><h2>SYNTH 02</h2></section>
  <section class="compact-panel compact-rhythm"><h2>RHYTHM</h2><div class="grid-scroll" aria-label="Rhythm steps"><div class="drum-grid"></div></div></section>
  <section class="compact-panel compact-sequencer"><h2>SEQUENCER</h2><div class="grid-scroll" aria-label="Melody steps"><div class="melody-grid"></div></div></section>
  <footer class="compact-footer"><div class="compact-level" role="slider" tabindex="0" aria-label="Volume" aria-valuemin="0" aria-valuemax="100"><span class="compact-progress"></span></div><span>CREATE THE SOUND OF VINYL</span></footer>`
document.querySelector('main').append(compact)
// Use the original outlined lettering instead of substituting a font.
const originalTitle = Array.from(svg.querySelectorAll('path')).find(path =>
  (path.getAttribute('d') || '').startsWith('M126.188 150.625')
)
if (originalTitle) {
  const title = compact.querySelector('h1')
  const titleSvg = document.createElementNS(ns, 'svg')
  titleSvg.setAttribute('role', 'img')
  titleSvg.setAttribute('aria-label', 'GROOVE SOUND')
  const lettering = originalTitle.cloneNode(true)
  titleSvg.append(lettering)
  title.replaceChildren(titleSvg)
  // This artwork has fixed coordinates, so resizing never changes its lettering.
  titleSvg.setAttribute('viewBox', '20 20 1360 155')
  const measureTitle = () => {
    if (!compact.getClientRects().length) return
    const box = lettering.getBBox()
    if (box.width && box.height) titleSvg.setAttribute('viewBox', `${box.x} ${box.y} ${box.width} ${box.height}`)
  }
  measureTitle()
  window.matchMedia('(max-width: 1100px)').addEventListener('change', measureTitle)
}
const recordSvg = document.createElementNS(ns, 'svg')
recordSvg.setAttribute('viewBox', '528 220 582 582')
recordSvg.setAttribute('fill', 'none')
const compactRecord = document.getElementById('record').cloneNode(true)
compactRecord.removeAttribute('id')
compactRecord.classList.add('compact-disc')
compactRecord.removeAttribute('tabindex')
compactRecord.removeAttribute('role')
const recordButton = document.createElement('button')
recordButton.className = 'record-button'
recordButton.setAttribute('aria-label', 'Play or stop record')
recordSvg.append(compactRecord)
recordButton.append(recordSvg)
compact.querySelector('.compact-record').append(recordButton)
recordButton.onclick = () => running ? stop() : play()
const knobViews = []
const waveViews = []
for (let i = 0; i < 2; i++) {
  const panel = compact.querySelector(`.synth-${i}`)
  const body = document.createElement('div')
  body.className = 'synth-body'
  body.innerHTML = `<svg class="wave-display" viewBox="0 0 390 84" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.5"/></svg><div class="wave-buttons"></div><div class="knob-row"></div>`
  panel.append(body)
  waveViews[i] = body.querySelector('path')
  waves.forEach((wave, j) => {
    const button = document.createElement('button')
    button.textContent = symbols[j]
    button.dataset.wave = wave
    button.setAttribute('aria-label', `Synth ${i + 1} ${wave}`)
    button.onclick = () => { state.voices[i].wave = wave; draw(i); syncCompact() }
    body.querySelector('.wave-buttons').append(button)
  })
  const keys = ['tune', 'detune', 'cutoff', 'res']
  const ranges = [[-12, 12], [-35, 35], [200, 6000], [0.5, 7]]
  keys.forEach((key, j) => {
    const [min, max] = ranges[j]
    const wrapper = document.createElement('div')
    wrapper.className = 'knob-control'
    wrapper.innerHTML = `<div class="touch-knob" role="slider" tabindex="0" aria-label="Synth ${i + 1} ${key}" aria-valuemin="${min}" aria-valuemax="${max}"><span class="knob-face"><span class="knob-needle"></span></span></div><span class="knob-label">${key === 'res' ? 'RES' : key.toUpperCase()}</span><output></output>`
    const knob = wrapper.querySelector('.touch-knob')
    function set(value) {
      state.voices[i][key] = Math.max(min, Math.min(max, value))
      const needle = document.getElementById('needle' + [8, 11, 14, 17, 26, 29, 32, 35][i * 4 + j])
      const x = (i ? 92 : 96) + j * 126, y = i ? 714 : 433
      needle.setAttribute('transform', `rotate(${(state.voices[i][key] - min) / (max - min) * 270 - 180} ${x} ${y})`)
      syncCompact()
    }
    knob.onpointerdown = e => {
      e.preventDefault()
      knob.setPointerCapture(e.pointerId)
      const start = e.clientY, value = state.voices[i][key]
      knob.onpointermove = move => set(value + (start - move.clientY) * (max - min) / 140)
    }
    knob.onpointerup = knob.onpointercancel = knob.onlostpointercapture = () => { knob.onpointermove = null }
    knob.onkeydown = e => {
      if (['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'Home', 'End'].includes(e.key)) {
        e.preventDefault()
        set(e.key === 'Home' ? min : e.key === 'End' ? max : state.voices[i][key] + (['ArrowUp', 'ArrowRight'].includes(e.key) ? 1 : -1) * (max - min) / 40)
      }
    }
    knobViews.push({ i, key, min, max, wrapper, knob })
    body.querySelector('.knob-row').append(wrapper)
  })
}
const drumButtons = []
state.drums.forEach((row, i) => {
  const label = document.createElement('span')
  label.className = 'drum-label'
  label.textContent = ['KICK', 'SNARE', 'HAT'][i]
  compact.querySelector('.drum-grid').append(label)
  row.forEach((value, j) => {
    const button = document.createElement('button')
    button.className = 'drum-step'
    button.setAttribute('aria-label', `${label.textContent} step ${j + 1}`)
    button.onclick = () => { state.drums[i][j] = !state.drums[i][j]; cells[i][j].setAttribute('fill', state.drums[i][j] ? R : B); syncCompact() }
    compact.querySelector('.drum-grid').append(button)
    drumButtons.push({ button, i, j })
  })
})
const melodyColumns = []
state.notes.forEach((note, j) => {
  const column = document.createElement('div')
  column.className = 'melody-column'
  for (let pitch = 7; pitch >= 0; pitch--) {
    const button = document.createElement('button')
    button.setAttribute('aria-label', `Melody step ${j + 1}, note ${pitch + 1}`)
    button.dataset.pitch = pitch
    button.onclick = () => { state.notes[j] = pitch; notes[j].setAttribute('y', 742 - pitch * 25); syncCompact() }
    column.append(button)
  }
  compact.querySelector('.melody-grid').append(column)
  melodyColumns.push(column)
})
compact.querySelectorAll('[data-action]').forEach(button => {
  button.onclick = async () => {
    const action = button.dataset.action
    if (action === 'play') await play()
    if (action === 'stop') stop()
    if (action === 'vinyl') { state.vinyl = state.vinyl ? 0 : 0.35; update() }
    if (action === 'slower' || action === 'faster') tempo(action === 'faster' ? 5 : -5)
    syncCompact()
  }
})
const levelControl = compact.querySelector('.compact-level')
function volumeAt(e) {
  const box = levelControl.getBoundingClientRect()
  state.master = Math.max(0, Math.min(1, (e.clientX - box.left) / box.width))
  update(); syncCompact()
}
levelControl.onpointerdown = e => { levelControl.setPointerCapture(e.pointerId); volumeAt(e) }
levelControl.onpointermove = e => { if (levelControl.hasPointerCapture(e.pointerId)) volumeAt(e) }
levelControl.onkeydown = e => {
  if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) {
    e.preventDefault()
    state.master = e.key === 'Home' ? 0 : e.key === 'End' ? 1 : Math.max(0, Math.min(1, state.master + (e.key === 'ArrowRight' ? .05 : -.05)))
    update(); syncCompact()
  }
}
function syncCompact() {
  compact.querySelector('.tempo-value').textContent = `${state.bpm} BPM`
  compact.querySelector('[data-action="vinyl"]').setAttribute('aria-pressed', !!state.vinyl)
  compact.querySelector('[data-action="play"]').setAttribute('aria-pressed', running)
  levelControl.setAttribute('aria-valuenow', Math.round(state.master * 100))
  knobViews.forEach(({ i, key, min, max, wrapper, knob }) => {
    const value = state.voices[i][key]
    knob.setAttribute('aria-valuenow', value.toFixed(1))
    wrapper.querySelector('.knob-needle').style.transform = `rotate(${(value - min) / (max - min) * 270 - 135}deg)`
    wrapper.querySelector('output').textContent = key === 'cutoff' ? `${Math.round(value)} Hz` : value.toFixed(key === 'res' ? 1 : 0)
  })
  waveViews.forEach((path, i) => {
    path.setAttribute('d', wavepaths[i].getAttribute('d'))
    path.setAttribute('transform', `translate(${i ? -40 : -44} ${i ? -597 : -318})`)
    compact.querySelectorAll(`.synth-${i} [data-wave]`).forEach(button => button.setAttribute('aria-pressed', button.dataset.wave === state.voices[i].wave))
  })
  drumButtons.forEach(({ button, i, j }) => button.setAttribute('aria-pressed', !!state.drums[i][j]))
  melodyColumns.forEach((column, j) => Array.from(column.children).forEach(button => button.setAttribute('aria-pressed', +button.dataset.pitch === state.notes[j])))
}
const desktopHighlight = highlight
highlight = function(step) {
  desktopHighlight(step)
  drumButtons.forEach(({ button, j }) => button.classList.toggle('current-step', step === j))
  melodyColumns.forEach((column, j) => column.classList.toggle('current-step', step === j))
  compact.querySelector('.compact-progress').style.width = step < 0 ? '0%' : `${(step + 1) / 13 * 100}%`
  syncCompact()
}
window.matchMedia('(max-width: 1100px)').addEventListener('change', syncCompact)
syncCompact()
