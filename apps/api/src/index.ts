import { serve } from '@hono/node-server';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import type { Server as HTTPServer } from 'node:http';
import { Server } from 'socket.io';
import admins from './application/routes/adminRoute.js';
import events from './application/routes/eventRoute.js';
import login from './application/routes/loginRoute.js';
import logout from './application/routes/logoutRoute.js';
import members from './application/routes/memberRoute.js';
import refresh from './application/routes/refreshRoute.js';
import reservations from './application/routes/reservationRoute.js';

const app = new OpenAPIHono();
const api = app.basePath('/api/v1');

app.use('*', async (c, next) => {
  await next();
  console.log(`${c.req.method} ${c.req.url} ${c.res.status}`);
});

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

api.openAPIRegistry.registerComponent('securitySchemes', 'JWT', {
  type: 'http',
  in: 'header',
  scheme: 'bearer',
  description: 'JWT Access Token',
});

api.use(
  '*',
  cors({
    origin: 'http://localhost:3000',
    allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests'],
    allowMethods: ['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision', 'Content-Type'],
    maxAge: 600,
    credentials: true,
  }),
);

export const routes = api
  .route('/members', members)
  .route('/admins', admins)
  .route('/events', events)
  .route('/reservations', reservations)
  .route('/login', login)
  .route('/refresh', refresh)
  .route('/logout', logout);

api.doc('/docs', {
  openapi: '3.0.0',
  info: {
    title: 'TEMS API',
    version: process.env.npm_package_version!,
  },
});
api.get('/docs/ui', swaggerUI({ url: '/api/v1/docs' }));

const port = 3001;
console.log(`Server is running on http://localhost:${port}`);

const server = serve({
  fetch: app.fetch,
  port,
});

export const io = new Server(server as HTTPServer, {
  cors: {
    origin: [
      'http://localhost:3000',
      'https://tems.ozasa.dev',
      'https://tems-dev.ozasa.dev',
    ],
  },
});

io.on('connection', (socket) => {
  console.log('a user connected');
  console.log('id:', socket.id);

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});
