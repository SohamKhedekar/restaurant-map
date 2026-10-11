import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  // HTTPS in dev is required for geolocation when testing on a phone over the
  // LAN (a bare http://192.168.x.x origin is not a secure context).
  plugins: [react(), basicSsl()],
  server: {
    https: true,
  },
})
