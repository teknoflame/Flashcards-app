import { readDecks, writeDecks } from '../../db/client'
import { v4 as uuidv4 } from 'uuid'

export default function handler(req, res) {
  if (req.method === 'GET') {
    const rows = readDecks()
    return res.status(200).json(rows)
  }

  if (req.method === 'POST') {
    const { name, category, folderId, cards } = req.body
    const id = uuidv4()
    const createdAt = Date.now()
    const decks = readDecks()
    decks.push({ id, name, category, folderId: folderId || null, cards: cards || [], createdAt })
    writeDecks(decks)
    return res.status(201).json({ id })
  }

  res.setHeader('Allow', 'GET, POST')
  res.status(405).end('Method Not Allowed')
}
