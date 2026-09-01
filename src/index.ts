import { Hono } from 'hono'
import { cors } from 'hono/cors'
import auth from './routes/auth'
import etablissements from './routes/etablissements'
import pairing from './routes/pairing'
import rapports from './routes/rapports'
import employesDevice from './routes/employesDevice'
import produitsDevice from './routes/produitsDevice'
import deviceUnpair from './routes/deviceUnpair'
import pushTokens from './routes/pushTokens'
import { traiterRapportsQueue, RapportQueueMessage } from './queue/rapportsConsumer'

const app = new Hono<{ Bindings: CloudflareBindings }>()

app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'PATCH', 'DELETE'], allowHeaders: ['Content-Type', 'Authorization'] }))

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

app.route('/auth', auth)
app.route('/etablissements', etablissements)
app.route('/pairing', pairing)
app.route('/rapports', rapports)
app.route('/device/employes', employesDevice)
app.route('/device/produits', produitsDevice)
app.route('/device/unpair', deviceUnpair)
app.route('/patron/push-tokens', pushTokens)

export default {
  fetch: app.fetch,
  queue: traiterRapportsQueue,
} satisfies ExportedHandler<CloudflareBindings, RapportQueueMessage>
