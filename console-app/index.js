import readline from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { STAGES, TRANSITIONS } from './stateMachine.js';
import { createLesson, getLesson, updateLessonStatus, getAllLessons, searchByStatus } from './lessonStore.js';
import { log } from './logger.js';

const rl = readline.createInterface({ input: stdin, output: stdout });

// ==================== DISPLAY HELPERS ====================

function printBanner() {
  console.log('\x1b[31m');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║     🔥 Tayaq.ai - English Lesson Manager     ║');
  console.log('║     INF 395: Resilient Service Prototype      ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('\x1b[0m');
}

function printMenu() {
  console.log('\n\x1b[36m--- MAIN MENU ---\x1b[0m');
  console.log('  1. Create new lesson');
  console.log('  2. Update lesson status (advance stage)');
  console.log('  3. View lesson by ID');
  console.log('  4. Search lessons by status');
  console.log('  5. List all lessons');
  console.log('  6. Exit');
  console.log('');
}

function printLesson(lesson) {
  console.log('\n\x1b[33m┌─── Lesson Details ───────────────────────┐\x1b[0m');
  console.log(`  ID:           ${lesson.id}`);
  console.log(`  Student:      ${lesson.studentName}`);
  console.log(`  Topic:        ${lesson.topic}`);
  console.log(`  Status:       ${formatStatus(lesson.status)}`);
  console.log(`  Created:      ${lesson.timestamps.created || '—'}`);
  console.log(`  In Progress:  ${lesson.timestamps.inProgress || '—'}`);
  console.log(`  Completed:    ${lesson.timestamps.completed || '—'}`);
  console.log('\x1b[33m└──────────────────────────────────────────┘\x1b[0m');
}

function formatStatus(status) {
  const colors = {
    Created: '\x1b[34mCreated\x1b[0m',
    InProgress: '\x1b[33mInProgress\x1b[0m',
    Completed: '\x1b[32mCompleted\x1b[0m',
  };
  return colors[status] || status;
}

function printTable(lessons) {
  if (lessons.length === 0) {
    console.log('\n  (No lessons found)');
    return;
  }
  console.log('\n  ID        | Student          | Topic                    | Status');
  console.log('  ----------|------------------|--------------------------|------------');
  for (const l of lessons) {
    const id = l.id.padEnd(9);
    const student = l.studentName.padEnd(16);
    const topic = l.topic.substring(0, 24).padEnd(24);
    console.log(`  ${id} | ${student} | ${topic} | ${formatStatus(l.status)}`);
  }
}

// ==================== MENU HANDLERS ====================

async function handleCreate() {
  const studentName = await rl.question('  Student name: ');
  if (!studentName.trim()) {
    console.log('\x1b[31m  Error: Student name cannot be empty.\x1b[0m');
    return;
  }
  const topic = await rl.question('  Lesson topic: ');
  if (!topic.trim()) {
    console.log('\x1b[31m  Error: Topic cannot be empty.\x1b[0m');
    return;
  }

  const lesson = createLesson(studentName.trim(), topic.trim());
  console.log(`\n\x1b[32m  ✅ Lesson ${lesson.id} created successfully!\x1b[0m`);
  printLesson(lesson);
}

async function handleUpdateStatus() {
  const id = await rl.question('  Enter lesson ID (e.g. L-1001): ');

  const lesson = getLesson(id.trim());
  if (!lesson) {
    console.log(`\x1b[31m  Error: Lesson "${id}" not found.\x1b[0m`);
    return;
  }

  console.log(`\n  Current status: ${formatStatus(lesson.status)}`);

  if (lesson.status === 'Completed') {
    console.log('\x1b[31m  ⛔ This lesson is in the final stage and cannot be modified.\x1b[0m');
    return;
  }

  const nextStage = TRANSITIONS[lesson.status];
  console.log(`  Next valid stage: \x1b[33m${nextStage}\x1b[0m`);

  const target = await rl.question(`  Enter target status (or type "${nextStage}" to advance): `);

  try {
    const updated = updateLessonStatus(id.trim(), target.trim());
    console.log(`\n\x1b[32m  ✅ Lesson ${updated.id} advanced to ${updated.status}!\x1b[0m`);
    printLesson(updated);
  } catch (err) {
    log('ERROR', `${err.message} (lesson: ${id.trim()})`);
    console.log(`\x1b[31m  ⛔ ${err.message}\x1b[0m`);
  }
}

async function handleViewById() {
  const id = await rl.question('  Enter lesson ID (e.g. L-1001): ');

  const lesson = getLesson(id.trim());
  if (!lesson) {
    console.log(`\x1b[31m  Error: Lesson "${id}" not found.\x1b[0m`);
    return;
  }

  printLesson(lesson);
}

async function handleSearchByStatus() {
  console.log(`  Available statuses: ${STAGES.join(', ')}`);
  const status = await rl.question('  Enter status to filter by: ');

  if (!STAGES.includes(status.trim())) {
    console.log(`\x1b[31m  Error: Unknown status "${status}". Use: ${STAGES.join(', ')}\x1b[0m`);
    return;
  }

  const results = searchByStatus(status.trim());
  printTable(results);
}

async function handleListAll() {
  const lessons = getAllLessons();
  console.log(`\n  Total lessons: ${lessons.length}`);
  printTable(lessons);
}

// ==================== MAIN LOOP ====================

async function main() {
  printBanner();
  log('ACTION', 'Application started');

  while (true) {
    printMenu();
    const choice = await rl.question('  Choose an option [1-6]: ');

    switch (choice.trim()) {
      case '1':
        await handleCreate();
        break;
      case '2':
        await handleUpdateStatus();
        break;
      case '3':
        await handleViewById();
        break;
      case '4':
        await handleSearchByStatus();
        break;
      case '5':
        await handleListAll();
        break;
      case '6':
        log('ACTION', 'Application exited by user');
        console.log('\n\x1b[36m  👋 Goodbye! Keep learning English! 🔥\x1b[0m\n');
        rl.close();
        process.exit(0);
      default:
        console.log('\x1b[31m  Invalid option. Please enter a number 1-6.\x1b[0m');
    }
  }
}

main();
