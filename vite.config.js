import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const certificatePath = process.env.THESIS_HTTPS_CERT
const privateKeyPath = process.env.THESIS_HTTPS_KEY
const httpsRequested = process.env.npm_lifecycle_event === 'dev:https'

if (Boolean(certificatePath) !== Boolean(privateKeyPath)) {
  throw new Error(
    'Set both THESIS_HTTPS_CERT and THESIS_HTTPS_KEY to enable HTTPS. ' +
      'In PowerShell, point them to the mkcert certificate and key files; see docs/TESTING_PLAN.md.',
  )
}

if (httpsRequested && !certificatePath) {
  throw new Error(
    'HTTPS was requested, but THESIS_HTTPS_CERT and THESIS_HTTPS_KEY are not set. ' +
      'Generate local certificates with mkcert and set both variables in this PowerShell window; ' +
      'see docs/TESTING_PLAN.md.',
  )
}

const resolvedCertificatePath = certificatePath ? resolve(certificatePath) : undefined
const resolvedPrivateKeyPath = privateKeyPath ? resolve(privateKeyPath) : undefined

for (const [variableName, filePath] of [
  ['THESIS_HTTPS_CERT', resolvedCertificatePath],
  ['THESIS_HTTPS_KEY', resolvedPrivateKeyPath],
]) {
  if (filePath && !existsSync(filePath)) {
    throw new Error(`${variableName} points to a file that does not exist: ${filePath}`)
  }
}

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/thesis-memories/' : '/',
  server: resolvedCertificatePath
    ? {
        host: '0.0.0.0',
        https: {
          cert: readFileSync(resolvedCertificatePath),
          key: readFileSync(resolvedPrivateKeyPath),
        },
      }
    : undefined,
})
