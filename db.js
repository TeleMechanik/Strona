// db.js
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'se01.creperus.top',
  port: 10211,
  user: 'root_telebim',
  password: 'telebim_123',
  database: 'telebim_baza',
  dateStrings: true
};

let db;

export async function initDB() {
  try {
    db = await mysql.createPool(dbConfig);
    console.log('✅ Połączono z bazą danych MySQL!');
    return db;
  } catch (err) {
    console.error('❌ Błąd połączenia z bazą MySQL:', err);
    process.exit(1);
  }
}

export function getDB() {
  if (!db) throw new Error("Baza danych nie została zainicjalizowana");
  return db;
}