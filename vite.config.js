import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import solidPlugin from "vite-plugin-solid";
import suidPlugin from "@suid/vite-plugin";

export default defineConfig({
  plugins: [solid(), suidPlugin(), solidPlugin()],
  build: {
    target: "esnext",
  },
})
