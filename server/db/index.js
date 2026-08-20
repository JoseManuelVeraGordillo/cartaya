import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';
import { crearEsquema, migrarEstadoPedidos } from './schema.js';
import { sembrarDatosDesarrollo } from './seed.js';

const DATA_DIR = process.env.CARTAYA_DATA_DIR
  ? path.resolve(process.env.CARTAYA_DATA_DIR)
  : path.resolve(import.meta.dirname, '..', '..', 'data');

fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'cartaya.db');

export function abrirConexion(dbPath = DB_PATH) {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

export const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

export const db = abrirConexion();
crearEsquema(db);
migrarEstadoPedidos(db);
sembrarDatosDesarrollo(db);
