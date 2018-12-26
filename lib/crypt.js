const { ENCRYPTION_KEY } = process.env

const { randomBytes, createCipheriv, createDecipheriv } = require('crypto')

const ivLength = 16

function encrypt (text) {
  const iv = randomBytes(ivLength)
  const cipher = createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
  const encrypted = cipher.update(text)
  return iv.toString('hex') + ':' + Buffer.concat([encrypted, cipher.final()]).toString('hex')
}

function decrypt (text) {
  const textParts = text.split(':')
  const iv = Buffer.from(textParts.shift(), 'hex')
  const encryptedText = Buffer.from(textParts.join(':'), 'hex')
  const decipher = createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv)
  const decrypted = decipher.update(encryptedText)
  return Buffer.concat([decrypted, decipher.final()]).toString()
}

module.exports = { decrypt, encrypt }
