// db.js
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'host',
  port: 10211,
  user: 'login',
  password: 'haslo',
  database: 'baza',
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
