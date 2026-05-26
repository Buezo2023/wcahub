import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, writeFileSync } from 'fs'

// Plugin: inject build timestamp into sw.js so each deploy busts the SW cache
function injectSwVersion() {
  return {
    name: 'inject-sw-version',
    closeBundle() {
      const buildId = Date.now().toString(36); // short unique ID per build
      const swPath = 'dist/sw.js';
      try {
        let sw = readFileSync(swPath, 'utf8');
        sw = sw.replace("self.__WCA_BUILD_ID__ || 'wca-v1'", `'${buildId}'`);
        writeFileSync(swPath, sw);
        console.log(`✓ SW cache version: wca-hub-${buildId}`);
      } catch(e) {
        // sw.js might not be in dist — it's in public/, Vite copies it automatically
      }
    }
  };
}

export default defineConfig({
  plugins: [react(), injectSwVersion()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
  }
})
