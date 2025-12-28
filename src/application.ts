import Fastify from 'fastify'
import AutoLoad from '@fastify/autoload'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { connectDB } from './modules/config/db.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function buildApp() {
  const app = Fastify({ logger: true })
  await connectDB()

  await app.register(AutoLoad, {
    dir: path.join(__dirname, 'plugins'),
  })

  await app.register(AutoLoad, {
    dir: path.join(__dirname, 'modules'),
    matchFilter: (p) => p.endsWith('.routes.ts'),
    options: { prefix: '/api/v1' },
  })

  app.ready(() => {
    console.log(app.printRoutes())
  })

  return app
}