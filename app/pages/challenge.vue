<template>
  <div class="min-h-screen pb-24">
    <!-- Header -->
    <div class="pt-24 pb-8 px-4 sm:px-6 max-w-3xl mx-auto text-center">
      <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-amber/10 border border-accent-amber/20 text-accent-amber text-sm font-medium mb-5">
        <span class="w-2 h-2 rounded-full bg-accent-amber animate-pulse" />
        Daily Challenge · {{ todayLabel }}
      </div>
      <h1 class="font-display font-black text-4xl sm:text-5xl text-white mb-3">
        {{ alreadyDoneToday ? 'Challenge Complete! 🔥' : "Today's Challenge" }}
      </h1>
      <p class="text-gray-400 text-sm">{{ questions.length }} questions · Resets every day at midnight · Come back tomorrow for a new one</p>
    </div>

    <!-- Already done today -->
    <div v-if="alreadyDoneToday && !retrying" class="px-4 sm:px-6 max-w-2xl mx-auto text-center py-8">
      <div class="glass-card p-8 space-y-4">
        <div class="text-6xl">🏆</div>
        <h2 class="font-display font-black text-3xl text-white">You scored {{ savedScore }} / {{ questions.length }}</h2>
        <p class="text-gray-400">{{ savedScore === questions.length ? 'Perfect score! Tayaq.ai is shocked.' : savedScore >= 4 ? 'Strong performance. Almost perfect.' : 'Come back tomorrow and try to do better.' }}</p>
        <div class="flex gap-2 justify-center flex-wrap mt-2">
          <div
            v-for="(q, i) in questions"
            :key="i"
            class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border"
            :class="savedAnswers[i] === q.correct ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-accent-red/10 border-accent-red/30 text-accent-red'"
          >
            {{ savedAnswers[i] === q.correct ? '✓' : '✗' }}
          </div>
        </div>
        <div class="flex gap-3 justify-center pt-2">
          <button class="px-5 py-2.5 bg-accent-red/10 border border-accent-red/30 text-accent-red rounded-xl text-sm font-semibold hover:bg-accent-red/20 transition-all" @click="retrying = true; currentQ = 0; myAnswers = []; done = false">
            🔄 Retry (practice)
          </button>
          <NuxtLink to="/grammar" class="px-5 py-2.5 bg-brand-card border border-brand-border/30 text-gray-400 rounded-xl text-sm hover:text-white transition-all">
            📝 Grammar Lessons
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Quiz -->
    <div v-else-if="!done" class="px-4 sm:px-6 max-w-2xl mx-auto space-y-5">
      <!-- Progress -->
      <div class="flex items-center gap-3">
        <div class="flex gap-1.5 flex-1">
          <div
            v-for="i in questions.length"
            :key="i"
            class="h-2 flex-1 rounded-full transition-all duration-300"
            :class="i - 1 < currentQ ? 'bg-accent-red' : i - 1 === currentQ ? 'bg-accent-red/50' : 'bg-brand-card'"
          />
        </div>
        <span class="text-gray-500 text-sm whitespace-nowrap">{{ currentQ + 1 }} / {{ questions.length }}</span>
      </div>

      <!-- Category badge -->
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold px-3 py-1 rounded-full bg-brand-card border border-brand-border/30 text-gray-400">
          {{ questions[currentQ].category }}
        </span>
        <span v-if="questions[currentQ].difficulty === 'hard'" class="text-xs font-semibold px-3 py-1 rounded-full bg-accent-red/10 border border-accent-red/20 text-accent-red">Hard</span>
      </div>

      <!-- Question -->
      <div class="glass-card p-6">
        <p class="text-xs uppercase tracking-widest text-gray-600 mb-3">Question {{ currentQ + 1 }}</p>
        <p class="text-white text-lg font-medium leading-snug" v-html="formatQuestion(questions[currentQ].question)" />
        <p v-if="questions[currentQ].context" class="text-gray-500 text-sm italic mt-2">"{{ questions[currentQ].context }}"</p>
      </div>

      <!-- Options -->
      <div class="space-y-3">
        <button
          v-for="option in questions[currentQ].options"
          :key="option"
          class="w-full py-3.5 px-5 rounded-xl font-semibold text-left transition-all border text-sm"
          :class="getOptionClass(option)"
          :disabled="!!myAnswers[currentQ]"
          @click="answer(option)"
        >
          {{ option }}
        </button>
      </div>

      <!-- Feedback -->
      <div
        v-if="myAnswers[currentQ]"
        class="p-4 rounded-xl border transition-all"
        :class="myAnswers[currentQ] === questions[currentQ].correct ? 'bg-green-500/10 border-green-500/30' : 'bg-accent-red/10 border-accent-red/30'"
      >
        <p class="font-bold mb-1.5" :class="myAnswers[currentQ] === questions[currentQ].correct ? 'text-green-400' : 'text-accent-red'">
          {{ myAnswers[currentQ] === questions[currentQ].correct ? '✓ Correct!' : '✗ Wrong — Correct answer: ' + questions[currentQ].correct }}
        </p>
        <p class="text-gray-400 text-sm leading-relaxed">{{ questions[currentQ].explanation }}</p>
      </div>

      <button
        v-if="myAnswers[currentQ]"
        class="w-full py-3.5 bg-gradient-to-r from-accent-red to-accent-flame text-white rounded-xl font-bold text-base hover:opacity-90 transition-opacity"
        @click="nextQuestion"
      >
        {{ currentQ + 1 === questions.length ? 'See My Results →' : 'Next Question →' }}
      </button>
    </div>

    <!-- Results -->
    <div v-else class="px-4 sm:px-6 max-w-2xl mx-auto py-8 space-y-5">
      <div class="glass-card p-8 text-center space-y-4">
        <div class="text-7xl">{{ resultEmoji }}</div>
        <h2 class="font-display font-black text-4xl text-white">{{ score }} / {{ questions.length }}</h2>
        <p class="text-gray-400 text-lg">{{ resultMessage }}</p>
        <!-- Question breakdown -->
        <div class="flex gap-2 justify-center flex-wrap mt-2">
          <div
            v-for="(q, i) in questions"
            :key="i"
            class="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border"
            :class="myAnswers[i] === q.correct ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-accent-red/10 border-accent-red/30 text-accent-red'"
          >
            {{ myAnswers[i] === q.correct ? '✓' : '✗' }}
          </div>
        </div>
      </div>

      <!-- Per-question review -->
      <div class="space-y-3">
        <h3 class="font-display font-bold text-white text-lg">Review</h3>
        <div
          v-for="(q, i) in questions"
          :key="i"
          class="glass-card p-4"
        >
          <div class="flex items-start gap-3">
            <div
              class="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold"
              :class="myAnswers[i] === q.correct ? 'bg-green-500/20 text-green-400' : 'bg-accent-red/20 text-accent-red'"
            >
              {{ myAnswers[i] === q.correct ? '✓' : '✗' }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-white text-sm font-medium mb-1" v-html="formatQuestion(q.question)" />
              <p v-if="myAnswers[i] !== q.correct" class="text-accent-red text-xs mb-1">Your answer: {{ myAnswers[i] }}</p>
              <p class="text-green-400 text-xs mb-1">✓ {{ q.correct }}</p>
              <p class="text-gray-500 text-xs">{{ q.explanation }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="flex gap-3">
        <NuxtLink to="/grammar" class="flex-1 py-3 bg-accent-red/10 border border-accent-red/30 text-accent-red rounded-xl font-semibold text-center hover:bg-accent-red/20 transition-all text-sm">
          📝 Practice Grammar
        </NuxtLink>
        <NuxtLink to="/vocab" class="flex-1 py-3 bg-brand-card border border-brand-border/30 text-gray-400 rounded-xl font-semibold text-center hover:text-white transition-all text-sm">
          📚 My Vocabulary
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

interface Question {
  question: string
  context?: string
  options: string[]
  correct: string
  explanation: string
  category: string
  difficulty?: 'normal' | 'hard'
}

// ─── Question bank (60 questions, 5 picked per day by date seed) ──
const QUESTION_BANK: Question[] = [
  // Present tenses
  { question: 'She ___ to the gym every day.', options: ['go', 'goes', 'is going', 'gone'], correct: 'goes', explanation: 'Present Simple for habits. She/he/it → add -s.', category: 'Present Tenses' },
  { question: 'Listen! Someone ___ at the door.', options: ['knock', 'knocks', 'is knocking', 'knocked'], correct: 'is knocking', explanation: 'Listen! signals right now → Present Continuous.', category: 'Present Tenses' },
  { question: 'Water ___ at 100°C.', options: ['is boiling', 'boils', 'boil', 'boiled'], correct: 'boils', explanation: 'Scientific facts use Present Simple.', category: 'Present Tenses' },
  { question: 'He ___ three languages.', options: ['is speaking', 'speaks', 'speak', 'speaking'], correct: 'speaks', explanation: 'Stative verbs (know, speak, understand) use Simple, not Continuous.', category: 'Present Tenses' },
  { question: 'I ___ a great book this week.', options: ['read', 'reads', 'am reading', 'have read'], correct: 'am reading', explanation: '"This week" = temporary ongoing action → Present Continuous.', category: 'Present Tenses' },
  // Past tenses
  { question: 'I ___ my homework. You can check it!', options: ['finished', 'have finished', 'finish', 'finishing'], correct: 'have finished', explanation: 'Result relevant NOW → Present Perfect.', category: 'Past & Perfect' },
  { question: 'She ___ to Paris last year.', options: ['has gone', 'went', 'goes', 'has went'], correct: 'went', explanation: '"Last year" = specific time → Past Simple.', category: 'Past & Perfect' },
  { question: 'I ___ never eaten sushi.', options: ['had', 'have', 'did', 'was'], correct: 'have', explanation: '"Never" with life experience → Present Perfect: have + past participle.', category: 'Past & Perfect' },
  { question: '___ you ___ that film yet?', options: ['Did / see', 'Have / seen', 'Do / see', 'Had / seen'], correct: 'Have / seen', explanation: '"Yet" signals Present Perfect — up to now.', category: 'Past & Perfect', difficulty: 'hard' },
  { question: 'When I arrived, she ___ already left.', options: ['has', 'had', 'have', 'was'], correct: 'had', explanation: 'Past Perfect (had + p.p.) — action completed before another past action.', category: 'Past & Perfect', difficulty: 'hard' },
  // Articles
  { question: 'Can I have ___ glass of water?', options: ['a', 'an', 'the', '-'], correct: 'a', explanation: '"Glass" starts with a consonant → "a". First mention, unspecific.', category: 'Articles' },
  { question: '___ sun is very hot today.', options: ['A', 'An', 'The', '-'], correct: 'The', explanation: 'Unique things (sun, moon, earth) always take "the".', category: 'Articles' },
  { question: 'She wants to be ___ engineer.', options: ['a', 'an', 'the', '-'], correct: 'an', explanation: '"Engineer" starts with a vowel sound → "an".', category: 'Articles' },
  { question: 'I love ___ music.', options: ['a', 'an', 'the', '-'], correct: '-', explanation: 'Uncountable nouns in general (music, water, love) → no article.', category: 'Articles' },
  { question: 'This is ___ best coffee I\'ve ever had.', options: ['a', 'an', 'the', '-'], correct: 'the', explanation: 'Superlatives always require "the": the best, the worst, the biggest.', category: 'Articles' },
  // Prepositions
  { question: 'I was born ___ 1998.', options: ['at', 'on', 'in', 'by'], correct: 'in', explanation: '"In" for years, months, and seasons.', category: 'Prepositions' },
  { question: 'The class starts ___ Monday.', options: ['in', 'at', 'on', 'by'], correct: 'on', explanation: '"On" for days of the week and specific dates.', category: 'Prepositions' },
  { question: 'We met ___ the airport.', options: ['in', 'at', 'on', 'by'], correct: 'at', explanation: '"At" for specific points/locations (airport, bus stop, door).', category: 'Prepositions' },
  { question: 'There\'s a picture ___ the wall.', options: ['in', 'at', 'on', 'by'], correct: 'on', explanation: '"On" for surfaces: on the wall, on the floor, on the table.', category: 'Prepositions' },
  { question: 'I\'ll see you ___ the morning.', options: ['at', 'on', 'in', 'by'], correct: 'in', explanation: '"In the morning/afternoon/evening" but "at night" — exception!', category: 'Prepositions' },
  // Modal verbs
  { question: 'You look tired. You ___ rest.', options: ['must', 'should', 'can', 'might'], correct: 'should', explanation: '"Should" gives advice or a recommendation.', category: 'Modal Verbs' },
  { question: '___ I open the window? It\'s hot.', options: ['Must', 'Should', 'Could', 'Would'], correct: 'Could', explanation: '"Could" makes a polite request or asks permission.', category: 'Modal Verbs' },
  { question: 'She ___ be home. Her lights are on.', options: ['should', 'might', 'must', 'can'], correct: 'must', explanation: '"Must" for strong logical deduction from evidence.', category: 'Modal Verbs' },
  { question: 'Students ___ use phones in exams.', options: ['can\'t', 'shouldn\'t', 'couldn\'t', 'don\'t'], correct: 'can\'t', explanation: '"Can\'t" (cannot) = prohibition — it is not allowed.', category: 'Modal Verbs' },
  { question: 'It ___ snow tomorrow — not sure yet.', options: ['must', 'can', 'might', 'should'], correct: 'might', explanation: '"Might" expresses uncertainty about possibility.', category: 'Modal Verbs' },
  // Conditionals
  { question: 'If it ___ tomorrow, I\'ll stay home.', options: ['rains', 'rained', 'will rain', 'would rain'], correct: 'rains', explanation: 'First conditional: If + present simple (real future possibility).', category: 'Conditionals' },
  { question: 'If I ___ you, I would apologize.', options: ['am', 'was', 'were', 'be'], correct: 'were', explanation: 'Second conditional uses "were" for ALL subjects (subjunctive).', category: 'Conditionals' },
  { question: 'If you heat ice, it ___.', options: ['melts', 'will melt', 'would melt', 'melted'], correct: 'melts', explanation: 'Zero conditional for facts: If + present, present simple.', category: 'Conditionals' },
  { question: 'If she had studied, she ___ passed.', options: ['will have', 'would have', 'had', 'would'], correct: 'would have', explanation: 'Third conditional (past hypothetical): would have + past participle.', category: 'Conditionals', difficulty: 'hard' },
  { question: 'Unless you hurry, you ___ miss the train.', options: ['would', 'will', 'might have', 'had'], correct: 'will', explanation: '"Unless" = "if not". First conditional (real future consequence).', category: 'Conditionals', difficulty: 'hard' },
  // Passive voice
  { question: 'This bridge ___ in 1970.', options: ['built', 'was built', 'has built', 'builds'], correct: 'was built', explanation: 'Past passive: was/were + past participle.', category: 'Passive Voice' },
  { question: 'English ___ worldwide.', options: ['speaks', 'spoke', 'is spoken', 'was speaking'], correct: 'is spoken', explanation: 'Present passive for a general fact: is/are + past participle.', category: 'Passive Voice' },
  { question: 'The winner ___ tomorrow.', options: ['will announce', 'will be announced', 'is announced', 'announces'], correct: 'will be announced', explanation: 'Future passive: will be + past participle.', category: 'Passive Voice' },
  { question: 'The letter ___ yet.', options: ['hasn\'t signed', 'didn\'t sign', 'hasn\'t been signed', 'isn\'t signing'], correct: 'hasn\'t been signed', explanation: 'Present Perfect Passive: has/have + been + past participle.', category: 'Passive Voice', difficulty: 'hard' },
  { question: 'The cake ___ by my grandmother.', options: ['made', 'was made', 'is making', 'makes'], correct: 'was made', explanation: 'Past passive with agent "by my grandmother".', category: 'Passive Voice' },
  // Vocabulary
  { question: 'His speech was very clear and persuasive — truly ___.', options: ['elusive', 'eloquent', 'erratic', 'evasive'], correct: 'eloquent', explanation: '"Eloquent" means well-spoken and persuasive. Learn it!', category: 'Vocabulary' },
  { question: 'The problem seemed ___ — impossible to solve.', options: ['inevitable', 'insurmountable', 'inherent', 'indifferent'], correct: 'insurmountable', explanation: '"Insurmountable" = too difficult to overcome. In- (not) + surmount (overcome).', category: 'Vocabulary', difficulty: 'hard' },
  { question: 'She felt ___ about the result — neither happy nor sad.', options: ['ambivalent', 'arrogant', 'ardent', 'aloof'], correct: 'ambivalent', explanation: '"Ambivalent" = having mixed or uncertain feelings.', category: 'Vocabulary', difficulty: 'hard' },
  { question: 'The small café had a cozy, welcoming ___', options: ['atmosphere', 'ambition', 'assumption', 'acquisition'], correct: 'atmosphere', explanation: '"Atmosphere" = the mood or feeling of a place.', category: 'Vocabulary' },
  { question: 'She was so ___ that she refused to change her mind.', options: ['stubborn', 'stunning', 'stingy', 'stern'], correct: 'stubborn', explanation: '"Stubborn" = refusing to change despite pressure. A very common adjective!', category: 'Vocabulary' },
  // Word forms
  { question: 'His ___ of the language was impressive.', options: ['know', 'knowing', 'knowledge', 'known'], correct: 'knowledge', explanation: '"Knowledge" is the noun form of "know". Know → knowledge.', category: 'Word Forms' },
  { question: 'The teacher ___ us to speak English only.', options: ['encouraged', 'encouraging', 'encouragement', 'courage'], correct: 'encouraged', explanation: '"Encourage" is the verb. Past tense: encouraged.', category: 'Word Forms' },
  { question: 'The film was absolutely ___!', options: ['bore', 'boring', 'bored', 'boredom'], correct: 'boring', explanation: 'Things are "boring". People are "bored". The film caused the feeling.', category: 'Word Forms' },
  { question: 'She has a great ___ for learning.', options: ['able', 'ability', 'ably', 'abled'], correct: 'ability', explanation: '"Ability" is the noun form of "able". Adjective → Noun: able + ity.', category: 'Word Forms' },
  { question: 'He was ___ from the team due to poor performance.', options: ['remove', 'removes', 'removed', 'removal'], correct: 'removed', explanation: 'Passive construction: was + past participle (removed).', category: 'Word Forms', difficulty: 'hard' },
  // Phrasal verbs
  { question: 'I need to ___ this form before the deadline.', options: ['fill in', 'fill up', 'fill out', 'fill on'], correct: 'fill out', explanation: '"Fill out" = complete a form. "Fill in" is also accepted in British English.', category: 'Phrasal Verbs' },
  { question: 'Can you ___ the music? It\'s too loud.', options: ['turn down', 'turn off', 'turn up', 'turn around'], correct: 'turn down', explanation: '"Turn down" = reduce the volume. "Turn up" = increase it.', category: 'Phrasal Verbs' },
  { question: 'She decided to ___ smoking for health reasons.', options: ['give up', 'give in', 'give out', 'give back'], correct: 'give up', explanation: '"Give up" = stop doing something permanently.', category: 'Phrasal Verbs' },
  { question: 'Don\'t worry — things will ___ fine.', options: ['turn out', 'turn up', 'turn off', 'turn down'], correct: 'turn out', explanation: '"Turn out" = result in, end up. "Things will turn out fine."', category: 'Phrasal Verbs' },
  { question: 'He always ___ his promises. You can trust him.', options: ['keeps up', 'keeps on', 'keeps to', 'keeps out'], correct: 'keeps to', explanation: '"Keep to a promise" = honour/follow through on a promise.', category: 'Phrasal Verbs', difficulty: 'hard' },
  // Sentence structure
  { question: '___ is the tallest building in the world?', options: ['Who', 'What', 'Which', 'Where'], correct: 'Which', explanation: '"Which" when asking about a choice from a group. "What" for open questions.', category: 'Sentence Structure' },
  { question: 'She asked me ___ I was feeling.', options: ['that', 'what', 'which', 'if'], correct: 'how', explanation: 'Reported question: She asked me HOW I was feeling.', category: 'Sentence Structure', difficulty: 'hard' },
  { question: 'It was ___ a difficult exam that many failed.', options: ['so', 'such', 'very', 'too'], correct: 'such', explanation: '"Such a + adjective + noun": it was such a difficult exam.', category: 'Sentence Structure' },
  { question: 'She is not only smart ___ also very kind.', options: ['and', 'but', 'or', 'yet'], correct: 'but', explanation: '"Not only... but also" is a fixed correlative conjunction pair.', category: 'Sentence Structure' },
  { question: 'By the time he arrived, the party ___.', options: ['ended', 'has ended', 'had ended', 'was ending'], correct: 'had ended', explanation: '"By the time" + Past Perfect: action completed before another past action.', category: 'Sentence Structure', difficulty: 'hard' },
  // Collocations
  { question: 'She ___ a decision to quit her job.', options: ['did', 'made', 'took', 'had'], correct: 'made', explanation: '"Make a decision" is a fixed collocation. NOT "do a decision".', category: 'Collocations' },
  { question: 'Can you ___ me a favour?', options: ['make', 'do', 'give', 'take'], correct: 'do', explanation: '"Do a favour" is fixed. Also: do homework, do your best, do the dishes.', category: 'Collocations' },
  { question: 'He ___ a great impression at the interview.', options: ['did', 'made', 'gave', 'took'], correct: 'made', explanation: '"Make an impression/mistake/decision/suggestion" — "make" collocates here.', category: 'Collocations' },
  { question: 'I need to ___ a shower before the meeting.', options: ['make', 'do', 'take', 'have'], correct: 'take', explanation: '"Take a shower/bath/break/photo/step" — very common collocations.', category: 'Collocations' },
  { question: 'She ___ a lot of attention in class.', options: ['paid', 'gave', 'made', 'did'], correct: 'paid', explanation: '"Pay attention" is a fixed collocation. NOT "give attention".', category: 'Collocations' },
]

// ─── Date-based seeded selection ──────────────────────────
function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

function getDailyQuestions(): Question[] {
  const now = new Date()
  const seed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
  const pool = [...QUESTION_BANK]
  const selected: Question[] = []
  const usedCategories = new Set<string>()

  // Pick 5 questions ensuring category variety
  let attempts = 0
  while (selected.length < 5 && attempts < 200) {
    const idx = Math.floor(seededRandom(seed + attempts) * pool.length)
    const q = pool[idx]
    if (!selected.includes(q)) {
      // Allow at most 2 from same category
      const catCount = selected.filter(s => s.category === q.category).length
      if (catCount < 2) {
        selected.push(q)
      }
    }
    attempts++
  }
  // Pad if needed
  while (selected.length < 5) {
    const q = pool[selected.length % pool.length]
    if (!selected.includes(q)) selected.push(q)
  }
  return selected
}

// ─── State ────────────────────────────────────────────────
const questions = getDailyQuestions()
const currentQ = ref(0)
const myAnswers = ref<string[]>([])
const done = ref(false)
const retrying = ref(false)

const todayKey = () => {
  const d = new Date()
  return `challenge_${d.getFullYear()}_${d.getMonth()}_${d.getDate()}`
}

const todayLabel = computed(() => {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
})

const alreadyDoneToday = ref(false)
const savedScore = ref(0)
const savedAnswers = ref<string[]>([])

onMounted(() => {
  const saved = localStorage.getItem(todayKey())
  if (saved) {
    const data = JSON.parse(saved)
    alreadyDoneToday.value = true
    savedScore.value = data.score
    savedAnswers.value = data.answers
  }
})

const score = computed(() => myAnswers.value.filter((a, i) => a === questions[i].correct).length)

function answer(option: string) {
  if (myAnswers.value[currentQ.value]) return
  myAnswers.value = [...myAnswers.value.slice(0, currentQ.value), option, ...myAnswers.value.slice(currentQ.value + 1)]
}

function nextQuestion() {
  if (currentQ.value + 1 >= questions.length) {
    done.value = true
    if (!retrying.value) {
      localStorage.setItem(todayKey(), JSON.stringify({ score: score.value, answers: myAnswers.value }))
      alreadyDoneToday.value = true
      savedScore.value = score.value
      savedAnswers.value = myAnswers.value
    }
    return
  }
  currentQ.value++
}

function getOptionClass(option: string) {
  const answered = myAnswers.value[currentQ.value]
  if (!answered) return 'bg-brand-card/60 border-brand-border/30 text-white hover:border-accent-red/40 hover:bg-accent-red/5'
  if (option === questions[currentQ.value].correct) return 'bg-green-500/10 border-green-500/40 text-green-400'
  if (option === answered) return 'bg-accent-red/10 border-accent-red/40 text-accent-red'
  return 'bg-brand-card/30 border-brand-border/20 text-gray-600'
}

function formatQuestion(text: string) {
  return text.replace(/___/g, '<span class="inline-block min-w-[60px] border-b-2 border-accent-red/60 text-accent-red mx-1">___</span>')
}

const resultEmoji = computed(() => {
  const s = score.value
  if (s === 5) return '🔥'
  if (s === 4) return '😤'
  if (s === 3) return '📚'
  return '💀'
})

const resultMessage = computed(() => {
  const s = score.value
  if (s === 5) return 'PERFECT! Tayaq.ai is speechless. Come back tomorrow.'
  if (s === 4) return 'Strong. One mistake — review it below.'
  if (s === 3) return 'Average. Tayaq.ai is mildly disappointed.'
  return 'Tayaq.ai is deeply disappointed. Study harder.'
})

useHead({ title: "Daily Challenge — Tayaq.ai" })
</script>
