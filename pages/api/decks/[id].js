import { readDecks, writeDecks } from '../../../db/client'

export default function handler(req, res) {
  const { id } = req.query
  const decks = readDecks()
  const idx = decks.findIndex(d => d.id === id)

  if (req.method === 'GET') {
    if (idx === -1) return res.status(404).end()
    return res.status(200).json(decks[idx])
  }

  if (req.method === 'DELETE') {
    if (idx === -1) return res.status(404).end()
    decks.splice(idx, 1)
    writeDecks(decks)
    return res.status(204).end()
  }

  res.setHeader('Allow', 'GET, DELETE')
  res.status(405).end('Method Not Allowed')
}
