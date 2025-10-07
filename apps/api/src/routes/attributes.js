const express = require('express')
const router = express.Router()
const pool = require('../config/database')

router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT a.id as attribute_id, a.name as attribute_name,
             av.id as value_id, av.value as value_name
      FROM attributes a
      LEFT JOIN attribute_values av ON av.attribute_id = a.id
      ORDER BY a.name, av.value
    `
    const result = await pool.query(query)
    const rows = result.rows

    // Transformer en structure imbriquée
    const attributesMap = {}
    const attributes = []

    rows.forEach(row => {
      if (!attributesMap[row.attribute_id]) {
        attributesMap[row.attribute_id] = {
          id: row.attribute_id,
          name: row.attribute_name,
          values: []
        }
        attributes.push(attributesMap[row.attribute_id])
      }

      if (row.value_id) {
        attributesMap[row.attribute_id].values.push({
          id: row.value_id,
          value: row.value_name
        })
      }
    })

    res.json({ attributes })
  } catch (error) {
    console.error('Erreur récupération attributs:', error)
    res.status(500).json({ error: 'Erreur lors de la récupération des attributs' })
  }
})

module.exports = router
