/**
 * Curriculum config — topics, vocabulary, grammar focus per CEFR-ish level.
 *
 * Used by `voicePersona.ts` to inject the right learning targets into the
 * system prompt. Keep word lists small (10-30 per topic) so the prompt
 * stays under control. We can swap to richer JSONs (50+) later without
 * changing the prompt structure.
 */

export type Level = 'beginner' | 'intermediate' | 'advanced'

interface LevelConfig {
  label: string
  description: string
  grammarFocus: string[]
  topics: { slug: string; name: string; words: string[] }[]
  starterPrompt: string
}

export const CURRICULUM: Record<Level, LevelConfig> = {
  beginner: {
    label: 'Beginner (A1-A2)',
    description: 'Just starting. Knows alphabet, basic greetings, simple present tense. Often confuses to be / to do, mixes tenses.',
    grammarFocus: [
      'present simple',
      'articles a / an / the',
      'plural nouns',
      'subject pronouns (I, you, he, she, it, we, they)',
      'to be (am / is / are)',
      'basic questions (what, where, who, how)',
    ],
    topics: [
      { slug: 'greetings', name: 'Greetings & introductions', words: ['hello', 'hi', 'goodbye', 'thank you', 'please', 'sorry', 'nice to meet you', 'my name is', 'how are you', 'good morning', 'good evening'] },
      { slug: 'food', name: 'Food & drinks', words: ['apple', 'bread', 'rice', 'meat', 'water', 'tea', 'coffee', 'milk', 'cheese', 'soup', 'breakfast', 'lunch', 'dinner', 'spicy', 'sweet'] },
      { slug: 'home', name: 'Home & furniture', words: ['table', 'chair', 'bed', 'sofa', 'kitchen', 'bedroom', 'bathroom', 'window', 'door', 'wall', 'lamp', 'tv', 'fridge'] },
      { slug: 'family', name: 'Family', words: ['mother', 'father', 'sister', 'brother', 'son', 'daughter', 'grandmother', 'grandfather', 'uncle', 'aunt', 'cousin', 'wife', 'husband'] },
      { slug: 'numbers', name: 'Numbers & time', words: ['one', 'ten', 'hundred', 'thousand', 'first', 'second', 'morning', 'evening', 'today', 'yesterday', 'tomorrow', 'week', 'month', 'year'] },
      { slug: 'colors', name: 'Colors & adjectives', words: ['red', 'blue', 'green', 'black', 'white', 'big', 'small', 'tall', 'short', 'old', 'new', 'good', 'bad', 'cold', 'hot'] },
    ],
    starterPrompt: 'Start very gentle. Greet the student, introduce yourself in Kazakh, ask them to say "Hello, my name is..." in English. Keep sentences super short. Beginner-friendly mode — encourage more than roast.',
  },

  intermediate: {
    label: 'Intermediate (B1-B2)',
    description: 'Can hold basic conversation. Knows present and past, struggles with perfect tenses, conditionals, prepositions, articles.',
    grammarFocus: [
      'past simple vs past continuous',
      'present perfect (have done) vs past simple',
      'future forms (will / going to / present continuous)',
      'modals (can, could, should, must, might)',
      'first and second conditionals',
      'comparatives and superlatives',
      'prepositions (in / on / at)',
    ],
    topics: [
      { slug: 'work', name: 'Work & career', words: ['job', 'meeting', 'salary', 'colleague', 'boss', 'deadline', 'promotion', 'apply', 'interview', 'resume', 'experience', 'skill', 'hire', 'fire', 'employer'] },
      { slug: 'travel', name: 'Travel', words: ['flight', 'passport', 'luggage', 'hotel', 'reservation', 'tourist', 'sightseeing', 'departure', 'arrival', 'destination', 'currency', 'visa', 'border', 'souvenir'] },
      { slug: 'opinions', name: 'Opinions & feelings', words: ['agree', 'disagree', 'in my opinion', 'I believe', 'argue', 'feel', 'mood', 'frustrated', 'excited', 'nervous', 'confident', 'worried', 'proud'] },
      { slug: 'food-advanced', name: 'Food (eating out)', words: ['menu', 'order', 'recommend', 'flavor', 'recipe', 'ingredient', 'spicy', 'bland', 'medium-rare', 'vegetarian', 'allergy', 'tip', 'reservation', 'bill'] },
      { slug: 'tech', name: 'Tech & social media', words: ['notification', 'follower', 'post', 'share', 'subscribe', 'app', 'download', 'update', 'password', 'account', 'profile', 'streaming', 'browse', 'scroll'] },
      { slug: 'school', name: 'School & studies', words: ['assignment', 'deadline', 'pass', 'fail', 'grade', 'exam', 'classmate', 'professor', 'lecture', 'notes', 'study', 'cheat', 'dorm', 'scholarship', 'major'] },
    ],
    starterPrompt: 'Strike a balance — challenge them but be encouraging. Drop one solid roast at the start to set the tone, then move into a real conversation about work, travel, or studies.',
  },

  advanced: {
    label: 'Advanced (C1-C2)',
    description: 'Fluent enough for real conversation. Needs polish on idioms, phrasal verbs, register, subtle grammar (subjunctive, inversion, perfect modals).',
    grammarFocus: [
      'present perfect continuous',
      'past perfect and past perfect continuous',
      'mixed conditionals',
      'inversion (had I known, never have I seen)',
      'subjunctive mood (if I were, I suggest he be)',
      'perfect modals (should have, must have, could have)',
      'passive voice variants',
      'reported speech with backshifting',
    ],
    topics: [
      { slug: 'business', name: 'Business English', words: ['stakeholder', 'leverage', 'pivot', 'scale', 'roi', 'kpi', 'deliverable', 'synergy', 'pipeline', 'churn', 'onboarding', 'runway', 'equity'] },
      { slug: 'idioms', name: 'Common idioms', words: ['break the ice', 'hit the books', 'piece of cake', 'spill the beans', 'under the weather', 'cost an arm and a leg', 'beat around the bush', 'bite the bullet', 'cut corners', 'on the fence', 'pull someone\'s leg', 'speak of the devil'] },
      { slug: 'phrasal-verbs', name: 'Phrasal verbs', words: ['give up', 'put off', 'figure out', 'come across', 'look forward to', 'run into', 'turn down', 'bring up', 'fall through', 'get along with', 'look up to', 'call off'] },
      { slug: 'debate', name: 'Debate & abstract topics', words: ['nuance', 'paradox', 'inevitable', 'consequence', 'ambiguous', 'controversial', 'undermine', 'compromise', 'underline', 'contradict', 'speculate', 'rationalize', 'concede'] },
      { slug: 'writing-advanced', name: 'Formal register & academic', words: ['furthermore', 'nevertheless', 'consequently', 'on the contrary', 'in light of', 'with respect to', 'albeit', 'notwithstanding', 'henceforth', 'thereby'] },
      { slug: 'culture', name: 'Culture & identity', words: ['heritage', 'identity', 'assimilate', 'diaspora', 'multilingual', 'expat', 'stereotype', 'nuance', 'cultural appropriation', 'tradition', 'modernize'] },
    ],
    starterPrompt: 'Go full intensity. Throw idioms at them, expect natural fluency. Roast lazy thinking, mediocre vocabulary, overuse of basic words. Push them to use C1+ vocabulary in every reply.',
  },
}

export function getLevelConfig(level: string | undefined): { level: Level; config: LevelConfig } {
  const normalized = (level || '').toLowerCase()
  if (normalized === 'beginner' || normalized === 'intermediate' || normalized === 'advanced') {
    return { level: normalized, config: CURRICULUM[normalized] }
  }
  return { level: 'intermediate', config: CURRICULUM.intermediate }
}

export function getTopicForLevel(level: Level, topicSlug?: string) {
  const config = CURRICULUM[level]
  if (topicSlug) {
    const found = config.topics.find((t) => t.slug === topicSlug)
    if (found) return found
  }
  // Pick the first topic as default starting point. Curriculum config
  // guarantees at least one topic per level, so the assertion is safe.
  return config.topics[0]!
}

const LEVEL_ORDER: Level[] = ['beginner', 'intermediate', 'advanced']

/**
 * Given a learner's current state, decide what they should work on next.
 * Picks the first non-mastered topic at their current level. If every
 * topic at the current level is mastered, bumps to the next level and
 * resets the topic pointer to the first topic of that level.
 *
 * Returns `{ level, topicSlug, levelChanged }` so callers can show the
 * student a "level up" celebration when relevant.
 */
export function getNextLearningTarget(args: {
  currentLevel: Level
  masteredTopics: string[]
}): { level: Level; topicSlug: string; levelChanged: boolean } {
  const { currentLevel, masteredTopics } = args
  let level = currentLevel
  let levelChanged = false

  // Walk up levels until we find one with an unmastered topic
  while (true) {
    const topics = CURRICULUM[level].topics
    const next = topics.find((t) => !masteredTopics.includes(t.slug))
    if (next) return { level, topicSlug: next.slug, levelChanged }

    // All topics in this level are mastered — try to bump
    const idx = LEVEL_ORDER.indexOf(level)
    if (idx === LEVEL_ORDER.length - 1) {
      // At the top level and everything mastered — loop back to last topic
      // (advanced learners can re-drill anything)
      return {
        level,
        topicSlug: topics[topics.length - 1]!.slug,
        levelChanged,
      }
    }
    level = LEVEL_ORDER[idx + 1]!
    levelChanged = true
  }
}

/**
 * Compute updated progress after AI marks a topic mastered. Handles the
 * two side-effects: (1) add slug to mastered list (idempotent),
 * (2) advance current_topic to next non-mastered, possibly bumping level.
 */
export function applyMastery(args: {
  level: Level
  masteredTopics: string[]
  masteredSlug: string
}): { level: Level; currentTopicSlug: string; masteredTopics: string[]; levelChanged: boolean } {
  const { level, masteredTopics, masteredSlug } = args
  const updatedMastered = masteredTopics.includes(masteredSlug)
    ? masteredTopics
    : [...masteredTopics, masteredSlug]

  const next = getNextLearningTarget({ currentLevel: level, masteredTopics: updatedMastered })
  return {
    level: next.level,
    currentTopicSlug: next.topicSlug,
    masteredTopics: updatedMastered,
    levelChanged: next.levelChanged,
  }
}
