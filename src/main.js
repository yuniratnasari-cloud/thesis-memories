import './style.css'
import { deleteEntry, getEntryWithPhotos, listEntries, saveEntry } from './storage.js'

const THEMES = [
  { id: 'minimalist', name: 'Minimalist', description: 'Bersih, tenang, tak lekang waktu', colors: ['#f5f2eb', '#272820', '#78816f', '#dfdbd1'] },
  { id: 'cute', name: 'Cute', description: 'Pastel, manis, penuh keceriaan', colors: ['#fff0e8', '#552b3a', '#ef92a9', '#ffd6c9'] },
  { id: 'masculine', name: 'Masculine', description: 'Tegas, gelap, bernuansa film', colors: ['#e9edf0', '#202a33', '#557b87', '#c4d2d3'] },
  { id: 'dreamy', name: 'Dreamy', description: 'Lavender, lembut, penuh bintang', colors: ['#f0eefb', '#362f5b', '#a69ad8', '#d9d4f0'] },
]
const MILESTONES = [
  'Bimbingan',
  'Revisi',
  'Ngerjain Skripsi',
  'Seminar Proposal',
  'Seminar Hasil',
  'Sidang Skripsi',
  'Yudisium',
  'Wisuda',
  'Lainnya',
]
const THEME_DECORATIONS = {
  minimalist: ['✦', '·', '○'],
  cute: ['🌸', '🎀', '♡', '✿'],
  masculine: ['★', '▪', '▰'],
  dreamy: ['☾', '☁', '✧', '✦'],
}
const DEFAULT_THEME = 'minimalist'
const THEME_PREFERENCE_KEY = 'thesis-memories-theme'
const COUNTDOWN_SECONDS = 3
const PHOTO_COUNT = 4

const app = document.querySelector('#app')
app.innerHTML = `
  <div class="app-shell">
    <header class="site-header">
      <a class="brand" href="#" aria-label="Beranda Thesis Memories">
        <span class="brand-mark" aria-hidden="true">tm</span>
        <span>thesis memories<span class="brand-period">.</span></span>
      </a>
      <nav class="main-nav" aria-label="Navigasi utama">
        <button class="nav-link is-active" id="nav-create" type="button" aria-current="page">Buat Kenangan</button>
        <button class="nav-link" id="nav-diary" type="button">Diary Saya</button>
      </nav>
    </header>

    <main>
      <section id="create-screen" class="screen">
        <div class="intro">
          <p class="eyebrow">FOUR FRAMES, ONE STORY</p>
          <h1>Thesis <span>Memories.</span></h1>
          <p class="intro-copy">Photobooth untuk menyimpan momen akademikmu, dari bimbingan sampai wisuda.</p>
        </div>

        <form id="memory-form" class="memory-layout">
          <div class="setup-column">
            <section class="form-section">
              <div class="section-heading"><span class="step-number">01</span><div><h2>Beri nama momen ini</h2><p>Tulis judul dan tanggal kenanganmu.</p></div></div>
              <label class="field-label" for="entry-title">Judul kenangan</label>
              <input id="entry-title" name="title" type="text" maxlength="80" placeholder="Tulis judul momen" required />
              <label class="field-label" for="entry-date">Tanggal</label>
              <input id="entry-date" name="date" type="date" required />
            </section>

            <section class="form-section">
              <div class="section-heading"><span class="step-number">02</span><div><h2>Pilih momen akademik</h2><p>Setiap bab perjalananmu pantas dikenang.</p></div></div>
              <label class="field-label" for="entry-milestone">Momen akademik</label>
              <select id="entry-milestone" name="milestone" required>
                <option value="">Pilih momen</option>
                ${MILESTONES.map((milestone) => `<option value="${milestone}">${milestone}</option>`).join('')}
              </select>
              <div id="other-milestone-wrap" hidden>
                <label class="field-label" for="other-milestone">Nama momen</label>
                <input id="other-milestone" name="otherMilestone" type="text" maxlength="60" placeholder="Tulis nama momen" />
              </div>
            </section>

            <section class="form-section theme-section">
              <div class="section-heading"><span class="step-number">03</span><div><h2>Pilih tema</h2><p>Tentukan gaya photostrip-mu.</p></div></div>
              <div class="theme-options" id="theme-options" role="group" aria-label="Tema photostrip"></div>
            </section>
          </div>

          <section class="booth-column" aria-label="Kamera dan pengambilan foto">
            <div class="booth-card">
              <div class="booth-topline"><span class="live-dot" aria-hidden="true"></span><span id="booth-state">PHOTOBOOTH-MU</span><span class="booth-counter" id="booth-counter">0 / 4</span></div>
              <div class="camera-stage" id="camera-stage">
                <div class="camera-welcome" id="camera-welcome">
                  <div class="camera-illustration" aria-hidden="true"><span></span><i></i></div>
                  <h2>Abadikan momenmu</h2>
                  <p>Kamera hanya digunakan untuk mengambil foto. Tidak ada yang diunggah.</p>
                  <button class="button button-primary" id="start-camera" type="button">Buka kamera <span aria-hidden="true">↗</span></button>
                  <p class="camera-note">Izin kamera baru diminta setelah kamu mengetuk tombol di atas.</p>
                </div>
                <video id="camera-preview" autoplay playsinline muted aria-label="Pratinjau langsung kamera" hidden></video>
                <div class="countdown-overlay" id="countdown" role="timer" aria-live="assertive" hidden></div>
                <p class="capture-error" id="capture-error" role="alert" hidden></p>
              </div>
              <section class="effect-controls" id="beauty-controls" aria-labelledby="effect-heading" hidden>
                <h3 id="effect-heading">Efek foto</h3>
              <label class="effect-toggle"><input id="effect-enabled" type="checkbox" checked /> Aktifkan efek natural</label>
                <label for="effect-brightness">Kecerahan <output id="brightness-value">104%</output></label>
                <input id="effect-brightness" type="range" min="90" max="115" value="104" />
                <label for="effect-warmth">Kehangatan <output id="warmth-value">5</output></label>
                <input id="effect-warmth" type="range" min="-15" max="15" value="5" />
                <label for="effect-contrast">Kontras lembut <output id="contrast-value">98%</output></label>
                <input id="effect-contrast" type="range" min="90" max="110" value="98" />
                <label for="effect-lighting">Koreksi cahaya <output id="lighting-value">100%</output></label>
                <input id="effect-lighting" type="range" min="90" max="110" value="100" />
                <label for="effect-glow">Cahaya lembut <output id="glow-value">0</output></label>
                <input id="effect-glow" type="range" min="0" max="12" value="0" />
                <button class="button button-secondary effect-reset" id="effect-reset" type="button">Atur ulang efek</button>
              </section>
              <div class="booth-controls">
                <button class="button button-primary" id="capture-button" type="button" hidden>Mulai sesi foto <span aria-hidden="true">●</span></button>
                <button class="button button-secondary" id="cancel-countdown" type="button" hidden>Batalkan hitung mundur</button>
                <div class="capture-review" id="capture-review" hidden>
                  <p class="review-heading">Empat fotomu</p>
                  <div class="captured-photos" id="captured-photos"></div>
                  <button class="button button-secondary" id="restart-session" type="button">Ulangi seluruh sesi</button>
                  <section class="decoration-editor" aria-labelledby="decoration-heading">
                    <h3 id="decoration-heading">Dekorasi photostrip</h3>
                    <p class="effect-note">Pilih ornamen, lalu atur posisi dan ukurannya.</p>
                    <div class="decoration-options" id="decoration-options" aria-label="Pilihan ornamen"></div>
                    <div class="decoration-list" id="decoration-list"></div>
                    <label for="decoration-position">Posisi ornamen terpilih</label>
                    <select id="decoration-position">
                      <option value="header">Bagian atas</option>
                      <option value="left">Sisi kiri</option>
                      <option value="right">Sisi kanan</option>
                      <option value="footer">Bagian bawah</option>
                    </select>
                    <label for="decoration-size">Ukuran ornamen <output id="decoration-size-value">100%</output></label>
                    <input id="decoration-size" type="range" min="70" max="140" value="100" />
                    <button class="button button-secondary effect-reset" id="decoration-reset" type="button">Atur ulang dekorasi</button>
                  </section>
                  <div class="preview-toggle" role="group" aria-label="Bandingkan pratinjau">
                    <button class="button button-secondary" id="preview-original" type="button" aria-pressed="false">Tanpa efek</button>
                    <button class="button button-secondary is-selected" id="preview-effect" type="button" aria-pressed="true">Dengan efek</button>
                  </div>
                  <p class="effect-note">Foto asli tersimpan tanpa perubahan. Efek dan dekorasi hanya diterapkan pada photostrip.</p>
                  <img class="strip-preview" id="strip-preview" alt="Pratinjau photostrip empat foto" hidden />
                  <button class="button button-primary" id="save-button" type="button" disabled>Simpan Kenangan <span aria-hidden="true">↗</span></button>
                </div>
              </div>
              <p class="privacy-note"><span aria-hidden="true">✳</span> Foto dan kenangan tersimpan di perangkat ini.</p>
            </div>
            <div class="tip-card"><span class="tip-icon" aria-hidden="true">✦</span><p><strong>Catatan kecil</strong><br />Diary-mu tersimpan di browser ini. Simpan salinan lain untuk kenangan yang tak ingin hilang.</p></div>
          </section>
        </form>
      </section>

      <section id="diary-screen" class="screen diary-screen" hidden>
        <div class="diary-heading">
          <div><p class="eyebrow">KUMPULAN MOMEN BERHARGA</p><h1>Diary <span>kenangan.</span></h1><p class="intro-copy">Semua momen akademikmu, tersimpan rapi di sini.</p></div>
          <button class="button button-primary" id="diary-create" type="button">Buat Kenangan <span aria-hidden="true">↗</span></button>
        </div>
        <div id="diary-content" aria-live="polite"></div>
      </section>

      <section id="detail-screen" class="screen detail-screen" hidden>
        <button class="back-link" id="detail-back" type="button">← Kembali ke Diary Saya</button>
        <div id="detail-content"></div>
      </section>
    </main>
    <footer><span>Untuk setiap bab yang membentuk dirimu.</span><span>PRIVAT · TERSIMPAN DI PERANGKAT INI</span></footer>
    <div id="app-status" class="sr-only" role="status" aria-live="polite"></div>
  </div>
`

const elements = {
  createScreen: document.querySelector('#create-screen'),
  diaryScreen: document.querySelector('#diary-screen'),
  detailScreen: document.querySelector('#detail-screen'),
  form: document.querySelector('#memory-form'),
  title: document.querySelector('#entry-title'),
  date: document.querySelector('#entry-date'),
  milestone: document.querySelector('#entry-milestone'),
  otherMilestoneWrap: document.querySelector('#other-milestone-wrap'),
  otherMilestone: document.querySelector('#other-milestone'),
  themeOptions: document.querySelector('#theme-options'),
  cameraWelcome: document.querySelector('#camera-welcome'),
  cameraPreview: document.querySelector('#camera-preview'),
  startCamera: document.querySelector('#start-camera'),
  captureButton: document.querySelector('#capture-button'),
  cancelCountdown: document.querySelector('#cancel-countdown'),
  captureReview: document.querySelector('#capture-review'),
  capturedPhotos: document.querySelector('#captured-photos'),
  restartSession: document.querySelector('#restart-session'),
  saveButton: document.querySelector('#save-button'),
  stripPreview: document.querySelector('#strip-preview'),
  effectEnabled: document.querySelector('#effect-enabled'),
  effectBrightness: document.querySelector('#effect-brightness'),
  effectWarmth: document.querySelector('#effect-warmth'),
  effectContrast: document.querySelector('#effect-contrast'),
  effectLighting: document.querySelector('#effect-lighting'),
  effectGlow: document.querySelector('#effect-glow'),
  effectReset: document.querySelector('#effect-reset'),
  brightnessValue: document.querySelector('#brightness-value'),
  warmthValue: document.querySelector('#warmth-value'),
  contrastValue: document.querySelector('#contrast-value'),
  lightingValue: document.querySelector('#lighting-value'),
  glowValue: document.querySelector('#glow-value'),
  beautyControls: document.querySelector('#beauty-controls'),
  cameraStage: document.querySelector('#camera-stage'),
  previewOriginal: document.querySelector('#preview-original'),
  previewEffect: document.querySelector('#preview-effect'),
  decorationOptions: document.querySelector('#decoration-options'),
  decorationList: document.querySelector('#decoration-list'),
  decorationPosition: document.querySelector('#decoration-position'),
  decorationSize: document.querySelector('#decoration-size'),
  decorationSizeValue: document.querySelector('#decoration-size-value'),
  decorationReset: document.querySelector('#decoration-reset'),
  boothCounter: document.querySelector('#booth-counter'),
  countdown: document.querySelector('#countdown'),
  captureError: document.querySelector('#capture-error'),
  boothState: document.querySelector('#booth-state'),
  status: document.querySelector('#app-status'),
  diaryContent: document.querySelector('#diary-content'),
  detailContent: document.querySelector('#detail-content'),
  navCreate: document.querySelector('#nav-create'),
  navDiary: document.querySelector('#nav-diary'),
}

let preferenceReadFailed = false
let selectedTheme = readThemePreference()
let cameraStream
let cameraAttempt = 0
let countdownTimer
let smileTimer
let countdownValue = 0
let photoBlobs = Array(PHOTO_COUNT).fill(undefined)
let photoEffects = Array(PHOTO_COUNT).fill(undefined)
let photoUrls = []
let stripUrl
let retakeIndex = -1
let sessionStarted = false
let cameraOpening = false
let showingEffects = true
let stripRenderVersion = 0
let decorations = []
let selectedDecorationId

function readThemePreference() {
  try {
    const savedTheme = window.localStorage.getItem(THEME_PREFERENCE_KEY)
    return THEMES.some((theme) => theme.id === savedTheme) ? savedTheme : DEFAULT_THEME
  } catch {
    preferenceReadFailed = true
    return DEFAULT_THEME
  }
}

function setTheme(themeId, persist = true) {
  const theme = THEMES.find((item) => item.id === themeId)
  if (!theme) throw new Error('Tema photostrip yang dipilih tidak tersedia.')
  selectedTheme = themeId
  document.querySelectorAll('.theme-choice').forEach((button) => {
    const isSelected = button.dataset.theme === themeId
    button.classList.toggle('is-selected', isSelected)
    button.setAttribute('aria-pressed', String(isSelected))
  })
  renderDecorationChoices()
  updateStripDesign()
  if (persist) {
    try {
      window.localStorage.setItem(THEME_PREFERENCE_KEY, themeId)
    } catch {
      announce('Tema ini dipilih untuk sementara, tetapi preferensimu tidak dapat disimpan.')
    }
  }
}

function renderThemeChoices() {
  elements.themeOptions.replaceChildren()
  THEMES.forEach((theme) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'theme-choice'
    button.dataset.theme = theme.id
    button.setAttribute('aria-pressed', 'false')
    button.innerHTML = `<span class="theme-swatch" aria-hidden="true"><i></i><i></i><i></i></span><span class="theme-copy"><strong></strong><small></small></span><span class="theme-check" aria-hidden="true">✓</span>`
    button.querySelector('.theme-swatch').style.setProperty('--swatch-1', theme.colors[0])
    button.querySelector('.theme-swatch').style.setProperty('--swatch-2', theme.colors[2])
    button.querySelector('.theme-swatch').style.setProperty('--swatch-3', theme.colors[3])
    button.querySelector('.theme-copy strong').textContent = theme.name
    button.querySelector('.theme-copy small').textContent = theme.description
    button.addEventListener('click', () => setTheme(theme.id))
    elements.themeOptions.append(button)
  })
  setTheme(selectedTheme, false)
}

function announce(message) {
  elements.status.textContent = ''
  window.requestAnimationFrame(() => { elements.status.textContent = message })
}

function showScreen(screen) {
  const isCreate = screen === 'create'
  const isDiary = screen === 'diary'
  elements.createScreen.hidden = !isCreate
  elements.diaryScreen.hidden = !isDiary
  elements.detailScreen.hidden = screen !== 'detail'
  elements.navCreate.classList.toggle('is-active', isCreate)
  elements.navDiary.classList.toggle('is-active', isDiary || screen === 'detail')
  if (isCreate) elements.navCreate.setAttribute('aria-current', 'page')
  else elements.navCreate.removeAttribute('aria-current')
  if (isDiary || screen === 'detail') elements.navDiary.setAttribute('aria-current', 'page')
  else elements.navDiary.removeAttribute('aria-current')
  if (isCreate) setTheme(selectedTheme, false)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function showCaptureError(message) {
  elements.captureError.textContent = message
  elements.captureError.hidden = false
  announce(message)
}

function clearCaptureError() {
  elements.captureError.textContent = ''
  elements.captureError.hidden = true
}

function stopCamera() {
  cameraAttempt += 1
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop())
    cameraStream = undefined
  }
  elements.cameraPreview.srcObject = null
  updateBeautyPreview()
}

function clearCountdown() {
  if (countdownTimer) window.clearTimeout(countdownTimer)
  if (smileTimer) window.clearTimeout(smileTimer)
  countdownTimer = undefined
  smileTimer = undefined
  countdownValue = 0
  elements.countdown.hidden = true
  elements.countdown.textContent = ''
  elements.cancelCountdown.hidden = true
  elements.captureButton.hidden = !cameraStream
}

async function startCamera() {
  if (cameraOpening || cameraStream) return
  clearCaptureError()
  if (!navigator.mediaDevices?.getUserMedia) {
    showCaptureError('Kamera tidak tersedia di sini. Buka halaman ini di browser yang mendukung melalui HTTPS atau localhost.')
    return
  }
  cameraOpening = true
  const attempt = ++cameraAttempt
  elements.startCamera.disabled = true
  elements.startCamera.textContent = 'Membuka kamera…'
  try {
    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 960 } },
      })
    } catch (error) {
      if (error.name !== 'OverconstrainedError' && error.name !== 'ConstraintNotSatisfiedError') throw error
      stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: true })
    }
    if (attempt !== cameraAttempt || elements.createScreen.hidden) {
      stream.getTracks().forEach((track) => track.stop())
      return
    }
    cameraStream = stream
    elements.cameraPreview.srcObject = cameraStream
    await elements.cameraPreview.play()
    elements.cameraWelcome.hidden = true
    elements.cameraPreview.hidden = false
    elements.beautyControls.hidden = false
    elements.startCamera.hidden = true
    elements.captureButton.hidden = false
    elements.captureButton.textContent = retakeIndex >= 0
      ? `Ambil ulang foto ${retakeIndex + 1} dari 4`
      : 'Mulai sesi foto ●'
    const activeIndex = retakeIndex >= 0 ? retakeIndex : Math.max(photoBlobs.findIndex((photo) => !photo), 0)
    updateCaptureProgress(activeIndex)
    if (!sessionStarted && retakeIndex < 0) {
      elements.effectEnabled.checked = true
      showingEffects = true
      updateBeautyPreview()
    }
    elements.boothState.textContent = 'KAMERA SIAP'
    announce('Pratinjau kamera siap. Mulai sesi foto saat kamu siap.')
  } catch (error) {
    if (attempt !== cameraAttempt || elements.createScreen.hidden) return
    stopCamera()
    const message = error.name === 'NotAllowedError' || error.name === 'SecurityError'
      ? 'Izin kamera belum diberikan. Izinkan akses kamera di pengaturan browser, lalu coba lagi.'
      : error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError'
        ? 'Kamera tidak ditemukan. Hubungkan kamera lalu coba lagi.'
        : error.name === 'NotReadableError' || error.name === 'TrackStartError'
          ? 'Kamera tidak dapat dimulai. Tutup aplikasi lain yang sedang menggunakannya, lalu coba lagi.'
          : 'Kamera tidak dapat dimulai. Periksa koneksi kamera dan izin browser, lalu coba lagi.'
    showCaptureError(message)
  } finally {
    cameraOpening = false
    elements.startCamera.disabled = false
    elements.startCamera.textContent = 'Buka kamera ↗'
  }
}

function updateCaptureProgress(index = 0) {
  const completed = photoBlobs.filter(Boolean).length
  elements.boothCounter.textContent = `${completed} / ${PHOTO_COUNT}`
  elements.boothState.textContent = completed === PHOTO_COUNT
    ? 'EMPAT FOTO SIAP'
    : `FOTO ${Math.min(index + 1, PHOTO_COUNT)} DARI ${PHOTO_COUNT}`
  elements.cameraStage.dataset.progress = `Foto ${Math.min(index + 1, PHOTO_COUNT)} dari ${PHOTO_COUNT}`
}

function beginCountdown() {
  if (!cameraStream || !elements.cameraPreview.videoWidth) {
    showCaptureError('Kamera belum siap. Tunggu sampai pratinjau muncul, lalu coba lagi.')
    return
  }
  clearCaptureError()
  if (!sessionStarted && retakeIndex < 0) sessionStarted = true
  elements.captureButton.hidden = true
  elements.cancelCountdown.hidden = false
  const captureIndex = retakeIndex >= 0
    ? retakeIndex
    : photoBlobs.findIndex((photo) => !photo)
  if (captureIndex < 0) {
    showCaptureError('Sesi foto sudah lengkap. Pilih foto yang ingin diulang.')
    return
  }
  retakeIndex = captureIndex
  updateCaptureProgress(captureIndex)
  elements.captureButton.textContent = `Ambil foto ${captureIndex + 1} dari 4 ●`
  countdownValue = COUNTDOWN_SECONDS
  elements.countdown.textContent = String(countdownValue)
  elements.countdown.hidden = false
  const tick = () => {
    countdownValue -= 1
    if (countdownValue <= 0) {
      countdownTimer = undefined
      elements.countdown.textContent = 'SENYUM!'
      smileTimer = window.setTimeout(() => { capturePhoto(captureIndex) }, 350)
      return
    }
    elements.countdown.textContent = String(countdownValue)
    countdownTimer = window.setTimeout(tick, 1000)
  }
  countdownTimer = window.setTimeout(tick, 1000)
}

function blobFromCanvas(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Browser tidak dapat membuat foto dari bingkai kamera ini.'))
    }, type, quality)
  })
}

async function capturePhoto(captureIndex) {
  elements.cancelCountdown.hidden = true
  elements.countdown.hidden = true
  try {
    const canvas = document.createElement('canvas')
    canvas.width = elements.cameraPreview.videoWidth
    canvas.height = elements.cameraPreview.videoHeight
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Browser ini tidak mendukung pengambilan foto.')
    context.translate(canvas.width, 0)
    context.scale(-1, 1)
    context.drawImage(elements.cameraPreview, 0, 0, canvas.width, canvas.height)
    const blob = await blobFromCanvas(canvas, 'image/jpeg', 0.94)
    if (!blob.size) throw new Error('Foto dari kamera kosong. Silakan coba lagi.')
    photoBlobs[captureIndex] = blob
    photoEffects[captureIndex] = getEffectSettings()
    retakeIndex = -1
    const nextIndex = photoBlobs.findIndex((photo) => !photo)
    if (nextIndex >= 0) {
      updateCaptureProgress(nextIndex)
      elements.captureButton.textContent = `Ambil foto ${nextIndex + 1} dari 4 ●`
      announce(`Foto ${captureIndex + 1} dari 4 tersimpan. Lanjut ke foto ${nextIndex + 1} dari 4.`)
      countdownTimer = window.setTimeout(beginCountdown, 650)
    } else {
      stopCamera()
      sessionStarted = true
      await showCaptureReview()
      announce('Empat foto sudah siap. Kamu bisa mengulang foto atau menyimpan kenangan.')
    }
  } catch (error) {
    showCaptureError(`Foto tidak dapat diambil. ${error.message}`)
    elements.captureButton.hidden = !cameraStream
  }
}

async function showCaptureReview() {
  elements.cameraPreview.hidden = true
  elements.cameraWelcome.hidden = true
  elements.captureButton.hidden = true
  elements.beautyControls.hidden = true
  elements.captureReview.hidden = false
  elements.saveButton.disabled = false
  elements.boothState.textContent = 'EMPAT FOTO SIAP'
  elements.boothCounter.textContent = `${PHOTO_COUNT} / ${PHOTO_COUNT}`
  renderCapturedPhotos()
  await refreshStripPreview()
}

function renderCapturedPhotos() {
  photoUrls.forEach((url) => URL.revokeObjectURL(url))
  photoUrls = []
  elements.capturedPhotos.replaceChildren()
  photoBlobs.forEach((blob, index) => {
    if (!blob) return
    const card = document.createElement('div')
    card.className = 'captured-photo'
    const image = document.createElement('img')
    image.alt = `Foto ${index + 1} dari 4`
    const url = URL.createObjectURL(blob)
    photoUrls.push(url)
    image.src = url
    const retake = addText(card, 'button', 'button button-secondary', `Ulangi foto ${index + 1}`)
    retake.type = 'button'
    retake.addEventListener('click', () => beginRetake(index))
    card.prepend(image)
    elements.capturedPhotos.append(card)
  })
}

async function beginRetake(index) {
  retakeIndex = index
  elements.captureReview.hidden = true
  elements.cameraWelcome.hidden = false
  elements.startCamera.hidden = false
  elements.startCamera.disabled = false
  elements.startCamera.textContent = 'Buka kamera ↗'
  elements.boothState.textContent = `ULANGI FOTO ${index + 1}`
  elements.cameraPreview.hidden = true
  await startCamera()
}

function restartSession(announceRestart = true) {
  clearCountdown()
  stopCamera()
  photoUrls.forEach((url) => URL.revokeObjectURL(url))
  photoUrls = []
  elements.capturedPhotos.replaceChildren()
  photoBlobs = Array(PHOTO_COUNT).fill(undefined)
  photoEffects = Array(PHOTO_COUNT).fill(undefined)
  retakeIndex = -1
  sessionStarted = false
  decorations = []
  selectedDecorationId = undefined
  elements.captureReview.hidden = true
  elements.cameraPreview.hidden = true
  elements.cameraWelcome.hidden = false
  elements.beautyControls.hidden = true
  elements.startCamera.hidden = false
  elements.captureButton.hidden = true
  elements.boothState.textContent = 'PHOTOBOOTH-MU'
  elements.boothCounter.textContent = `0 / ${PHOTO_COUNT}`
  setDefaultEffects()
  showingEffects = true
  elements.previewOriginal.classList.remove('is-selected')
  elements.previewEffect.classList.add('is-selected')
  elements.previewOriginal.setAttribute('aria-pressed', 'false')
  elements.previewEffect.setAttribute('aria-pressed', 'true')
  updateEffectLabels()
  clearCaptureError()
  revokeStripPreview()
  renderDecorationChoices()
  renderDecorationList()
  if (announceRestart) announce('Sesi diulang. Buka kamera untuk mulai mengambil empat foto lagi.')
}

function resetPendingPhoto() {
  restartSession(false)
  elements.saveButton.disabled = true
}

function drawWrappedText(context, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const words = text.split(/\s+/)
  let line = ''
  let lineNumber = 0
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word
    if (line && context.measureText(candidate).width > maxWidth) {
      if (lineNumber === maxLines - 1) {
        while (line && context.measureText(`${line}…`).width > maxWidth) line = line.slice(0, -1)
        context.fillText(`${line}…`, x, y + lineNumber * lineHeight)
        return
      }
      context.fillText(line, x, y + lineNumber * lineHeight)
      lineNumber += 1
      line = word
    } else {
      line = candidate
    }
  }
  if (line && lineNumber < maxLines) context.fillText(line, x, y + lineNumber * lineHeight)
}

function roundRect(context, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2)
  context.beginPath()
  context.moveTo(x + r, y)
  context.arcTo(x + width, y, x + width, y + height, r)
  context.arcTo(x + width, y + height, x, y + height, r)
  context.arcTo(x, y + height, x, y, r)
  context.arcTo(x, y, x + width, y, r)
  context.closePath()
}

function drawStar(context, x, y, outer, inner, color) {
  context.beginPath()
  for (let point = 0; point < 10; point += 1) {
    const radius = point % 2 ? inner : outer
    const angle = -Math.PI / 2 + point * Math.PI / 5
    const px = x + Math.cos(angle) * radius
    const py = y + Math.sin(angle) * radius
    if (point === 0) context.moveTo(px, py)
    else context.lineTo(px, py)
  }
  context.closePath()
  context.fillStyle = color
  context.fill()
}

async function loadPhotoImage(blob) {
  const image = new Image()
  const url = URL.createObjectURL(blob)
  try {
    await new Promise((resolve, reject) => {
      image.onload = resolve
      image.onerror = () => reject(new Error('Foto tidak dapat dibuka untuk membuat photostrip.'))
      image.src = url
    })
    return image
  } finally {
    URL.revokeObjectURL(url)
  }
}

async function renderPhotostrip(entry, originals, withEffects = false, effectSettings = photoEffects) {
  const theme = THEMES.find((item) => item.id === entry.theme)
  if (!theme) throw new Error('Tema photostrip yang dipilih tidak tersedia.')
  if (!Array.isArray(originals) || originals.length !== PHOTO_COUNT || originals.some((blob) => !(blob instanceof Blob))) {
    throw new Error('Sesi harus memiliki empat foto sebelum photostrip dibuat.')
  }
  const images = await Promise.all(originals.map(loadPhotoImage))
  const canvas = document.createElement('canvas')
  canvas.width = 720
  canvas.height = 2400
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Browser ini tidak mendukung pembuatan photostrip.')
  const [background, ink, accent, surface] = theme.colors
  if (theme.id === 'dreamy') {
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height)
    gradient.addColorStop(0, '#f5f0ff')
    gradient.addColorStop(1, '#dce8ff')
    context.fillStyle = gradient
  } else context.fillStyle = background
  context.fillRect(0, 0, canvas.width, canvas.height)

  if (theme.id === 'cute') {
    context.fillStyle = surface
    roundRect(context, 22, 22, 676, 2356, 42)
    context.fill()
  } else if (theme.id === 'masculine') {
    context.fillStyle = ink
    context.fillRect(0, 0, canvas.width, 1900)
    context.strokeStyle = accent
    context.lineWidth = 3
    context.strokeRect(25, 25, 670, 2350)
    context.strokeRect(37, 37, 646, 2326)
  }

  context.textAlign = 'center'
  context.fillStyle = theme.id === 'masculine' ? surface : ink
  context.font = theme.id === 'masculine' ? '700 24px Arial, sans-serif' : '600 24px Georgia, serif'
  context.fillText('THESIS MEMORIES', 360, 70)
  context.fillStyle = accent
  context.font = '700 12px Arial, sans-serif'
  context.fillText('FOUR FRAMES, ONE STORY', 360, 96)

  if (theme.id === 'dreamy') {
    context.globalAlpha = 0.75
    for (let i = 0; i < 18; i += 1) {
      const x = i % 2 ? 17 : 703
      const y = 150 + Math.floor(i / 2) * 230
      drawStar(context, x, y, 6, 2.5, accent)
    }
    context.globalAlpha = 1
  } else if (theme.id === 'cute') {
    for (const x of [30, 690]) {
      context.fillStyle = accent
      context.beginPath()
      context.arc(x, 112, 11, 0, Math.PI * 2)
      context.fill()
    }
  }

  const photoX = 40
  const photoWidth = 640
  const photoHeight = 480
  const photoTop = 140
  const photoStep = 504
  images.forEach((image, index) => {
    const effects = effectSettings[index]
    const applyEffects = withEffects && Boolean(effects?.enabled)
    const y = photoTop + index * photoStep
    const inset = theme.id === 'minimalist' ? 0 : 10
    const frameX = photoX - inset
    const frameY = y - inset
    const frameWidth = photoWidth + inset * 2
    const frameHeight = photoHeight + inset * 2
    context.fillStyle = theme.id === 'masculine' ? '#293743' : surface
    if (theme.id === 'cute') {
      roundRect(context, frameX, frameY, frameWidth, frameHeight, 22)
      context.fill()
    } else context.fillRect(frameX, frameY, frameWidth, frameHeight)
    context.save()
    if (theme.id === 'cute') {
      roundRect(context, photoX, y, photoWidth, photoHeight, 15)
      context.clip()
    } else {
      context.beginPath()
      context.rect(photoX, y, photoWidth, photoHeight)
      context.clip()
    }
    const scale = Math.max(photoWidth / image.naturalWidth, photoHeight / image.naturalHeight)
    const width = image.naturalWidth * scale
    const height = image.naturalHeight * scale
    const lighting = Number(effects?.lighting ?? 100)
    context.filter = applyEffects
      ? `brightness(${Number(effects.brightness) * lighting / 100}%) contrast(${effects.contrast}%)`
      : 'none'
    context.drawImage(image, photoX + (photoWidth - width) / 2, y + (photoHeight - height) / 2, width, height)
    context.filter = 'none'
    if (applyEffects && Number(effects.warmth)) {
      context.globalAlpha = Math.abs(Number(effects.warmth)) / 180
      context.fillStyle = Number(effects.warmth) > 0 ? '#ffb36b' : '#89baff'
      context.fillRect(photoX, y, photoWidth, photoHeight)
      context.globalAlpha = 1
    }
    if (applyEffects && Number(effects.glow)) {
      const glow = context.createRadialGradient(photoX + photoWidth / 2, y + photoHeight / 2, photoHeight * 0.1, photoX + photoWidth / 2, y + photoHeight / 2, photoWidth * 0.7)
      glow.addColorStop(0, `rgb(255 246 230 / ${Number(effects.glow)}%)`)
      glow.addColorStop(1, 'rgb(255 246 230 / 0%)')
      context.fillStyle = glow
      context.fillRect(photoX, y, photoWidth, photoHeight)
    }
    context.restore()

    if (theme.id === 'minimalist') {
      context.strokeStyle = accent
      context.lineWidth = 1
      context.strokeRect(frameX, frameY, frameWidth, frameHeight)
    } else if (theme.id === 'masculine') {
      context.strokeStyle = accent
      context.lineWidth = 2
      context.strokeRect(frameX, frameY, frameWidth, frameHeight)
      context.fillStyle = surface
      context.font = '700 10px monospace'
      context.textAlign = 'left'
      context.fillText('TM', frameX + 4, frameY + frameHeight + 19)
      context.textAlign = 'center'
    } else if (theme.id === 'cute') {
      drawStar(context, frameX + 4, frameY + 4, 11, 5, accent)
      context.fillStyle = ink
      context.font = '600 13px Arial, sans-serif'
      context.fillText('♡', frameX + 14, frameY + frameHeight + 20)
      context.fillText('♡', frameX + frameWidth - 14, frameY + frameHeight + 20)
    } else {
      context.strokeStyle = accent
      context.globalAlpha = 0.75
      context.lineWidth = 2
      context.strokeRect(frameX, frameY, frameWidth, frameHeight)
      context.globalAlpha = 1
      drawStar(context, frameX + frameWidth - 2, frameY + 2, 13, 6, accent)
    }
    context.fillStyle = theme.id === 'masculine' ? surface : ink
    context.font = '600 12px Arial, sans-serif'
    context.textAlign = 'center'
    context.fillText(`0${index + 1}`, 360, y + photoHeight + 20)
  })

  decorations.forEach((decoration, index) => {
    const size = 28 * decoration.size / 100
    let x = 360
    let y = 110
    if (decoration.position === 'left' || decoration.position === 'right') {
      x = decoration.position === 'left' ? 18 : 702
      y = photoTop + (index % PHOTO_COUNT) * photoStep + photoHeight / 2
    } else if (decoration.position === 'footer') {
      x = 145 + (index % 4) * 145
      y = 2180
    } else {
      x = 90 + (index % 4) * 180
      y = 112
    }
    context.textAlign = 'center'
    context.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`
    context.fillStyle = accent
    context.fillText(decoration.symbol, x, y)
  })

  const footerY = 2220
  context.fillStyle = theme.id === 'masculine' ? surface : ink
  context.font = theme.id === 'masculine' ? '700 31px Arial, sans-serif' : '600 31px Georgia, serif'
  drawWrappedText(context, entry.title || 'Kenangan Kuliah', 360, footerY, 630, 38, 2)
  context.fillStyle = accent
  context.font = '600 17px Arial, sans-serif'
  drawWrappedText(context, (entry.milestone || 'Momen akademik').toLocaleUpperCase('id-ID'), 360, 2300, 620, 24, 1)
  context.fillStyle = theme.id === 'masculine' ? surface : ink
  context.globalAlpha = 0.78
  context.font = '15px Arial, sans-serif'
  context.fillText(formatDate(entry.date), 360, 2340)
  context.globalAlpha = 1
  context.strokeStyle = accent
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(320, 2360)
  context.lineTo(400, 2360)
  context.stroke()
  context.font = '600 11px Arial, sans-serif'
  context.fillText('DISIMPAN DENGAN KENANGAN', 360, 2382)
  return blobFromCanvas(canvas, 'image/png')
}

function createId() {
  return globalThis.crypto?.randomUUID?.() || `memory-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function updateEffectLabels() {
  elements.brightnessValue.value = `${elements.effectBrightness.value}%`
  elements.warmthValue.value = elements.effectWarmth.value
  elements.contrastValue.value = `${elements.effectContrast.value}%`
  elements.lightingValue.value = `${elements.effectLighting.value}%`
  elements.glowValue.value = elements.effectGlow.value
  elements.decorationSizeValue.value = `${elements.decorationSize.value}%`
}

function getEffectSettings() {
  return {
    enabled: elements.effectEnabled.checked,
    brightness: Number(elements.effectBrightness.value),
    warmth: Number(elements.effectWarmth.value),
    contrast: Number(elements.effectContrast.value),
    lighting: Number(elements.effectLighting.value),
    glow: Number(elements.effectGlow.value),
  }
}

function setDefaultEffects() {
  elements.effectEnabled.checked = true
  elements.effectBrightness.value = '104'
  elements.effectWarmth.value = '5'
  elements.effectContrast.value = '98'
  elements.effectLighting.value = '100'
  elements.effectGlow.value = '0'
  updateEffectLabels()
  updateBeautyPreview()
}

function updateBeautyPreview() {
  const enabled = elements.effectEnabled.checked && Boolean(cameraStream) && !elements.cameraPreview.hidden
  const brightness = enabled ? Number(elements.effectBrightness.value) * Number(elements.effectLighting.value) / 100 : 100
  const contrast = enabled ? Number(elements.effectContrast.value) : 100
  const warmth = enabled ? Math.max(0, Number(elements.effectWarmth.value)) / 300 : 0
  elements.cameraPreview.style.filter = `brightness(${brightness}%) contrast(${contrast}%) sepia(${warmth})`
  elements.cameraStage.style.setProperty('--glow-opacity', enabled ? `${Number(elements.effectGlow.value) / 100}` : '0')
  elements.cameraStage.style.setProperty('--warm-overlay', enabled && Number(elements.effectWarmth.value) > 0
    ? `${Number(elements.effectWarmth.value) / 500}`
    : '0')
  elements.cameraStage.style.setProperty('--cool-overlay', enabled && Number(elements.effectWarmth.value) < 0
    ? `${Math.abs(Number(elements.effectWarmth.value)) / 500}`
    : '0')
  elements.cameraStage.classList.toggle('is-effect-enabled', enabled)
}

function selectedDecoration() {
  return decorations.find((item) => item.id === selectedDecorationId)
}

function renderDecorationChoices() {
  if (!elements.decorationOptions) return
  elements.decorationOptions.replaceChildren()
  for (const symbol of THEME_DECORATIONS[selectedTheme]) {
    const add = addText(elements.decorationOptions, 'button', 'decoration-option', symbol)
    add.type = 'button'
    add.setAttribute('aria-label', `Tambahkan ornamen ${symbol}`)
    add.addEventListener('click', () => {
      if (decorations.length >= 8) {
        announce('Maksimal delapan ornamen untuk satu photostrip.')
        return
      }
      const decoration = {
        id: createId(),
        symbol,
        position: 'header',
        size: 100,
      }
      decorations.push(decoration)
      selectedDecorationId = decoration.id
      renderDecorationList()
      updateStripDesign()
    })
  }
}

function renderDecorationList() {
  if (!elements.decorationList) return
  elements.decorationList.replaceChildren()
  decorations.forEach((decoration) => {
    const row = document.createElement('div')
    row.className = 'decoration-row'
    const positionNames = { header: 'atas', left: 'kiri', right: 'kanan', footer: 'bawah' }
    const select = addText(row, 'button', 'decoration-item', `${decoration.symbol} ${positionNames[decoration.position]}`)
    select.type = 'button'
    select.classList.toggle('is-selected', decoration.id === selectedDecorationId)
    select.setAttribute('aria-pressed', String(decoration.id === selectedDecorationId))
    select.addEventListener('click', () => {
      selectedDecorationId = decoration.id
      elements.decorationPosition.value = decoration.position
      elements.decorationSize.value = String(decoration.size)
      updateEffectLabels()
      renderDecorationList()
    })
    const remove = addText(row, 'button', 'decoration-remove', 'Hapus')
    remove.type = 'button'
    remove.setAttribute('aria-label', `Hapus ornamen ${decoration.symbol}`)
    remove.addEventListener('click', () => {
      decorations = decorations.filter((item) => item.id !== decoration.id)
      if (selectedDecorationId === decoration.id) selectedDecorationId = decorations.at(-1)?.id
      const current = selectedDecoration()
      elements.decorationPosition.disabled = !current
      elements.decorationSize.disabled = !current
      if (current) {
        elements.decorationPosition.value = current.position
        elements.decorationSize.value = String(current.size)
      }
      renderDecorationList()
      updateStripDesign()
    })
    elements.decorationList.append(row)
  })
  const current = selectedDecoration()
  elements.decorationPosition.disabled = !current
  elements.decorationSize.disabled = !current
  if (current) {
    elements.decorationPosition.value = current.position
    elements.decorationSize.value = String(current.size)
  }
  updateEffectLabels()
}

function revokeStripPreview() {
  if (stripUrl) URL.revokeObjectURL(stripUrl)
  stripUrl = undefined
  elements.stripPreview.removeAttribute('src')
  elements.stripPreview.hidden = true
}

async function refreshStripPreview() {
  const version = ++stripRenderVersion
  try {
    const entry = {
      title: elements.title.value.trim(),
      milestone: elements.milestone.value,
      date: elements.date.value || new Date().toISOString().slice(0, 10),
      theme: selectedTheme,
    }
    const blob = await renderPhotostrip(entry, photoBlobs, showingEffects)
    if (version !== stripRenderVersion) return
    revokeStripPreview()
    stripUrl = URL.createObjectURL(blob)
    elements.stripPreview.src = stripUrl
    elements.stripPreview.hidden = false
  } catch (error) {
    if (version === stripRenderVersion) showCaptureError(`Pratinjau photostrip tidak dapat dibuat. ${error.message}`)
  }
}

function setStripPreviewMode(useEffects) {
  showingEffects = useEffects
  elements.previewOriginal.classList.toggle('is-selected', !useEffects)
  elements.previewEffect.classList.toggle('is-selected', useEffects)
  elements.previewOriginal.setAttribute('aria-pressed', String(!useEffects))
  elements.previewEffect.setAttribute('aria-pressed', String(useEffects))
  refreshStripPreview()
}

function updateStripDesign() {
  if (!elements.captureReview.hidden) refreshStripPreview()
}

async function saveMemory() {
  if (photoBlobs.some((photo) => !photo)) {
    showCaptureError('Lengkapi empat foto sebelum menyimpan kenangan.')
    return
  }
  if (!elements.form.reportValidity()) return
  if (!window.confirm('Simpan empat foto dan photostrip ini ke Diary Saya?')) return

  const photoIds = photoBlobs.map(() => createId())
  const milestoneCategory = elements.milestone.value
  const milestone = milestoneCategory === 'Lainnya'
    ? elements.otherMilestone.value.trim()
    : milestoneCategory
  const entry = {
    id: createId(),
    title: elements.title.value.trim(),
    date: elements.date.value,
    milestone,
    milestoneCategory,
    theme: selectedTheme,
    effects: photoEffects.map((effect) => ({ ...effect })),
    decorations: decorations.map(({ symbol, position, size }) => ({ symbol, position, size })),
    photoIds,
    rawPhotoId: photoIds[0],
    finalPhotoId: createId(),
    createdAt: new Date().toISOString(),
  }
  if (!entry.title) {
    elements.title.setCustomValidity('Tambahkan judul untuk kenangan ini.')
    elements.title.reportValidity()
    elements.title.setCustomValidity('')
    return
  }
  if (!entry.milestone) {
    elements.otherMilestone.setCustomValidity('Tulis nama momen lainnya.')
    elements.otherMilestone.reportValidity()
    elements.otherMilestone.setCustomValidity('')
    return
  }

  elements.saveButton.disabled = true
  elements.saveButton.textContent = 'Menyimpan kenangan…'
  clearCaptureError()
  try {
    const finalBlob = await renderPhotostrip(entry, photoBlobs, showingEffects)
    await saveEntry(entry, photoBlobs, finalBlob)
    announce('Kenangan dan lima foto tersimpan di perangkat ini.')
    resetPendingPhoto()
    elements.title.value = ''
    elements.milestone.value = ''
    elements.otherMilestone.value = ''
    elements.otherMilestone.required = false
    elements.otherMilestoneWrap.hidden = true
    await showDiary()
  } catch (error) {
    showCaptureError(`Kenangan tidak dapat disimpan. ${error.message || 'Periksa penyimpanan browser lalu coba lagi.'}`)
  } finally {
    elements.saveButton.disabled = false
    elements.saveButton.innerHTML = 'Simpan Kenangan <span aria-hidden="true">↗</span>'
  }
}

function formatDate(dateString) {
  const date = new Date(`${dateString}T12:00:00`)
  return Number.isNaN(date.getTime())
    ? dateString
    : new Intl.DateTimeFormat('id-ID', { month: 'long', day: 'numeric', year: 'numeric' }).format(date)
}

function addText(parent, tagName, className, text) {
  const node = document.createElement(tagName)
  if (className) node.className = className
  node.textContent = text
  parent.append(node)
  return node
}

async function showDiary() {
  const wasCameraActive = Boolean(cameraStream)
  stopCamera()
  if (countdownTimer) window.clearTimeout(countdownTimer)
  countdownTimer = undefined
  countdownValue = 0
  elements.countdown.hidden = true
  elements.cancelCountdown.hidden = true
  if (smileTimer) window.clearTimeout(smileTimer)
  smileTimer = undefined
  if (wasCameraActive) {
    elements.cameraWelcome.hidden = false
    elements.cameraPreview.hidden = true
    elements.startCamera.hidden = false
    elements.captureButton.hidden = true
    elements.beautyControls.hidden = true
    elements.boothState.textContent = 'PHOTOBOOTH-MU'
  }
  if (smileTimer) window.clearTimeout(smileTimer)
  showScreen('diary')
  elements.diaryContent.replaceChildren()
  addText(elements.diaryContent, 'p', 'loading-message', 'Membuka diary-mu…')
  try {
    const entries = await listEntries()
    entries.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    elements.diaryContent.replaceChildren()
    if (!entries.length) {
      const empty = document.createElement('div')
      empty.className = 'empty-state'
      addText(empty, 'span', 'empty-sparkle', '✳')
      addText(empty, 'h2', '', 'Bab berikutnya dimulai di sini.')
      addText(empty, 'p', '', 'Kenangan akademik yang kamu simpan akan tersimpan di sini.')
      const createButton = addText(empty, 'button', 'button button-primary', 'Buat kenangan pertamamu ↗')
      createButton.type = 'button'
      createButton.addEventListener('click', () => showScreen('create'))
      elements.diaryContent.append(empty)
      return
    }
    const grid = document.createElement('div')
    grid.className = 'memory-grid'
    entries.forEach((entry) => grid.append(createMemoryCard(entry)))
    elements.diaryContent.append(grid)
    announce(`${entries.length} kenangan tersimpan di diary-mu.`)
  } catch (error) {
    elements.diaryContent.replaceChildren()
    const problem = document.createElement('div')
    problem.className = 'storage-error'
    addText(problem, 'h2', '', 'Diary-mu tidak dapat dibuka.')
    addText(problem, 'p', '', error.message || 'Periksa pengaturan penyimpanan browser ini, lalu coba lagi.')
    const retry = addText(problem, 'button', 'button button-secondary', 'Coba lagi')
    retry.type = 'button'
    retry.addEventListener('click', showDiary)
    elements.diaryContent.append(problem)
    announce('Diary-mu tidak dapat dibuka.')
  }
}

function createMemoryCard(entry) {
  const card = document.createElement('article')
  card.className = 'memory-card'
  const openButton = document.createElement('button')
  openButton.type = 'button'
  openButton.className = 'memory-open'
  openButton.setAttribute('aria-label', `Buka ${entry.title}, ${formatDate(entry.date)}`)
  const image = document.createElement('img')
  image.className = 'memory-thumbnail'
  image.alt = ''
  image.loading = 'lazy'
  openButton.append(image)
  const info = document.createElement('span')
  info.className = 'memory-info'
  addText(info, 'span', 'memory-date', formatDate(entry.date))
  addText(info, 'strong', 'memory-title', entry.title)
  addText(info, 'span', 'memory-milestone', entry.milestone)
  openButton.append(info)
  const arrow = addText(openButton, 'span', 'memory-arrow', '↗')
  arrow.setAttribute('aria-hidden', 'true')
  openButton.addEventListener('click', () => openMemory(entry.id))
  card.append(openButton)
  const themeName = THEMES.find((theme) => theme.id === entry.theme)?.name || 'Tema tidak tersedia'
  addText(card, 'span', 'memory-theme', themeName)
  getEntryWithPhotos(entry.id)
    .then(({ finalPhoto }) => {
      const imageUrl = URL.createObjectURL(finalPhoto.blob)
      image.src = imageUrl
      image.addEventListener('load', () => URL.revokeObjectURL(imageUrl), { once: true })
      image.addEventListener('error', () => {
        URL.revokeObjectURL(imageUrl)
        image.removeAttribute('src')
        image.alt = 'Photostrip tidak tersedia'
        addText(card, 'span', 'photo-warning', 'Photostrip tidak tersedia')
      }, { once: true })
    })
    .catch(() => {
      image.alt = 'Photostrip tidak tersedia'
      addText(card, 'span', 'photo-warning', 'Photostrip tidak tersedia')
    })
  return card
}

async function openMemory(id) {
  elements.detailContent.replaceChildren()
  showScreen('detail')
  addText(elements.detailContent, 'p', 'loading-message', 'Membuka kenangan…')
  try {
    const { entry, photos, finalPhoto } = await getEntryWithPhotos(id)
    elements.detailContent.replaceChildren()
    const layout = document.createElement('div')
    layout.className = 'memory-detail'
    const stripColumn = document.createElement('div')
    stripColumn.className = 'detail-strip-column'
    const strip = document.createElement('img')
    strip.className = 'detail-strip'
    strip.alt = `Photostrip untuk ${entry.title}`
    strip.src = URL.createObjectURL(finalPhoto.blob)
    strip.addEventListener('load', () => URL.revokeObjectURL(strip.src), { once: true })
    stripColumn.append(strip)
    addText(stripColumn, 'p', 'original-label', 'EMPAT FOTO ASLI')
    const originals = document.createElement('div')
    originals.className = 'detail-originals'
    photos.forEach((photo, index) => {
      const original = document.createElement('img')
      original.className = 'detail-original'
      original.alt = `Foto asli ${index + 1} dari 4 untuk ${entry.title}`
      const url = URL.createObjectURL(photo.blob)
      original.src = url
      original.addEventListener('load', () => URL.revokeObjectURL(url), { once: true })
      originals.append(original)
    })
    stripColumn.append(originals)

    const copy = document.createElement('div')
    copy.className = 'detail-copy'
    addText(copy, 'p', 'eyebrow', 'MOMEN DALAM PERJALANANMU')
    addText(copy, 'h1', '', entry.title)
    addText(copy, 'p', 'detail-date', formatDate(entry.date))
    addText(copy, 'p', 'detail-milestone', entry.milestone)
    const theme = THEMES.find((item) => item.id === entry.theme)
    addText(copy, 'p', 'detail-theme', `Tema photostrip · ${theme?.name || 'Tema tidak tersedia'}`)
    const actions = document.createElement('div')
    actions.className = 'detail-actions'
    const deleteButton = addText(actions, 'button', 'button button-danger', 'Hapus kenangan ini')
    deleteButton.type = 'button'
    deleteButton.addEventListener('click', () => confirmDelete(entry))
    copy.append(actions)
    layout.append(stripColumn, copy)
    elements.detailContent.append(layout)
    if (theme) setTheme(theme.id, false)
    announce(`Kenangan ${entry.title} dibuka.`)
  } catch (error) {
    elements.detailContent.replaceChildren()
    const problem = document.createElement('div')
    problem.className = 'storage-error'
    addText(problem, 'h2', '', 'Kenangan ini tidak dapat dibuka.')
    addText(problem, 'p', '', error.message || 'Foto atau catatan diary hilang atau tidak dapat dibaca.')
    elements.detailContent.append(problem)
    announce('Kenangan ini tidak dapat dibuka.')
  }
}

async function confirmDelete(entry) {
  const confirmed = window.confirm(`Hapus “${entry.title}” beserta empat foto asli dan photostrip dari browser ini? Tindakan ini tidak dapat dibatalkan.`)
  if (!confirmed) return
  try {
    await deleteEntry(entry.id)
    announce('Kenangan beserta foto-fotonya dihapus dari perangkat ini.')
    await showDiary()
  } catch (error) {
    const problem = document.createElement('div')
    problem.className = 'storage-error'
    addText(problem, 'h2', '', 'Kenangan ini tidak dapat dihapus.')
    addText(problem, 'p', '', error.message || 'Penghapusan belum berhasil. Silakan coba lagi.')
    elements.detailContent.prepend(problem)
    announce('Kenangan ini tidak dapat dihapus.')
  }
}

function setToday() {
  const now = new Date()
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
  elements.date.value = localDate
}

renderThemeChoices()
setToday()
if (preferenceReadFailed) announce('Preferensi tema tersimpan tidak dapat dibaca. Tema bawaan dipilih.')
elements.navCreate.addEventListener('click', () => showScreen('create'))
elements.navDiary.addEventListener('click', showDiary)
document.querySelector('#diary-create').addEventListener('click', () => showScreen('create'))
document.querySelector('#detail-back').addEventListener('click', showDiary)
elements.startCamera.addEventListener('click', startCamera)
elements.captureButton.addEventListener('click', beginCountdown)
elements.cancelCountdown.addEventListener('click', clearCountdown)
elements.restartSession.addEventListener('click', restartSession)
elements.saveButton.addEventListener('click', saveMemory)
for (const input of [elements.effectBrightness, elements.effectWarmth, elements.effectContrast, elements.effectLighting, elements.effectGlow]) {
  input.addEventListener('input', () => {
    updateEffectLabels()
    updateBeautyPreview()
    updateStripDesign()
  })
}
elements.effectEnabled.addEventListener('change', () => { updateBeautyPreview(); updateStripDesign() })
elements.effectReset.addEventListener('click', () => {
  setDefaultEffects()
  updateStripDesign()
})
elements.previewOriginal.addEventListener('click', () => setStripPreviewMode(false))
elements.previewEffect.addEventListener('click', () => setStripPreviewMode(true))
elements.milestone.addEventListener('change', () => {
  const isOther = elements.milestone.value === 'Lainnya'
  elements.otherMilestoneWrap.hidden = !isOther
  elements.otherMilestone.required = isOther
  updateStripDesign()
})
elements.otherMilestone.addEventListener('input', () => {
  elements.otherMilestone.setCustomValidity('')
  updateStripDesign()
})
elements.decorationPosition.addEventListener('change', () => {
  const current = selectedDecoration()
  if (!current) return
  current.position = elements.decorationPosition.value
  renderDecorationList()
  updateStripDesign()
})
elements.decorationSize.addEventListener('input', () => {
  const current = selectedDecoration()
  if (!current) return
  current.size = Number(elements.decorationSize.value)
  updateEffectLabels()
  updateStripDesign()
})
elements.decorationReset.addEventListener('click', () => {
  decorations = []
  selectedDecorationId = undefined
  renderDecorationList()
  updateStripDesign()
})
elements.title.addEventListener('input', updateStripDesign)
elements.date.addEventListener('change', updateStripDesign)
elements.form.addEventListener('submit', (event) => event.preventDefault())
window.addEventListener('pagehide', () => {
  if (countdownTimer) window.clearTimeout(countdownTimer)
  if (smileTimer) window.clearTimeout(smileTimer)
  stopCamera()
  photoUrls.forEach((url) => URL.revokeObjectURL(url))
  revokeStripPreview()
})
