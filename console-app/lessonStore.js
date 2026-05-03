import fs from 'node:fs';
import path from 'node:path';
import { validateTransition, TRANSITIONS } from './stateMachine.js';
import { log } from './logger.js';

const DB_FILE = path.join(import.meta.dirname, 'db.json');

// ==================== CACHE ====================
// Simple in-memory dictionary cache (resets on restart)
let cache = {};

// ==================== FILE I/O ====================

function loadDb() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    // File doesn't exist or is corrupt — return default
    return { nextId: 1001, lessons: {} };
  }
}

function saveDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ==================== CRUD OPERATIONS ====================

/**
 * Create a new lesson.
 * @param {string} studentName
 * @param {string} topic
 * @returns {object} the created lesson
 */
export function createLesson(studentName, topic) {
  const db = loadDb();
  const id = `L-${db.nextId}`;

  const lesson = {
    id,
    studentName,
    topic,
    status: 'Created',
    timestamps: {
      created: new Date().toISOString(),
      inProgress: null,
      completed: null,
    },
  };

  db.lessons[id] = lesson;
  db.nextId++;
  saveDb(db);

  // Also put in cache
  cache[id] = { ...lesson };

  log('ACTION', `Created lesson ${id} (student: ${studentName}, topic: ${topic})`);
  return lesson;
}

/**
 * Get a lesson by ID (cache-aware).
 * First request = from file (CACHE MISS), second = from cache (CACHE HIT).
 * @param {string} id
 * @returns {object|null}
 */
export function getLesson(id) {
  // Check cache first
  if (cache[id]) {
    log('CACHE_HIT', `Lesson ${id} loaded from cache`);
    return cache[id];
  }

  // Cache miss — load from file
  const db = loadDb();
  const lesson = db.lessons[id] || null;

  if (lesson) {
    cache[id] = { ...lesson }; // Store in cache for next time
    log('CACHE_MISS', `Lesson ${id} loaded from file`);
  } else {
    log('ERROR', `Lesson ${id} not found`);
  }

  return lesson;
}

/**
 * Update lesson status (advance to next stage).
 * @param {string} id
 * @param {string} targetStatus
 * @returns {object} updated lesson
 */
export function updateLessonStatus(id, targetStatus) {
  const db = loadDb();
  const lesson = db.lessons[id];

  if (!lesson) {
    throw new Error(`Lesson ${id} not found.`);
  }

  // Validate the transition (throws if invalid)
  validateTransition(lesson.status, targetStatus);

  const oldStatus = lesson.status;
  lesson.status = targetStatus;

  // Set timestamp for the new stage
  const timestampKey = targetStatus === 'InProgress' ? 'inProgress' : 'completed';
  lesson.timestamps[timestampKey] = new Date().toISOString();

  // Immediately save to file (writeFileSync = crash-safe)
  db.lessons[id] = lesson;
  saveDb(db);

  // Update cache
  cache[id] = { ...lesson };

  log('TRANSITION', `Lesson ${id} status changed from ${oldStatus} to ${targetStatus}`);
  return lesson;
}

/**
 * Get all lessons from the database.
 * @returns {object[]}
 */
export function getAllLessons() {
  const db = loadDb();
  return Object.values(db.lessons);
}

/**
 * Search/filter lessons by status.
 * @param {string} status
 * @returns {object[]}
 */
export function searchByStatus(status) {
  const db = loadDb();
  const results = Object.values(db.lessons).filter(l => l.status === status);
  log('SEARCH', `Filtered lessons by status=${status}, found ${results.length} results`);
  return results;
}
