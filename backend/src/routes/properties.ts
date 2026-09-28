import { Hono } from 'hono'
import propertiesData from '../data/properties.json' with { type: 'json' }

// Simulerad databas: en array i minnet (återställs när servern startas om)
const properties: Property[] = [...propertiesData]

// Det klienten skickar in – id skapas av backend
type NewProperty = Omit<Property, 'property_id'>

function isValidNewProperty(body: unknown): body is NewProperty {
  if (typeof body !== 'object' || body === null) return false
  const b = body as Record<string, unknown>
  return (
    typeof b.title === 'string' &&
    typeof b.description === 'string' &&
    typeof b.location === 'string' &&
    typeof b.price_per_night === 'number' &&
    typeof b.max_guests === 'number'
  )
}

const propertiesRoute = new Hono()

// GET /properties – alla properties
propertiesRoute.get('/', (c) => {
  return c.json(properties)
})

// GET /properties/:id – en specifik property
propertiesRoute.get('/:id', (c) => {
  const id = c.req.param('id')
  const property = properties.find((p) => p.property_id === id)

  if (!property) {
    return c.json({ error: `Property with id '${id}' not found` }, 404)
  }
  return c.json(property)
})

// POST /properties – skapa en ny property
propertiesRoute.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)

  if (!isValidNewProperty(body)) {
    return c.json(
      { error: 'Invalid body. Required: title, description, location (string), price_per_night, max_guests (number)' },
      400
    )
  }

  const newProperty: Property = {
    property_id: crypto.randomUUID(),
    title: body.title,
    description: body.description,
    location: body.location,
    price_per_night: body.price_per_night,
    max_guests: body.max_guests
  }

  properties.push(newProperty)
  return c.json(newProperty, 201)
})

// Bonus: DELETE /properties/:id – ta bort en property
propertiesRoute.delete('/:id', (c) => {
  const id = c.req.param('id')
  const index = properties.findIndex((p) => p.property_id === id)

  if (index === -1) {
    return c.json({ error: `Property with id '${id}' not found` }, 404)
  }

  const [deleted] = properties.splice(index, 1)
  return c.json({ message: 'Property deleted', property: deleted })
})

// Bonus 2: PUT /properties/:id – uppdatera en property
propertiesRoute.put('/:id', async (c) => {
  const id = c.req.param('id')
  const index = properties.findIndex((p) => p.property_id === id)

  if (index === -1) {
    return c.json({ error: `Property with id '${id}' not found` }, 404)
  }

  const body = await c.req.json().catch(() => null)

  if (!isValidNewProperty(body)) {
    return c.json(
      { error: 'Invalid body. Required: title, description, location (string), price_per_night, max_guests (number)' },
      400
    )
  }

  const updated: Property = {
    property_id: id,
    title: body.title,
    description: body.description,
    location: body.location,
    price_per_night: body.price_per_night,
    max_guests: body.max_guests
  }

  properties[index] = updated
  return c.json(updated)
})

export default propertiesRoute
