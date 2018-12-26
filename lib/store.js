const fs = require('fs')
const { promisify } = require('util')
const { stringify, parse } = JSON
const { entries } = Object
const { isArray } = Array
const readFile = promisify(fs.readFile)
const { decrypt } = require('./crypt')
const authFile = `${__dirname}/private_key`
const fetchModule = require('node-fetch')
const fetch = fetchModule.default || fetchModule
const { google } = require('googleapis')
const { auth: { JWT } } = google
const scopes = ['https://www.googleapis.com/auth/datastore']

const authorize = async () => {
  const auth = parse(decrypt(await readFile(authFile, 'utf8')))
  return new JWT(auth.client_email, null, auth.private_key, scopes).authorize()
}

class Store {
  /**
   * @param {string} projectId
   * @param {string} databaseId
   */
  constructor (projectId, databaseId) {
    this.projectId = projectId
    this.databaseId = databaseId
  }
  get url () {
    return `https://firestore.googleapis.com/v1beta1/projects/${this.projectId}/databases/${this.databaseId}`
  }
  /**
   *
   * @param {string} name
   */
  collection (name) {
    return new Collection(this, name)
  }
  async patch (path, opts) {
    return this.fetch(path, { ...opts, method: 'PATCH' })
  }
  async delete (path, opts) {
    return this.fetch(path, { ...opts, method: 'DELETE' })
  }
  async post (path, opts) {
    return this.fetch(path, { ...opts, method: 'POST' })
  }
  async get (path, opts) {
    return this.fetch(path, { ...opts, method: 'GET' })
  }
  /**
   * @param {string} url
   * @param {RequestInit} opts
   * @returns {Response}
   */
  async fetch (url, opts = { headers: {} }) {
    const auth = await authorize()
    opts.headers = { ...opts.headers, 'Authorization': `Bearer ${auth.access_token}` }
    if (opts.body && typeof opts.body !== 'string') opts.body = stringify(opts.body)
    console.debug(url)
    return fetch(url, opts)
  }
}

class Collection {
  /**
   * @param {Store} store
   * @param {string} collectionId
   */
  constructor (store, collectionId) {
    this.store = store
    this.collectionId = collectionId
  }
  async listDocuments () {
    const response = await this.store.get(this.url)
    return (await response.json()).documents || []
  }
  doc (documentId) {
    return new DocumentRef(this, documentId)
  }
  get url () {
    return `${this.store.url}/documents/${this.collectionId}`
  }
}

class DocumentRef {
  /**
   * @param {Collection} collection
   * @param {string} documentId
   */
  constructor (collection, documentId) {
    this.collection = collection
    this.documentId = documentId
  }
  get url () {
    return `${this.collection.url}/${this.documentId}`
  }
  async update (fields) {
    const body = Document.fromObject(null, fields)
    return this.collection.store.patch(`${this.collection.url}/${this.documentId}`, { body })
  }
  async set (fields) {
    const body = Document.fromObject(null, fields)
    const response = await this.collection.store.post(`${this.collection.url}?documentId=${this.documentId}`, { body })
    if (response.status === 409) return this.update(fields)
    return response
  }
  async delete () {
    return this.collection.store.delete(this.url)
  }
  async get () {
    const response = await this.collection.store.get(this.url)
    if (response.ok) return Document.fromFields(await response.json()).toObject()
    if (response.status === 404) return undefined
    throw new Error(response.statusText)
  }
}

class Document {
  constructor (documentId, fields) {
    this.name = documentId
    this.fields = fields
  }
  static fromObject (name, data) { return new Document(name, Document.objectToFields(data)) }
  static fromFields (data) { return new Document(data.name, data.fields) }
  toObject () { return Document.fieldsToObject(this.fields) }
  static fieldsToObject (fields) {
    const obj = {}
    const set = (p, v) => {
      let x = obj
      while (p.length > 1) { const k = p.shift(); if (!x[k]) x[k] = {}; x = x[k] }
      x[p[0]] = v
    }
    entries(fields).forEach(([k, v]) => {
      const p = k.split('.')
      if ('stringValue' in v) return set(p, String(v.stringValue))
      if ('booleanValue' in v) return set(p, v.booleanValue !== 'false')
      if ('nullValue' in v) return set(p, null)
      if ('doubleValue' in v) return set(p, Number(v.doubleValue))
      throw new Error(`Unhandled field ${stringify(v)}`)
    })
    return obj
  }
  static objectToFields (obj) {
    const keyPath = []
    const fields = {}
    const set = f => { fields[keyPath.join('.')] = f }
    const toField = obj => {
      for (const k in obj) {
        const v = obj[k]
        keyPath.push(k)
        switch (typeof v) {
          case 'symbol':
          case 'string': set({ 'stringValue': v }); break
          case 'number': set({ 'doubleValue': v }); break
          case 'boolean': set({ 'booleanValue': v }); break
          case 'undefined': set({ 'nullValue': null }); break
          case 'object':
            if (v === null) set({ 'nullValue': null })
            else if (isArray(v)) throw new Error(`Unhandled array field ${v}`)
            else toField(v)
        }
        keyPath.pop(k)
      }
    }
    toField(obj)
    return fields
  }
}

module.exports = new Store('food-diary-220619', '(default)')
