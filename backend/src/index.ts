import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import propertiesRoute from './routes/properties.js'
import bookingApp from './routes/bookings.js'

type MessageResponse = {
  message: string
  source: string
}

const app = new Hono()

app.get('/', (c) => {
  return c.text('StayFinder API')
})

app.get("/api/message", (c) => {
  const response: MessageResponse = {
    message: "Hello from Hono",
    source: "hono"
  }
  return c.json(response)
})

app.route('/properties', propertiesRoute)
app.route('/bookings', bookingApp)

serve({
  fetch: app.fetch,
  port: 4000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
