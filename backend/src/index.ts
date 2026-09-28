import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { env } from "./env.js";
import propertyApp from "./routes/property.js";
import bookingApp from "./routes/bookings.js";

const app = new Hono({
  strict: false
});

app.get("/", (c) => {
  return c.text("StayFinder API");
});

// Används av frontend (page.tsx)
app.get("/api/message", (c) => {
  return c.json({
    message: "Hello from Hono",
    source: "hono"
  });
});

app.route("/properties", propertyApp);
app.route("/bookings", bookingApp);

serve(
  {
    fetch: app.fetch,
    port: env.honoPort
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
