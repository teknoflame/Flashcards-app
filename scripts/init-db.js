import fs from 'fs'
import path from 'path'

const DB_DIR = path.join(process.cwd(), 'data')
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true })
const DECKS_FILE = path.join(DB_DIR, 'decks.json')
if (!fs.existsSync(DECKS_FILE)) fs.writeFileSync(DECKS_FILE, '[]', 'utf-8')
console.log('Initialized JSON data store at', DECKS_FILE)
