import { Hono } from "hono";
import fs from "node:fs/promises";
import bookingValidator from "../validators/bookingValidator.js";

const BOOKINGS_FILE = "src/data/bookings.json";

// Hjälpfunktioner för att läsa/skriva bookings.json (vår "databas")
async function readBookings(): Promise<Booking[]> {
  const data: string = await fs.readFile(BOOKINGS_FILE, "utf8");
  return JSON.parse(data);
}

async function writeBookings(bookings: Booking[]): Promise<void> {
  await fs.writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
}

const bookingApp = new Hono();

// GET /bookings – alla bokningar
bookingApp.get("/", async (c) => {
  try {
    const bookings: Booking[] = await readBookings();

    return c.json(bookings);
  } catch (error) {
    return c.json([]);
  }
});

// POST /bookings – skapa en ny bokning
bookingApp.post("/", bookingValidator, async (c) => {
  try {
    const booking: NewBooking = c.req.valid("json");

    // Validatorn har redan satt booking_id och status om de saknades
    const bookings: Booking[] = await readBookings();
    bookings.push(booking as Booking);
    await writeBookings(bookings);

    return c.json(booking, 201);
  } catch (error) {
    console.error(error);

    return c.json(
      {
        error: "Failed to create booking"
      },
      400
    );
  }
});

// PUT /bookings/:id – ersätt en befintlig bokning
bookingApp.put("/:id", bookingValidator, async (c) => {
  try {
    const id = c.req.param("id");
    const body = c.req.valid("json") as Booking;

    const bookings: Booking[] = await readBookings();
    const index = bookings.findIndex((b) => b.booking_id === id);

    if (index === -1) {
      return c.json({ error: `Booking with id '${id}' not found` }, 404);
    }

    // id:t från URL:en styr alltid vilken bokning som uppdateras
    const updatedBooking: Booking = {
      ...body,
      booking_id: id
    };

    bookings[index] = updatedBooking;
    await writeBookings(bookings);

    return c.json(updatedBooking);
  } catch (error) {
    console.error(error);

    return c.json({ error: "Failed to update booking" }, 400);
  }
});

// DELETE /bookings/:id – ta bort en bokning
bookingApp.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");

    const bookings: Booking[] = await readBookings();
    const index = bookings.findIndex((b) => b.booking_id === id);

    if (index === -1) {
      return c.json({ error: `Booking with id '${id}' not found` }, 404);
    }

    const [deleted] = bookings.splice(index, 1);
    await writeBookings(bookings);

    return c.json({ message: "Booking deleted", booking: deleted });
  } catch (error) {
    console.error(error);

    return c.json({ error: "Failed to delete booking" }, 500);
  }
});

export default bookingApp;
