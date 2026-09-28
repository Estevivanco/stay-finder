import { Hono } from 'hono'
import supabase from '../lib/supabase.js'

// Välj bara kolumnerna som finns i Property-typen (inte created_at)
const PROPERTY_COLUMNS = 'property_id, title, description, location, price_per_night, max_guests'

// Det klienten skickar in – id skapas av databasen
type NewProperty = Omit<Property, 'property_id'>

// Samma regler som i databasen: heltal större än 0
function isPositiveInt(value: unknown): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function isValidNewProperty(body: unknown): body is NewProperty {
  if (typeof body !== 'object' || body === null) return false
  const b = body as Record<string, unknown>
  return (
    typeof b.title === 'string' &&
    typeof b.description === 'string' &&
    typeof b.location === 'string' &&
    isPositiveInt(b.price_per_night) &&
    isPositiveInt(b.max_guests)
  )
}

const INVALID_BODY_MESSAGE =
  'Invalid body. Required: title, description, location (string), price_per_night, max_guests (whole number > 0)'

// Postgres-felkod när id:t inte är ett giltigt UUID
const INVALID_UUID = '22P02'

const propertiesRoute = new Hono()

// GET /properties – alla properties
propertiesRoute.get('/', async (c) => {
  const { data, error } = await supabase
    .from('properties')
    .select(PROPERTY_COLUMNS)
    .order('created_at')

  if (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch properties' }, 500)
  }
  return c.json(data as Property[])
})

// GET /properties/:id – en specifik property
propertiesRoute.get('/:id', async (c) => {
  const id = c.req.param('id')
  const { data, error } = await supabase
    .from('properties')
    .select(PROPERTY_COLUMNS)
    .eq('property_id', id)
    .maybeSingle()

  if (error && error.code !== INVALID_UUID) {
    console.error(error)
    return c.json({ error: 'Failed to fetch property' }, 500)
  }
  if (!data) {
    return c.json({ error: `Property with id '${id}' not found` }, 404)
  }
  return c.json(data as Property)
})

// POST /properties – skapa en ny property
propertiesRoute.post('/', async (c) => {
  const body = await c.req.json().catch(() => null)

  if (!isValidNewProperty(body)) {
    return c.json({ error: INVALID_BODY_MESSAGE }, 400)
  }

  const newProperty: NewProperty = {
    title: body.title,
    description: body.description,
    location: body.location,
    price_per_night: body.price_per_night,
    max_guests: body.max_guests
  }

  const { data, error } = await supabase
    .from('properties')
    .insert(newProperty)
    .select(PROPERTY_COLUMNS)
    .single()

  if (error) {
    console.error(error)
    return c.json({ error: 'Failed to create property' }, 500)
  }
  return c.json(data as Property, 201)
})

// Bonus: DELETE /properties/:id – ta bort en property
propertiesRoute.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const { data, error } = await supabase
    .from('properties')
    .delete()
    .eq('property_id', id)
    .select(PROPERTY_COLUMNS)
    .maybeSingle()

  if (error && error.code !== INVALID_UUID) {
    console.error(error)
    return c.json({ error: 'Failed to delete property' }, 500)
  }
  if (!data) {
    return c.json({ error: `Property with id '${id}' not found` }, 404)
  }
  return c.json({ message: 'Property deleted', property: data as Property })
})

// Bonus 2: PUT /properties/:id – uppdatera en property
propertiesRoute.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json().catch(() => null)

  if (!isValidNewProperty(body)) {
    return c.json({ error: INVALID_BODY_MESSAGE }, 400)
  }

  const changes: NewProperty = {
    title: body.title,
    description: body.description,
    location: body.location,
    price_per_night: body.price_per_night,
    max_guests: body.max_guests
  }

  const { data, error } = await supabase
    .from('properties')
    .update(changes)
    .eq('property_id', id)
    .select(PROPERTY_COLUMNS)
    .maybeSingle()

  if (error && error.code !== INVALID_UUID) {
    console.error(error)
    return c.json({ error: 'Failed to update property' }, 500)
  }
  if (!data) {
    return c.json({ error: `Property with id '${id}' not found` }, 404)
  }
  return c.json(data as Property)
})

export default propertiesRoute
