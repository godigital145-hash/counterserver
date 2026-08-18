import { Hono } from 'hono'
import { cors } from 'hono/cors'
import auth from './routes/auth'
import etablissements from './routes/etablissements'
import pairing from './routes/pairing'
import rapports from './routes/rapports'

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST'], allowHeaders: ['Content-Type', 'Authorization'] }))

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route('/auth', auth)
app.route('/etablissements', etablissements)
app.route('/pairing', pairing)
app.route('/rapports', rapports)

export default app
