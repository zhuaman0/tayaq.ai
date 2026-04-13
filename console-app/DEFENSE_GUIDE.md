# Defense Guide — INF 395 Assignment 2

## Как запустить

```bash
cd ~/Desktop/tayaqai
npm run console
```

---

## Меню приложения

```
1. Create new lesson
2. Update lesson status (advance stage)
3. View lesson by ID
4. Search lessons by status
5. List all lessons
6. Exit
```

---

## Все функции детально

### 1. Create new lesson

Создает новый урок. Спросит имя студента и тему.

```
Choose an option [1-6]: 1
Student name: Aisulu
Lesson topic: Past Simple Tense
```

**Результат:** Создается урок с ID `L-1001`, статус `Created`, timestamp записывается.

**Что происходит внутри:**
- Генерируется уникальный ID (L-1001, L-1002, ...)
- Статус ставится `Created`
- Записывается timestamp создания
- Данные СРАЗУ сохраняются в `db.json` (writeFileSync)
- Урок кладется в кэш (в память)
- В `log.txt` пишется запись: `[ACTION] Created lesson L-1001`

---

### 2. Update lesson status

Переводит урок на следующую стадию.

```
Choose an option [1-6]: 2
Enter lesson ID (e.g. L-1001): L-1001
```

Покажет текущий статус и подскажет следующий:

```
Current status: Created
Next valid stage: InProgress
Enter target status (or type "InProgress" to advance): InProgress
```

**3 стадии по порядку:**
```
Created  -->  InProgress  -->  Completed
```

**Правила:**
- Можно ТОЛЬКО вперед на 1 шаг (Created -> InProgress -> Completed)
- Нельзя перепрыгнуть (Created -> Completed = ОШИБКА)
- Нельзя назад (InProgress -> Created = ОШИБКА)
- Completed = финальная стадия, ничего менять нельзя

**Что происходит внутри:**
- stateMachine.js проверяет можно ли перейти
- Если нельзя — красная ошибка, ничего не меняется
- Если можно — обновляет статус, ставит timestamp
- СРАЗУ пишет в db.json (writeFileSync — поэтому crash test проходит!)
- Обновляет кэш
- В log.txt: `[TRANSITION] L-1001 status changed from Created to InProgress`

---

### 3. View lesson by ID

Показывает детали урока. ЭТО ГЛАВНАЯ ФУНКЦИЯ ДЛЯ CACHE TEST.

```
Choose an option [1-6]: 3
Enter lesson ID (e.g. L-1001): L-1001
```

**Что увидите:**
```
+--- Lesson Details --------------------+
  ID:           L-1001
  Student:      Aisulu
  Topic:        Past Simple Tense
  Status:       InProgress
  Created:      2026-04-07T09:44:39.930Z
  In Progress:  2026-04-07T09:45:50.588Z
  Completed:    —
+---------------------------------------+
```

**Кэш логика (ВАЖНО для защиты):**
- Если урок НЕ в кэше (первый раз или после рестарта): `[CACHE_MISS] loaded from file`
- Если урок УЖЕ в кэше (второй раз): `[CACHE_HIT] loaded from cache`

---

### 4. Search lessons by status

Фильтрует уроки по статусу.

```
Choose an option [1-6]: 4
Available statuses: Created, InProgress, Completed
Enter status to filter by: Created
```

Покажет таблицу всех уроков с этим статусом.

---

### 5. List all lessons

Показывает все уроки в виде таблицы.

```
Choose an option [1-6]: 5

Total lessons: 3
  ID        | Student          | Topic                    | Status
  ----------|------------------|--------------------------|------------
  L-1001    | Aisulu           | Past Simple Tense        | InProgress
  L-1002    | Bolat            | Present Perfect          | Created
  L-1003    | Dana             | Conditionals             | Completed
```

---

### 6. Exit

Выходит из программы. Логирует выход в log.txt.

---

## Сценарий защиты (делайте ИМЕННО ТАК)

### ПЕРЕД ЗАЩИТОЙ — очистить старые данные:

```bash
rm -f console-app/db.json console-app/log.txt
```

---

### Шаг 1: Запуск + создание урока

```bash
npm run console
```

Выбираем `1`, создаем урок:
```
Student name: Aisulu
Lesson topic: Past Simple Tense
```

Увидим: `[ACTION] Created lesson L-1001`

---

### Шаг 2: CACHE TEST

Выбираем `3`, вводим `L-1001`:
```
[CACHE_HIT] Lesson L-1001 loaded from cache
```
(HIT потому что урок попал в кэш при создании)

Теперь выходим из программы: `6`

Запускаем заново:
```bash
npm run console
```

Выбираем `3`, вводим `L-1001`:
```
[CACHE_MISS] Lesson L-1001 loaded from file
```
(MISS потому что кэш пустой после рестарта — загрузка из файла!)

Выбираем `3`, вводим `L-1001` СНОВА:
```
[CACHE_HIT] Lesson L-1001 loaded from cache
```
(HIT — теперь уже из кэша!)

**Говорим преподавателю:** "Первый запрос после рестарта — CACHE MISS, из файла. Второй запрос — CACHE HIT, из памяти. Это доказывает что кэш работает."

---

### Шаг 3: LOGIC TEST

Выбираем `2`, вводим `L-1001`:
```
Current status: Created
Next valid stage: InProgress
Enter target status: Completed
```

Увидим КРАСНУЮ ошибку:
```
ERROR: Illegal transition from "Created" to "Completed".
Next valid stage is "InProgress".
```

**Говорим преподавателю:** "Мы попытались перепрыгнуть с Created на Completed — система заблокировала. Можно только Created -> InProgress -> Completed по порядку."

Теперь вводим правильно:
```
Choose an option [1-6]: 2
Enter lesson ID: L-1001
Enter target status: InProgress
```

Увидим: `Lesson L-1001 advanced to InProgress!`

---

### Шаг 4: CRASH TEST

Урок L-1001 сейчас в статусе `InProgress`.

**УБИВАЕМ ПРОГРАММУ:** нажимаем `Ctrl + C`

Программа мертва. Запускаем заново:
```bash
npm run console
```

Выбираем `3`, вводим `L-1001`:
```
[CACHE_MISS] Lesson L-1001 loaded from file

Status: InProgress   <-- ДАННЫЕ ВЫЖИЛИ!
```

**Говорим преподавателю:** "Мы убили программу после перехода в InProgress. После рестарта данные на месте — потому что мы используем writeFileSync(), который записывает синхронно до того как программа может упасть."

---

### Шаг 5: Показать log.txt (бонус)

```bash
cat console-app/log.txt
```

Покажет все действия с timestamps:
```
[2026-04-07T...] ACTION: Created lesson L-1001
[2026-04-07T...] CACHE_HIT: Lesson L-1001 loaded from cache
[2026-04-07T...] ACTION: Application started
[2026-04-07T...] CACHE_MISS: Lesson L-1001 loaded from file
[2026-04-07T...] CACHE_HIT: Lesson L-1001 loaded from cache
[2026-04-07T...] ERROR: Illegal transition...
[2026-04-07T...] TRANSITION: L-1001 Created to InProgress
```

**Говорим преподавателю:** "Каждое действие записывается в лог с timestamp. Используем appendFileSync — лог тоже переживает crash."

---

## Файлы которые создаются при работе

| Файл | Что это | Когда создается |
|------|---------|-----------------|
| `console-app/db.json` | "База данных" — все уроки в JSON | При первом создании урока |
| `console-app/log.txt` | Лог всех действий с timestamps | При первом действии |

---

## Если преподаватель спросит про CIA Triad

**Confidentiality (Конфиденциальность):**
"Данные хранятся локально в db.json, не передаются по сети, нет внешних API для хранения."

**Integrity (Целостность):**
"State machine не дает делать нелегальные переходы. Timestamps создают audit trail — видно когда что менялось. log.txt — append-only, нельзя незаметно изменить."

**Availability (Доступность):**
"writeFileSync гарантирует crash recovery. Кэш ускоряет повторные запросы. Нет зависимости от внешней БД — работает на любой машине с Node.js."

---

## Если что-то пошло не так

**Урок не найден:** проверь ID (L-1001, не l-1001 — регистр важен)

**db.json пустой/битый:** удали его и начни заново: `rm console-app/db.json`

**npm run console не работает:** убедись что стоишь в папке `tayaqai`: `cd ~/Desktop/tayaqai`
