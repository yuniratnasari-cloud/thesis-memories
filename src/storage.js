const DATABASE_NAME = 'thesis-memories'
const DATABASE_VERSION = 1
const PHOTO_STORE = 'photos'
const ENTRY_STORE = 'diaryEntries'

let databasePromise

function openDatabase() {
  if (!('indexedDB' in window)) {
    return Promise.reject(new Error('Browser ini tidak mendukung penyimpanan diary lokal.'))
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)

      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains(PHOTO_STORE)) {
          database.createObjectStore(PHOTO_STORE, { keyPath: 'id' })
        }
        if (!database.objectStoreNames.contains(ENTRY_STORE)) {
          database.createObjectStore(ENTRY_STORE, { keyPath: 'id' })
        }
      }

      request.onsuccess = () => {
        const database = request.result
        database.onversionchange = () => database.close()
        resolve(database)
      }

      request.onerror = () => {
        databasePromise = undefined
        reject(request.error || new Error('Penyimpanan diary lokal tidak dapat dibuka.'))
      }

      request.onblocked = () => {
        databasePromise = undefined
        reject(new Error('Penyimpanan diary tertahan oleh tab Thesis Memories lain. Tutup tab lain, lalu coba lagi.'))
      }
    })
  }

  return databasePromise
}

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('Permintaan penyimpanan diary gagal.'))
  })
}

function runTransaction(database, stores, mode, action) {
  const transaction = database.transaction(stores, mode)
  const complete = new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onabort = () => reject(transaction.error || new Error('Transaksi penyimpanan diary dibatalkan.'))
    transaction.onerror = () => reject(transaction.error || new Error('Transaksi penyimpanan diary gagal.'))
  })

  return (async () => {
    try {
      const result = await action(transaction)
      await complete
      return result
    } catch (error) {
      try {
        transaction.abort()
      } catch {
        // The transaction may already have completed or aborted.
      }
      await complete.catch(() => {})
      throw error
    }
  })()
}

export async function saveEntry(entry, photoBlobs, finalBlob) {
  if (!Array.isArray(photoBlobs) || photoBlobs.length !== 4 || photoBlobs.some((blob) => !(blob instanceof Blob) || !blob.size)) {
    throw new Error('Empat foto asli yang valid diperlukan untuk menyimpan kenangan.')
  }
  if (!Array.isArray(entry.photoIds) || entry.photoIds.length !== 4 || new Set(entry.photoIds).size !== 4) {
    throw new Error('Setiap foto asli harus memiliki catatan penyimpanan tersendiri.')
  }
  if (!(finalBlob instanceof Blob) || !finalBlob.size) {
    throw new Error('Photostrip final tidak valid dan tidak dapat disimpan.')
  }
  const database = await openDatabase()
  return runTransaction(database, [ENTRY_STORE, PHOTO_STORE], 'readwrite', (transaction) => {
    const photos = transaction.objectStore(PHOTO_STORE)
    photoBlobs.forEach((blob, index) => {
      photos.add({
        id: entry.photoIds[index],
        blob,
        photoType: 'raw',
        photoIndex: index,
        mimeType: blob.type,
        size: blob.size,
        createdAt: entry.createdAt,
      })
    })
    photos.add({
      id: entry.finalPhotoId,
      blob: finalBlob,
      photoType: 'final',
      mimeType: finalBlob.type,
      size: finalBlob.size,
      createdAt: entry.createdAt,
    })
    transaction.objectStore(ENTRY_STORE).add(entry)
  })
}

export async function listEntries() {
  const database = await openDatabase()
  return runTransaction(database, [ENTRY_STORE], 'readonly', (transaction) =>
    requestResult(transaction.objectStore(ENTRY_STORE).getAll()),
  )
}

export async function getEntryWithPhotos(id) {
  const database = await openDatabase()
  return runTransaction(database, [ENTRY_STORE, PHOTO_STORE], 'readonly', async (transaction) => {
    const entries = transaction.objectStore(ENTRY_STORE)
    const photos = transaction.objectStore(PHOTO_STORE)
    const entry = await requestResult(entries.get(id))
    if (!entry) throw new Error('Catatan diary ini tidak ditemukan.')

    const photoIds = entry.photoIds || [entry.rawPhotoId]
    const [originalPhotos, finalPhoto] = await Promise.all([
      Promise.all(photoIds.map((photoId) => requestResult(photos.get(photoId)))),
      requestResult(photos.get(entry.finalPhotoId)),
    ])
    if (originalPhotos.some((photo) => !photo) || !finalPhoto) {
      throw new Error('Foto untuk kenangan ini tidak ditemukan di penyimpanan lokal.')
    }
    if (originalPhotos.some((photo) => !(photo.blob instanceof Blob) || photo.photoType !== 'raw')) {
      throw new Error('Foto asli untuk kenangan ini tidak dapat dibaca.')
    }
    if (!(finalPhoto.blob instanceof Blob) || finalPhoto.photoType !== 'final') {
      throw new Error('Photostrip untuk kenangan ini tidak dapat dibaca.')
    }
    return { entry, photos: originalPhotos, rawPhoto: originalPhotos[0], finalPhoto }
  })
}

export async function deleteEntry(id) {
  const database = await openDatabase()
  return runTransaction(database, [ENTRY_STORE, PHOTO_STORE], 'readwrite', async (transaction) => {
    const entries = transaction.objectStore(ENTRY_STORE)
    const photos = transaction.objectStore(PHOTO_STORE)
    const entry = await requestResult(entries.get(id))
    if (!entry) throw new Error('Catatan diary ini tidak ditemukan. Muat ulang daftar, lalu coba lagi.')
    for (const photoId of entry.photoIds || [entry.rawPhotoId]) photos.delete(photoId)
    photos.delete(entry.finalPhotoId)
    entries.delete(id)
  })
}
