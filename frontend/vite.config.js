import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// HTTPS in dev is required for geolocation when testing on a phone over the
// LAN (a bare http://192.168.x.x origin is not a secure context).
//
// NO_HTTPS=1 turns it off for automated checks: plain http://localhost IS a
// secure context, so geolocation still works, and there is no self-signed
// certificate for the browser to object to.
const https = process.env.NO_HTTPS !== '1'

export default defineConfig({
  plugins: [react(), ...(https ? [basicSsl()] : [])],
  server: { https },
  preview: { https },
})
