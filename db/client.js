import fs from 'fs'
import path from 'path'

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
const DECKS_FILE = path.join(DATA_DIR, 'decks.json')

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
if (!fs.existsSync(DECKS_FILE)) fs.writeFileSync(DECKS_FILE, '[]', 'utf-8')

export function readDecks() {
	const raw = fs.readFileSync(DECKS_FILE, 'utf-8')
	try { return JSON.parse(raw) } catch (e) { return [] }
}

export function writeDecks(decks) {
	fs.writeFileSync(DECKS_FILE, JSON.stringify(decks, null, 2), 'utf-8')
}
