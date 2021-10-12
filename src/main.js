import './dotenv.js';
import Koa from 'koa';
import Pug from 'koa-pug';
import route from 'koa-route';
import serve from 'koa-static';
import mount from 'koa-mount';
import path from 'path';
import { fileURLToPath } from 'url';
import websockify from 'koa-websocket';
import mongoClient from './mongo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = websockify(new Koa());
const pug = new Pug({
  viewPath: path.resolve(__dirname, './views'),
  app,
});

app.use(mount('/public', serve(__dirname + '/public')));

app.use(async (ctx) => {
  await ctx.render('main');
});

const _client = mongoClient.connect();

async function getChatsCollection() {
  const client = await _client;
  return client.db('koaChat').collection('chats');
}

// Using routes
app.ws.use(
  route.all('/ws', async (ctx) => {
    const chatsCollection = await getChatsCollection();
    const chatsCursor = chatsCollection.find(
      {},
      {
        sort: {
          createdAt: 1,
        },
      }
    );

    const chats = await chatsCursor.toArray();

    ctx.websocket.send(
      JSON.stringify({
        type: 'sync',
        payload: {
          chats,
        },
      })
    );

    ctx.websocket.on('message', async (data) => {
      const chat = JSON.parse(data);

      await chatsCollection.insertOne({
        ...chat,
        createdAt: new Date(),
      });

      const { nickname, message } = chat;

      const { server } = app.ws;

      if (!server) {
        return;
      }

      server.clients.forEach((client) => {
        client.send(
          JSON.stringify({
            type: 'chat',
            payload: {
              nickname,
              message,
            },
          })
        );
      });
    });
  })
);

app.listen(process.env.PORT);
