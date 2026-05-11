import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

app.listen(env.PORT, env.API_HOST, () => {
  console.log(`[API] Luistert op ${env.API_HOST}:${env.PORT}`);
  console.log(`[API] Lokaal: http://localhost:${env.PORT}`);
  if (env.API_HOST === "0.0.0.0" || env.API_HOST === "::") {
    console.log(`[API] Netwerk: http://<server-ip>:${env.PORT}`);
  } else {
    console.log(`[API] Netwerk: http://${env.API_HOST}:${env.PORT}`);
  }
});
