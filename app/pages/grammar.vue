<template>
  <div class="min-h-screen pb-24">
    <!-- Header -->
    <div class="pt-24 pb-10 px-4 sm:px-6 max-w-5xl mx-auto">
      <div class="flex items-center gap-3 mb-2">
        <span class="text-3xl">📝</span>
        <h1 class="font-display font-black text-3xl sm:text-4xl text-white">Grammar Lessons</h1>
      </div>
      <p class="text-gray-400 text-sm">{{ completedCount }} / {{ topics.length }} topics completed · Master English grammar step by step</p>
      <!-- Progress bar -->
      <div class="h-1.5 bg-brand-card rounded-full mt-3 overflow-hidden w-64">
        <div
          class="h-full bg-gradient-to-r from-accent-red to-accent-flame rounded-full transition-all duration-700"
          :style="{ width: `${(completedCount / topics.length) * 100}%` }"
        />
      </div>
    </div>

    <!-- Topics Grid -->
    <div v-if="!activeTopic" class="px-4 sm:px-6 max-w-5xl mx-auto">
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          v-for="topic in topics"
          :key="topic.id"
          class="relative text-left p-5 rounded-2xl border transition-all duration-200 group"
          :class="completed.has(topic.id)
            ? 'bg-green-500/5 border-green-500/30 hover:border-green-500/50'
            : 'bg-brand-card/60 border-brand-border/30 hover:border-accent-red/30 hover:bg-accent-red/5 hover:-translate-y-1'"
          @click="selectTopic(topic)"
        >
          <!-- Completed badge -->
          <div v-if="completed.has(topic.id)" class="absolute top-3 right-3 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <span class="text-green-400 text-xs">✓</span>
          </div>
          <span class="text-3xl block mb-3">{{ topic.icon }}</span>
          <h3 class="font-display font-bold text-white text-sm leading-snug mb-1">{{ topic.name }}</h3>
          <p class="text-gray-500 text-xs leading-relaxed">{{ topic.description }}</p>
          <div class="mt-3 flex items-center justify-between">
            <span
              class="text-xs font-semibold px-2 py-0.5 rounded-full"
              :class="{
                'bg-green-500/10 text-green-400': topic.level === 'Beginner',
                'bg-accent-amber/10 text-accent-amber': topic.level === 'Intermediate',
                'bg-accent-red/10 text-accent-red': topic.level === 'Advanced',
              }"
            >{{ topic.level }}</span>
            <span class="text-gray-600 text-xs">5 questions</span>
          </div>
        </button>
      </div>
    </div>

    <!-- Lesson View -->
    <div v-else class="px-4 sm:px-6 max-w-3xl mx-auto">
      <!-- Back button -->
      <button class="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm" @click="activeTopic = null; quizStarted = false; currentQ = 0; selectedAnswer = null; showFeedback = false; score = 0; quizDone = false">
        ← Back to Topics
      </button>

      <!-- Topic header -->
      <div class="flex items-center gap-3 mb-6">
        <span class="text-4xl">{{ activeTopic.icon }}</span>
        <div>
          <h2 class="font-display font-bold text-2xl text-white">{{ activeTopic.name }}</h2>
          <span class="text-xs font-semibold px-2 py-0.5 rounded-full"
            :class="{
              'bg-green-500/10 text-green-400': activeTopic.level === 'Beginner',
              'bg-accent-amber/10 text-accent-amber': activeTopic.level === 'Intermediate',
              'bg-accent-red/10 text-accent-red': activeTopic.level === 'Advanced',
            }">{{ activeTopic.level }}</span>
        </div>
      </div>

      <!-- Explanation (before quiz) -->
      <div v-if="!quizStarted" class="space-y-4">
        <div class="glass-card p-6">
          <p class="text-xs uppercase tracking-widest text-gray-600 mb-3">Explanation</p>
          <p class="text-gray-300 leading-relaxed mb-5">{{ activeTopic.explanation }}</p>
          <div class="space-y-3">
            <div v-for="(rule, i) in activeTopic.rules" :key="i" class="flex gap-3 p-3 rounded-xl bg-brand-black/40 border border-brand-border/20">
              <span class="text-accent-red font-bold text-sm flex-shrink-0 mt-0.5">{{ i + 1 }}</span>
              <p class="text-gray-400 text-sm leading-relaxed">{{ rule }}</p>
            </div>
          </div>
        </div>

        <!-- Examples -->
        <div class="glass-card p-6">
          <p class="text-xs uppercase tracking-widest text-gray-600 mb-3">Examples</p>
          <div class="space-y-2">
            <div v-for="(ex, i) in activeTopic.examples" :key="i" class="flex items-start gap-3">
              <span class="text-accent-amber text-sm flex-shrink-0">→</span>
              <p class="text-gray-300 text-sm italic">"{{ ex }}"</p>
            </div>
          </div>
        </div>

        <button
          class="w-full py-3.5 bg-gradient-to-r from-accent-red to-accent-flame text-white rounded-xl font-bold text-base hover:opacity-90 transition-opacity"
          @click="quizStarted = true"
        >
          Start Practice Quiz (5 questions) →
        </button>
      </div>

      <!-- Quiz -->
      <div v-else-if="!quizDone" class="space-y-5">
        <!-- Progress -->
        <div class="flex items-center gap-3">
          <div class="flex gap-1.5">
            <div
              v-for="i in activeTopic.questions.length"
              :key="i"
              class="h-1.5 w-8 rounded-full transition-all"
              :class="i - 1 < currentQ ? 'bg-accent-red' : i - 1 === currentQ ? 'bg-accent-red/60' : 'bg-brand-card'"
            />
          </div>
          <span class="text-gray-500 text-sm ml-auto">{{ currentQ + 1 }} / {{ activeTopic.questions.length }}</span>
        </div>

        <!-- Question -->
        <div class="glass-card p-6">
          <p class="text-xs uppercase tracking-widest text-gray-600 mb-3">Question {{ currentQ + 1 }}</p>
          <p class="text-white text-lg font-medium leading-snug" v-html="highlightBlank(activeTopic.questions[currentQ].question)" />
        </div>

        <!-- Options -->
        <div class="space-y-3">
          <button
            v-for="option in activeTopic.questions[currentQ].options"
            :key="option"
            class="w-full py-3 px-5 rounded-xl font-semibold text-left transition-all border text-sm"
            :class="getAnswerClass(option)"
            :disabled="showFeedback"
            @click="answerQuestion(option)"
          >
            {{ option }}
          </button>
        </div>

        <!-- Feedback -->
        <div v-if="showFeedback" class="p-4 rounded-xl border" :class="selectedAnswer === activeTopic.questions[currentQ].correct ? 'bg-green-500/10 border-green-500/30' : 'bg-accent-red/10 border-accent-red/30'">
          <p class="font-bold mb-1" :class="selectedAnswer === activeTopic.questions[currentQ].correct ? 'text-green-400' : 'text-accent-red'">
            {{ selectedAnswer === activeTopic.questions[currentQ].correct ? '✓ Correct!' : '✗ Wrong — Correct: ' + activeTopic.questions[currentQ].correct }}
          </p>
          <p class="text-gray-400 text-sm">{{ activeTopic.questions[currentQ].explanation }}</p>
        </div>

        <button v-if="showFeedback" class="w-full py-3 bg-brand-card border border-brand-border/30 text-white rounded-xl font-semibold hover:bg-brand-card/80 transition-all" @click="nextQuestion">
          {{ currentQ + 1 === activeTopic.questions.length ? 'See Results →' : 'Next Question →' }}
        </button>
      </div>

      <!-- Quiz Done -->
      <div v-else class="text-center py-8 space-y-4">
        <div class="text-6xl">{{ score === 5 ? '🔥' : score >= 4 ? '😤' : score >= 3 ? '📚' : '💀' }}</div>
        <h2 class="font-display font-black text-4xl text-white">{{ score }} / 5</h2>
        <p class="text-gray-400">{{ score === 5 ? 'Perfect! Tayaq.ai is mildly impressed.' : score >= 4 ? 'Good job. Keep studying.' : score >= 3 ? 'Mediocre. Review the explanation.' : 'Tayaq.ai is deeply disappointed. Try again.' }}</p>
        <div v-if="score >= 4 && !completed.has(activeTopic.id)" class="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 text-sm font-semibold">
          🏆 Topic Completed!
        </div>
        <div class="flex gap-3 justify-center mt-4">
          <button class="px-6 py-3 bg-accent-red/10 border border-accent-red/30 text-accent-red rounded-xl font-semibold hover:bg-accent-red/20 transition-all" @click="retryQuiz">🔄 Retry</button>
          <button class="px-6 py-3 bg-brand-card border border-brand-border/30 text-gray-400 rounded-xl hover:text-white transition-all" @click="activeTopic = null; quizStarted = false">← All Topics</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

interface Question {
  question: string
  options: string[]
  correct: string
  explanation: string
}

interface Topic {
  id: string
  icon: string
  name: string
  description: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  explanation: string
  rules: string[]
  examples: string[]
  questions: Question[]
}

const topics: Topic[] = [
  {
    id: 'present-simple-vs-continuous',
    icon: '🕐',
    name: 'Present Simple vs Continuous',
    description: 'Habits & facts vs actions happening right now',
    level: 'Beginner',
    explanation: 'Present Simple describes habits, routines, and general truths. Present Continuous describes actions happening at the moment of speaking or temporary situations.',
    rules: [
      'Present Simple: subject + base verb (he/she/it adds -s). Use for habits, facts, schedules.',
      'Present Continuous: subject + am/is/are + verb-ing. Use for actions happening now or temporary situations.',
      'Signal words for Simple: always, usually, every day. For Continuous: now, at the moment, currently.',
    ],
    examples: [
      'She works at a bank. (habit) — She is working from home today. (temporary)',
      'Water boils at 100°C. (fact) — The water is boiling. (right now)',
      'I usually drink coffee. (routine) — I am drinking tea today. (now)',
    ],
    questions: [
      { question: 'She ___ to the gym every morning.', options: ['go', 'goes', 'is going', 'going'], correct: 'goes', explanation: 'Habit/routine → Present Simple. With she/he/it, add -s to the verb.' },
      { question: 'Shh! The baby ___ right now.', options: ['sleeps', 'is sleeping', 'sleep', 'sleeping'], correct: 'is sleeping', explanation: 'Action happening right now → Present Continuous (is/am/are + -ing).' },
      { question: 'Water ___ at 100 degrees Celsius.', options: ['is boiling', 'boils', 'boil', 'boiled'], correct: 'boils', explanation: 'Scientific fact → Present Simple.' },
      { question: 'I ___ for my exam this week.', options: ['study', 'studies', 'am studying', 'studied'], correct: 'am studying', explanation: 'Temporary situation happening around now → Present Continuous.' },
      { question: 'He ___ three languages fluently.', options: ['is speaking', 'speaks', 'speak', 'speaking'], correct: 'speaks', explanation: 'Stative verb describing ability → Present Simple (not Continuous).' },
    ],
  },
  {
    id: 'past-simple-vs-perfect',
    icon: '📅',
    name: 'Past Simple vs Present Perfect',
    description: 'Completed actions vs past with present relevance',
    level: 'Intermediate',
    explanation: 'Past Simple is used for completed actions at a specific time in the past. Present Perfect connects the past to the present — the exact time is not mentioned or is unimportant.',
    rules: [
      'Past Simple: subject + verb (past form). Always used with specific time expressions (yesterday, last year, in 2020).',
      'Present Perfect: subject + have/has + past participle. Used without specific time, or with "ever, never, already, just, yet, for, since".',
      'Key question to ask: Do I know WHEN exactly? → Past Simple. Is the result/experience relevant NOW? → Present Perfect.',
    ],
    examples: [
      'I visited Paris in 2019. (specific past time) — I have visited Paris. (life experience, no specific time)',
      'She lost her keys yesterday. (finished) — She has lost her keys. (still relevant — she can\'t find them now)',
      'Did you eat? (at a specific time) — Have you eaten? (before now, anytime)',
    ],
    questions: [
      { question: 'I ___ my homework. You can check it now.', options: ['finished', 'have finished', 'finish', 'was finishing'], correct: 'have finished', explanation: 'The result is relevant NOW (you can check it) → Present Perfect.' },
      { question: 'She ___ to London last summer.', options: ['has gone', 'went', 'go', 'has went'], correct: 'went', explanation: '"Last summer" is a specific past time → Past Simple.' },
      { question: 'I ___ never tried sushi before.', options: ['had', 'have', 'was', 'did'], correct: 'have', explanation: '"Never" connects past experience to present → Present Perfect (have + past participle).' },
      { question: '___ you ___ that new movie yet?', options: ['Did / see', 'Have / seen', 'Do / see', 'Were / seeing'], correct: 'Have / seen', explanation: '"Yet" signals Present Perfect — asking about an experience up to now.' },
      { question: 'He ___ his first job in 2018.', options: ['has got', 'got', 'get', 'gets'], correct: 'got', explanation: '"In 2018" is a specific past date → Past Simple.' },
    ],
  },
  {
    id: 'articles',
    icon: '📰',
    name: 'Articles: a / an / the',
    description: 'When to use a, an, the — or nothing at all',
    level: 'Beginner',
    explanation: 'Articles are one of the most common mistakes for Kazakh speakers because Kazakh has no articles. "A/An" are used for unspecific or first-mention nouns. "The" is used for specific, known, or unique things.',
    rules: [
      'Use "a" before consonant sounds, "an" before vowel sounds (a/e/i/o/u): a car, an apple, an hour (h is silent).',
      'Use "the" when both speaker and listener know which specific thing is meant, or when something is unique (the sun, the president).',
      'Use NO article with: uncountable nouns in general (water, love, money), plural nouns in general (books are useful), and most proper nouns (Kazakhstan, English).',
    ],
    examples: [
      'I saw a dog today. Later, the dog barked at me. (first mention = a, second mention = the)',
      'She is an engineer. (job, not specific) — She is the engineer who built this bridge. (specific person)',
      'I love music. (general, no article) — I love the music at this café. (specific music)',
    ],
    questions: [
      { question: 'Can I have ___ glass of water, please?', options: ['a', 'an', 'the', '-'], correct: 'a', explanation: 'First mention, not a specific glass → use "a". "Glass" starts with a consonant sound.' },
      { question: '___ sun rises in the east.', options: ['A', 'An', 'The', '-'], correct: 'The', explanation: 'There is only one sun — unique things take "the".' },
      { question: 'She wants to become ___ architect.', options: ['a', 'an', 'the', '-'], correct: 'an', explanation: '"Architect" starts with a vowel sound → use "an".' },
      { question: 'I drink ___ coffee every morning.', options: ['a', 'an', 'the', '-'], correct: '-', explanation: 'Coffee in general (uncountable, habitual) → no article.' },
      { question: 'This is ___ best restaurant in the city.', options: ['a', 'an', 'the', '-'], correct: 'the', explanation: 'Superlative ("best") always requires "the".' },
    ],
  },
  {
    id: 'modal-verbs',
    icon: '🎯',
    name: 'Modal Verbs',
    description: 'Can, could, should, must, might — when to use each',
    level: 'Intermediate',
    explanation: 'Modal verbs express ability, permission, possibility, obligation, or advice. They are followed by the base form of the verb (no "to", no -s for he/she/it).',
    rules: [
      'Ability: can (present), could (past/polite). "I can swim." / "Could you help me?" — could is also polite.',
      'Obligation: must (strong, speaker\'s rule) vs have to (external rule). "You must stop smoking." / "I have to pay taxes."',
      'Advice: should. "You should eat more vegetables." — weaker than must.',
      'Possibility: might / may (uncertain). "It might rain later." / "She may be late."',
    ],
    examples: [
      'I can speak three languages. (ability) — Could I use your phone? (polite request)',
      'You must wear a seatbelt. (rule/law) — You should get more sleep. (advice)',
      'He might be at home. (uncertain possibility) — She must be tired — she worked 12 hours. (logical deduction)',
    ],
    questions: [
      { question: 'You look pale. You ___ see a doctor.', options: ['must', 'should', 'can', 'might'], correct: 'should', explanation: '"Should" gives advice — it\'s a recommendation, not an obligation.' },
      { question: '___ I borrow your pen, please?', options: ['Must', 'Should', 'Could', 'Might'], correct: 'Could', explanation: '"Could" is the polite form for requests/asking permission.' },
      { question: 'She ___ be at home. Her car is outside.', options: ['should', 'might', 'must', 'can'], correct: 'must', explanation: '"Must" for logical deduction — the evidence strongly suggests it.' },
      { question: 'Students ___ use phones during the exam.', options: ['couldn\'t', 'can\'t', 'shouldn\'t', 'might not'], correct: 'can\'t', explanation: '"Can\'t" (cannot) expresses prohibition — it is not allowed.' },
      { question: 'It ___ snow tonight — check the forecast.', options: ['must', 'can', 'might', 'should'], correct: 'might', explanation: '"Might" expresses uncertainty about a future possibility.' },
    ],
  },
  {
    id: 'conditionals',
    icon: '❓',
    name: 'Conditionals (If sentences)',
    description: 'Real possibilities vs hypothetical situations',
    level: 'Intermediate',
    explanation: 'Conditionals talk about the result of a condition. The most important are: Zero (always true), First (real future possibility), and Second (hypothetical/unreal present).',
    rules: [
      'Zero conditional: If + present simple, present simple. For facts/general truths. "If you heat water, it boils."',
      'First conditional: If + present simple, will + base verb. For real future possibilities. "If it rains, I will stay home."',
      'Second conditional: If + past simple, would + base verb. For unreal/hypothetical situations. "If I had a million, I would travel."',
      'Note: In second conditional, use "were" instead of "was" for all subjects. "If I were you, I would apologize."',
    ],
    examples: [
      'If you mix red and blue, you get purple. (Zero — always true)',
      'If she studies hard, she will pass the exam. (First — real possibility)',
      'If I won the lottery, I would buy a house. (Second — hypothetical)',
    ],
    questions: [
      { question: 'If it ___ tomorrow, we will cancel the trip.', options: ['rains', 'rained', 'will rain', 'would rain'], correct: 'rains', explanation: 'First conditional: If + present simple (real future possibility) → "If it rains".' },
      { question: 'If I ___ you, I would apologize immediately.', options: ['am', 'was', 'were', 'be'], correct: 'were', explanation: 'Second conditional uses "were" for all subjects (formal/subjunctive mood).' },
      { question: 'If you heat ice, it ___.', options: ['melts', 'will melt', 'would melt', 'melted'], correct: 'melts', explanation: 'Zero conditional for general truths: If + present, present.' },
      { question: 'If she had more money, she ___ travel the world.', options: ['will', 'would', 'can', 'should'], correct: 'would', explanation: 'Second conditional: hypothetical → would + base verb.' },
      { question: 'If you ___ hard, you will succeed.', options: ['work', 'worked', 'would work', 'will work'], correct: 'work', explanation: 'First conditional: If + present simple → real possibility.' },
    ],
  },
  {
    id: 'prepositions',
    icon: '📍',
    name: 'Prepositions of Time & Place',
    description: 'In, on, at — master the most confusing prepositions',
    level: 'Beginner',
    explanation: 'In/On/At are the most commonly confused prepositions in English. They are used for both time and place, following specific patterns that Kazakh speakers must memorize.',
    rules: [
      'TIME: at (exact time: at 5pm, at noon), on (days/dates: on Monday, on June 5), in (months/years/seasons: in July, in 2020, in summer).',
      'PLACE: at (specific point/address: at the bus stop, at 10 Baker Street), on (surfaces/streets: on the table, on Baker Street), in (enclosed spaces/cities/countries: in the box, in London, in Kazakhstan).',
      'Common exceptions: at night, at the weekend (BrE), on the weekend (AmE), in the morning/afternoon/evening (but: at night).',
    ],
    examples: [
      'The meeting is at 9am on Monday in March. (time prepositions)',
      'I live at 25 Abay Street, in Almaty, in Kazakhstan. (place prepositions)',
      'Put the book on the shelf. The cat is in the box. She is at the door.',
    ],
    questions: [
      { question: 'I was born ___ 1998.', options: ['at', 'on', 'in', 'by'], correct: 'in', explanation: '"In" is used with years: in 1998.' },
      { question: 'The train arrives ___ 6:30 pm.', options: ['in', 'on', 'at', 'by'], correct: 'at', explanation: '"At" is used with specific times: at 6:30 pm.' },
      { question: 'She works ___ a hospital.', options: ['in', 'at', 'on', 'by'], correct: 'at', explanation: '"At" for specific locations/workplaces: at a hospital.' },
      { question: 'My birthday is ___ July 15th.', options: ['in', 'at', 'on', 'by'], correct: 'on', explanation: '"On" is used with specific dates and days: on July 15th.' },
      { question: 'There is a map ___ the wall.', options: ['in', 'at', 'on', 'by'], correct: 'on', explanation: '"On" is used for surfaces: on the wall, on the ceiling.' },
    ],
  },
  {
    id: 'passive-voice',
    icon: '🔄',
    name: 'Passive Voice',
    description: 'When the action is more important than the doer',
    level: 'Advanced',
    explanation: 'The Passive Voice is used when the action is more important than who does it, or when the doer is unknown/obvious. It is formed with the appropriate form of "to be" + past participle.',
    rules: [
      'Formation: be (in correct tense) + past participle. "The letter is written." / "The letter was written." / "The letter will be written."',
      'To mention the doer, use "by": "The book was written by Tolstoy." — but often the doer is not mentioned.',
      'Active → Passive: move the object to subject position. "They built this bridge in 1990." → "This bridge was built in 1990."',
    ],
    examples: [
      'English is spoken all over the world. (doer unknown/obvious)',
      'This movie was directed by Christopher Nolan. (doer mentioned with "by")',
      'The report will be submitted tomorrow. (future passive — focus on the action)',
    ],
    questions: [
      { question: 'This bridge ___ in 1970.', options: ['built', 'was built', 'has built', 'builds'], correct: 'was built', explanation: 'Past passive: was/were + past participle.' },
      { question: 'English ___ all over the world.', options: ['speaks', 'spoke', 'is spoken', 'was speaking'], correct: 'is spoken', explanation: 'Present passive for a general fact: is/are + past participle.' },
      { question: 'The results ___ tomorrow morning.', options: ['will announce', 'will be announced', 'are announced', 'announced'], correct: 'will be announced', explanation: 'Future passive: will be + past participle.' },
      { question: 'The package ___ by a courier yesterday.', options: ['delivered', 'was delivered', 'has delivered', 'delivers'], correct: 'was delivered', explanation: 'Past passive with agent ("by a courier"): was + past participle.' },
      { question: 'The letter ___ yet.', options: ['hasn\'t signed', 'didn\'t sign', 'hasn\'t been signed', 'isn\'t signing'], correct: 'hasn\'t been signed', explanation: 'Present Perfect Passive: has/have + been + past participle.' },
    ],
  },
  {
    id: 'comparatives-superlatives',
    icon: '📊',
    name: 'Comparatives & Superlatives',
    description: 'Comparing things: bigger, the biggest, more interesting',
    level: 'Beginner',
    explanation: 'Comparatives compare two things. Superlatives compare one thing to all others in its group. The form changes depending on the length of the adjective.',
    rules: [
      'Short adjectives (1-2 syllables): add -er (comparative) / -est (superlative). "tall → taller → the tallest". Double final consonant if needed: "big → bigger → the biggest".',
      'Long adjectives (3+ syllables): use "more" (comparative) / "most" (superlative). "interesting → more interesting → the most interesting".',
      'Irregular forms: good → better → the best. Bad → worse → the worst. Far → further → the furthest.',
    ],
    examples: [
      'She is taller than her sister. (comparative) — She is the tallest in the class. (superlative)',
      'This book is more interesting than that one. — This is the most interesting book I\'ve read.',
      'This is worse than I expected. — This is the worst day of my life.',
    ],
    questions: [
      { question: 'Mount Everest is ___ mountain in the world.', options: ['higher', 'the higher', 'the highest', 'most high'], correct: 'the highest', explanation: 'Superlative of "high" (short adjective): the + highest.' },
      { question: 'This exam was ___ than the last one.', options: ['more difficult', 'the most difficult', 'difficulter', 'most difficult'], correct: 'more difficult', explanation: '"Difficult" is a long adjective (3 syllables) → more difficult.' },
      { question: 'She runs ___ than her brother.', options: ['fast', 'faster', 'the fastest', 'more fast'], correct: 'faster', explanation: '"Fast" is a short adjective → add -er for comparative.' },
      { question: 'That was ___ movie I have ever seen.', options: ['bad', 'worse', 'the worst', 'most bad'], correct: 'the worst', explanation: '"Bad" is irregular: bad → worse → the worst.' },
      { question: 'Today is ___ day of the year.', options: ['hot', 'hotter', 'more hot', 'the hottest'], correct: 'the hottest', explanation: '"Hot" is short and ends in consonant-vowel-consonant → double the t: the hottest.' },
    ],
  },
]

// ─── State ────────────────────────────────────────────────
const activeTopic = ref<Topic | null>(null)
const quizStarted = ref(false)
const quizDone = ref(false)
const currentQ = ref(0)
const selectedAnswer = ref<string | null>(null)
const showFeedback = ref(false)
const score = ref(0)

const completed = ref<Set<string>>(new Set())

const completedCount = computed(() => completed.value.size)

onMounted(() => {
  const saved = localStorage.getItem('grammar_completed')
  if (saved) completed.value = new Set(JSON.parse(saved))
})

function selectTopic(topic: Topic) {
  activeTopic.value = topic
  quizStarted.value = false
  quizDone.value = false
  currentQ.value = 0
  selectedAnswer.value = null
  showFeedback.value = false
  score.value = 0
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function answerQuestion(option: string) {
  if (showFeedback.value) return
  selectedAnswer.value = option
  showFeedback.value = true
  if (option === activeTopic.value!.questions[currentQ.value].correct) score.value++
}

function nextQuestion() {
  if (currentQ.value + 1 >= activeTopic.value!.questions.length) {
    quizDone.value = true
    if (score.value >= 4) {
      completed.value = new Set([...completed.value, activeTopic.value!.id])
      localStorage.setItem('grammar_completed', JSON.stringify([...completed.value]))
    }
    return
  }
  currentQ.value++
  selectedAnswer.value = null
  showFeedback.value = false
}

function retryQuiz() {
  currentQ.value = 0
  selectedAnswer.value = null
  showFeedback.value = false
  score.value = 0
  quizDone.value = false
}

function getAnswerClass(option: string) {
  if (!showFeedback.value) return 'bg-brand-card/60 border-brand-border/30 text-white hover:border-accent-red/40 hover:bg-accent-red/5'
  if (option === activeTopic.value!.questions[currentQ.value].correct) return 'bg-green-500/10 border-green-500/40 text-green-400'
  if (option === selectedAnswer.value) return 'bg-accent-red/10 border-accent-red/40 text-accent-red'
  return 'bg-brand-card/30 border-brand-border/20 text-gray-600'
}

function highlightBlank(text: string) {
  return text.replace(/___/g, '<span class="inline-block min-w-[60px] border-b-2 border-accent-red/60 text-accent-red mx-1">___</span>')
}

useHead({ title: 'Grammar Lessons — Tayaq.ai' })
</script>
