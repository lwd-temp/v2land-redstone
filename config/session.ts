/**
 * Session Configuration
 * (sails.config.session)
 *
 * Sails session integration leans heavily on the great work already done by
 * Express, but also unifies Socket.io with the Connect session store. It uses
 * Connect's cookie parser to normalize configuration differences between Express
 * and Socket.io and hooks into Sails' middleware interpreter to allow you to access
 * and auto-save to `req.session` with Socket.io the same way you would with Express.
 *
 * For more information on configuring the session, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.session.html
 */

import parseDomain from 'parse-domain';
import globals from './globals';
import { sequelize } from '@Models';

import { classicRedis } from '@Services/RedisService';
import sessionRedis from 'connect-redis';

import expressSession from 'express-session';
import sessionSequelize from 'connect-session-sequelize';

let sessionStore: () => expressSession.Store;

const url = parseDomain(globals.api);
const cookie = {
  domain: ((process.env.NODE_ENV === 'production' || process.env.CUSTOM_DOMAIN) && url)
    ? ('.' + url.domain + '.' + url.tld)
    : null,
  secure: typeof process.env.SECURE_COOKIE !== 'undefined'
    ? process.env.SECURE_COOKIE === 'true'
    : process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const sessionConfig = {
  secret: process.env.SESSION_SECRET || '970a14748cf639a4aa3d7b0d60cc9cac',
  resave: false,
  saveUninitialized: true,
  unset: 'destroy' as 'destroy',
  name: 'redstone.sid',
  proxy: true,
  cookie,
};

if (process.env.REDIS_HOST) {
  const RedisStore = sessionRedis(expressSession);
  sessionStore = () => new RedisStore({
    client: classicRedis,
    prefix: 'sess:',
    ttl: 86400 * 7,
  });

  console.info('Using Redis as session storage.');
} else {
  const SequelizeStore = sessionSequelize(expressSession.Store);
  sessionStore = () => new SequelizeStore({ db: sequelize });

  console.info('Using PostgreSQL as session storage. One service instance at most.');
}

export { cookie, sessionConfig, sessionStore };
export default { cookie, sessionConfig, sessionStore };
