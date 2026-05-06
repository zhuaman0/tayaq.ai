<template>
  <div class="min-h-screen pb-20">
    <!-- Header -->
    <div class="pt-24 pb-8 px-4 sm:px-6 max-w-4xl mx-auto">
      <div class="flex items-center gap-3 mb-2">
        <span class="text-3xl">📚</span>
        <h1 class="font-display font-black text-3xl sm:text-4xl text-white">My Vocabulary</h1>
      </div>
      <p class="text-gray-400 text-sm">{{ words.length }} words saved · Study smart, get roasted less</p>
    </div>

    <!-- Mode Tabs -->
    <div class="px-4 sm:px-6 max-w-4xl mx-auto mb-8">
      <div class="flex gap-2 p-1 bg-brand-card/60 rounded-xl border border-brand-border/30 w-fit">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="px-4 py-2 rounded-lg text-sm font-semibold transition-all"
          :class="activeTab === tab.id
            ? 'bg-accent-red text-white shadow-lg shadow-accent-red/20'
            : 'text-gray-400 hover:text-white'"
          @click="setTab(tab.id)"
        >
          {{ tab.icon }} {{ tab.label }}
        </button>
      </div>
    </div>

    <!-- ===== WORDS TAB ===== -->
    <div v-if="activeTab === 'words'" class="px-4 sm:px-6 max-w-4xl mx-auto space-y-4">
      <!-- Add Word Form -->
      <div class="glass-card p-5">
        <h2 class="font-display font-bold text-white mb-4 flex items-center gap-2">
          <span>➕</span> Add New Word
        </h2>
        <div class="flex gap-2 mb-3">
          <input
            v-model="newWord"
            type="text"
            placeholder="Type a word (e.g. perseverance)"
            class="flex-1 px-4 py-2.5 bg-brand-black border border-brand-border/50 rounded-xl text-white placeholder-gray-600 text-sm outline-none focus:border-accent-red/50 transition-colors"
            @keydown.enter="lookupWord"
          />
          <button
            class="px-4 py-2.5 bg-accent-red/10 border border-accent-red/30 text-accent-red rounded-xl text-sm font-semibold hover:bg-accent-red/20 transition-all disabled:opacity-40"
            :disabled="!newWord.trim() || lookingUp"
            @click="lookupWord"
          >
            {{ lookingUp ? '...' : '🔍 Lookup' }}
          </button>
        </div>

        <!-- Looked-up result editable form -->
        <div v-if="lookupResult" class="space-y-2 border-t border-brand-border/30 pt-4">
          <div>
            <label class="text-xs text-gray-500 uppercase tracking-wide">Definition</label>
            <input v-model="lookupResult.definition" class="word-field" placeholder="Definition..." />
          </div>
          <div>
            <label class="text-xs text-gray-500 uppercase tracking-wide">Example sentence</label>
            <input v-model="lookupResult.example" class="word-field" placeholder="Example..." />
          </div>
          <div>
            <label class="text-xs text-gray-500 uppercase tracking-wide">Kazakh translation</label>
            <input v-model="lookupResult.translation" class="word-field" placeholder="Аудармасы..." />
          </div>
          <button
            class="w-full py-2.5 bg-gradient-to-r from-accent-red to-accent-flame text-white rounded-xl font-bold text-sm mt-2 hover:opacity-90 transition-opacity disabled:opacity-40"
            :disabled="saving"
            @click="saveWord"
          >
            {{ saving ? 'Saving...' : '💾 Save Word' }}
          </button>
        </div>
      </div>

      <!-- Search -->
      <input
        v-if="words.length > 4"
        v-model="search"
        type="text"
        placeholder="🔎 Search your words..."
        class="w-full px-4 py-2.5 bg-brand-card/60 border border-brand-border/30 rounded-xl text-white placeholder-gray-600 text-sm outline-none focus:border-accent-red/50 transition-colors"
      />

      <!-- Loading state -->
      <div v-if="loading" class="text-center py-10 text-gray-500">Loading your words...</div>

      <!-- Error state -->
      <div v-else-if="fetchError" class="glass-card p-5 text-center py-10">
        <p class="text-accent-red font-semibold mb-1">⚠ Failed to load words</p>
        <p class="text-gray-500 text-sm">{{ fetchError }}</p>
        <button class="mt-4 px-4 py-2 text-sm text-accent-red border border-accent-red/30 rounded-xl hover:bg-accent-red/10 transition-all" @click="fetchWords">Retry</button>
      </div>

      <!-- Empty state -->
      <div v-else-if="words.length === 0" class="text-center py-16">
        <p class="text-4xl mb-3">📭</p>
        <p class="text-gray-400 font-medium">No words yet.</p>
        <p class="text-gray-600 text-sm mt-1">Add your first word above to start learning!</p>
      </div>

      <!-- Word List -->
      <div v-else class="space-y-3">
        <div
          v-for="word in filteredWords"
          :key="word.id"
          class="glass-card p-4 flex items-start justify-between gap-3 group"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-baseline gap-2 flex-wrap">
              <span class="font-display font-bold text-white text-lg">{{ word.word }}</span>
              <span v-if="word.translation" class="text-accent-amber text-sm font-medium">· {{ word.translation }}</span>
              <span
                v-if="word.collection_id"
                class="text-xs px-2 py-0.5 rounded-full bg-brand-card border border-brand-border/30 text-gray-400"
              >
                {{ collections.find(c => c.id === word.collection_id)?.emoji }}
                {{ collections.find(c => c.id === word.collection_id)?.name }}
              </span>
            </div>
            <p v-if="word.definition" class="text-gray-400 text-sm mt-0.5 leading-snug">{{ word.definition }}</p>
            <p v-if="word.example" class="text-gray-600 text-xs mt-1 italic">{{ word.example }}</p>
          </div>
          <button
            class="text-gray-700 hover:text-accent-red transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 p-1"
            title="Delete"
            @click="deleteWord(word.id)"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- ===== FLASHCARDS TAB ===== -->
    <div v-else-if="activeTab === 'flashcards'" class="px-4 sm:px-6 max-w-2xl mx-auto">
      <div v-if="words.length < 1" class="text-center py-16">
        <p class="text-4xl mb-3">🃏</p>
        <p class="text-gray-400">Add at least 1 word to start flashcards.</p>
      </div>
      <div v-else>
        <p class="text-center text-gray-500 text-sm mb-6">
          {{ flashIndex + 1 }} / {{ words.length }} · Tap card to flip
        </p>

        <!-- Card -->
        <div class="flashcard-wrapper" @click="flipped = !flipped">
          <div class="flashcard" :class="{ flipped }">
            <!-- Front: word -->
            <div class="flashcard-face flashcard-front">
              <p class="text-xs uppercase tracking-widest text-gray-600 mb-4">Word</p>
              <p class="font-display font-black text-4xl sm:text-5xl text-white text-center">{{ currentFlashcard.word }}</p>
              <p class="text-gray-600 text-sm mt-6">Tap to reveal →</p>
            </div>
            <!-- Back: definition + example + translation -->
            <div class="flashcard-face flashcard-back">
              <p class="text-xs uppercase tracking-widest text-accent-amber mb-3">{{ currentFlashcard.translation }}</p>
              <p class="font-display font-bold text-xl text-white text-center leading-snug mb-4">{{ currentFlashcard.definition }}</p>
              <p v-if="currentFlashcard.example" class="text-gray-400 text-sm italic text-center">"{{ currentFlashcard.example }}"</p>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <div class="flex items-center justify-center gap-4 mt-8">
          <button
            class="px-6 py-2.5 bg-brand-card border border-brand-border/30 rounded-xl text-gray-400 hover:text-white transition-all disabled:opacity-30"
            :disabled="flashIndex === 0"
            @click="prevCard"
          >← Prev</button>
          <button
            class="px-6 py-2.5 bg-accent-red/10 border border-accent-red/30 text-accent-red rounded-xl font-semibold hover:bg-accent-red/20 transition-all"
            @click="shuffleCards"
          >🔀 Shuffle</button>
          <button
            class="px-6 py-2.5 bg-brand-card border border-brand-border/30 rounded-xl text-gray-400 hover:text-white transition-all disabled:opacity-30"
            :disabled="flashIndex === words.length - 1"
            @click="nextCard"
          >Next →</button>
        </div>
      </div>
    </div>

    <!-- ===== QUIZ TAB ===== -->
    <div v-else-if="activeTab === 'quiz'" class="px-4 sm:px-6 max-w-2xl mx-auto">
      <div v-if="words.length < 4" class="text-center py-16">
        <p class="text-4xl mb-3">🧠</p>
        <p class="text-gray-400">Add at least 4 words to start the quiz.</p>
        <p class="text-gray-600 text-sm mt-1">You have {{ words.length }} / 4 words.</p>
      </div>
      <div v-else>
        <!-- Quiz mode picker -->
        <div v-if="!quizStarted" class="text-center space-y-4">
          <p class="text-gray-400 text-sm mb-6">Choose your quiz mode:</p>
          <button
            class="quiz-mode-btn"
            @click="startQuiz('choice')"
          >
            <span class="text-2xl">🎯</span>
            <div class="text-left">
              <p class="font-bold text-white">Multiple Choice</p>
              <p class="text-gray-400 text-sm">See the definition, pick the right word</p>
            </div>
          </button>
          <button
            class="quiz-mode-btn"
            @click="startQuiz('typing')"
          >
            <span class="text-2xl">⌨️</span>
            <div class="text-left">
              <p class="font-bold text-white">Typing Quiz</p>
              <p class="text-gray-400 text-sm">See the definition, type the word</p>
            </div>
          </button>
        </div>

        <!-- Quiz in progress -->
        <div v-else-if="!quizDone">
          <!-- Score bar -->
          <div class="flex items-center justify-between text-sm mb-6">
            <span class="text-gray-500">Question {{ quizIndex + 1 }} / {{ quizQuestions.length }}</span>
            <span class="text-green-400 font-semibold">✓ {{ quizScore }} correct</span>
          </div>

          <!-- Progress bar -->
          <div class="h-1.5 bg-brand-card rounded-full mb-8 overflow-hidden">
            <div
              class="h-full bg-gradient-to-r from-accent-red to-accent-flame transition-all duration-500 rounded-full"
              :style="{ width: `${((quizIndex) / quizQuestions.length) * 100}%` }"
            />
          </div>

          <!-- Question -->
          <div class="glass-card p-6 mb-6">
            <p class="text-xs uppercase tracking-widest text-gray-600 mb-3">Definition</p>
            <p class="text-white text-lg font-medium leading-snug">{{ currentQuestion.definition }}</p>
            <p v-if="currentQuestion.example" class="text-gray-500 text-sm italic mt-2">"{{ currentQuestion.example }}"</p>
          </div>

          <!-- Multiple choice -->
          <div v-if="quizMode === 'choice'" class="space-y-3">
            <button
              v-for="option in currentQuestion.options"
              :key="option"
              class="quiz-option"
              :class="getOptionClass(option)"
              :disabled="!!answered"
              @click="answerChoice(option)"
            >
              {{ option }}
            </button>
          </div>

          <!-- Typing -->
          <div v-else class="space-y-3">
            <input
              ref="typingInput"
              v-model="typingAnswer"
              type="text"
              placeholder="Type the word..."
              class="w-full px-4 py-3 bg-brand-black border border-brand-border/50 rounded-xl text-white text-lg text-center placeholder-gray-600 outline-none focus:border-accent-red/50 transition-colors"
              :class="{
                'border-green-500/60 bg-green-500/5': answered === 'correct',
                'border-accent-red/60 bg-accent-red/5': answered === 'wrong'
              }"
              :disabled="!!answered"
              @keydown.enter="answerTyping"
            />
            <button
              v-if="!answered"
              class="w-full py-3 bg-accent-red/10 border border-accent-red/30 text-accent-red rounded-xl font-bold hover:bg-accent-red/20 transition-all disabled:opacity-40"
              :disabled="!typingAnswer.trim()"
              @click="answerTyping"
            >
              Check ✓
            </button>
            <p v-if="answered === 'wrong'" class="text-center text-gray-400 text-sm">
              Correct answer: <span class="text-white font-bold">{{ currentQuestion.word }}</span>
            </p>
          </div>

          <!-- Next button after answering -->
          <button
            v-if="answered"
            class="w-full mt-4 py-3 bg-brand-card border border-brand-border/30 text-white rounded-xl font-semibold hover:bg-brand-card/80 transition-all"
            @click="nextQuestion"
          >
            {{ quizIndex + 1 === quizQuestions.length ? 'See Results →' : 'Next Question →' }}
          </button>
        </div>

        <!-- Quiz done -->
        <div v-else class="text-center py-8">
          <div class="text-6xl mb-4">{{ scoreEmoji }}</div>
          <h2 class="font-display font-black text-3xl text-white mb-2">
            {{ quizScore }} / {{ quizQuestions.length }}
          </h2>
          <p class="text-gray-400 mb-8">{{ scoreMessage }}</p>
          <div class="flex gap-3 justify-center">
            <button
              class="px-6 py-3 bg-accent-red/10 border border-accent-red/30 text-accent-red rounded-xl font-semibold hover:bg-accent-red/20 transition-all"
              @click="startQuiz(quizMode)"
            >
              🔄 Try Again
            </button>
            <button
              class="px-6 py-3 bg-brand-card border border-brand-border/30 text-gray-400 rounded-xl hover:text-white transition-all"
              @click="quizStarted = false; quizDone = false"
            >
              Change Mode
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== COLLECTIONS TAB ===== -->
    <div v-else-if="activeTab === 'collections'" class="px-4 sm:px-6 max-w-4xl mx-auto space-y-5">

      <!-- Inside a specific collection -->
      <template v-if="activeCollection">
        <!-- Header -->
        <div class="flex items-center gap-3">
          <button
            class="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1"
            @click="activeCollection = null; showAddWords = false"
          >← Back</button>
          <span class="text-3xl">{{ activeCollection.emoji }}</span>
          <div class="flex-1">
            <h2 class="font-display font-bold text-xl text-white">{{ activeCollection.name }}</h2>
            <p class="text-gray-500 text-xs">{{ collectionWords.length }} words</p>
          </div>
        </div>

        <!-- Add words panel -->
        <div class="glass-card p-4">
          <button
            class="flex items-center gap-2 text-accent-red text-sm font-semibold hover:text-accent-flame transition-colors"
            @click="showAddWords = !showAddWords; assignError = ''"
          >
            <span class="text-xs">{{ showAddWords ? '▲' : '▼' }}</span>
            Add Words from My Vocabulary
          </button>
          <div v-if="showAddWords" class="mt-4 space-y-2 max-h-64 overflow-y-auto">
            <p v-if="assignError" class="text-accent-red text-xs px-1 pb-1">⚠ {{ assignError }}</p>
            <div v-if="wordsNotInCollection.length === 0" class="text-gray-500 text-sm text-center py-4">
              All your words are already in this collection.
            </div>
            <div
              v-for="w in wordsNotInCollection"
              :key="w.id"
              class="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-brand-black/40 border border-brand-border/20"
            >
              <div class="min-w-0">
                <span class="text-white font-semibold text-sm">{{ w.word }}</span>
                <span v-if="w.translation" class="text-accent-amber text-xs ml-2">· {{ w.translation }}</span>
                <span v-if="w.collection_id" class="text-gray-600 text-xs ml-2">
                  (from {{ collections.find(c => c.id === w.collection_id)?.name }})
                </span>
              </div>
              <button
                class="flex-shrink-0 text-xs px-3 py-1 rounded-lg bg-accent-red/10 text-accent-red border border-accent-red/20 hover:bg-accent-red/20 transition-all font-semibold disabled:opacity-40"
                :disabled="assigningWordId === w.id"
                @click="assignWord(w.id, activeCollection!.id)"
              >{{ assigningWordId === w.id ? '...' : '+ Add' }}</button>
            </div>
          </div>
        </div>

        <!-- Words in this collection -->
        <div class="space-y-3">
          <div v-if="collectionWords.length === 0" class="text-center py-12">
            <p class="text-3xl mb-2">📭</p>
            <p class="text-gray-400 text-sm">No words yet — click "Add Words" above to fill this collection!</p>
          </div>
          <div
            v-for="word in collectionWords"
            :key="word.id"
            class="glass-card p-4 flex items-start justify-between gap-3 group"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-baseline gap-2 flex-wrap">
                <span class="font-display font-bold text-white text-lg">{{ word.word }}</span>
                <span v-if="word.translation" class="text-accent-amber text-sm font-medium">· {{ word.translation }}</span>
              </div>
              <p v-if="word.definition" class="text-gray-400 text-sm mt-0.5 leading-snug">{{ word.definition }}</p>
              <p v-if="word.example" class="text-gray-600 text-xs mt-1 italic">"{{ word.example }}"</p>
            </div>
            <button
              class="text-gray-700 hover:text-accent-red transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 disabled:opacity-30"
              title="Remove from collection"
              :disabled="assigningWordId === word.id"
              @click="assignWord(word.id, null)"
            >{{ assigningWordId === word.id ? '…' : '✕' }}</button>
          </div>
        </div>
      </template>

      <!-- Collection grid -->
      <template v-else>
        <!-- New collection form -->
        <div class="glass-card p-5">
          <h2 class="font-display font-bold text-white mb-4 flex items-center gap-2">
            <span>🗂️</span> Create New Collection
          </h2>
          <!-- Emoji picker -->
          <div class="flex flex-wrap gap-2 mb-4">
            <button
              v-for="em in collectionEmojis"
              :key="em"
              class="w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all border"
              :class="newColEmoji === em
                ? 'border-accent-red bg-accent-red/10 scale-110'
                : 'border-brand-border/30 bg-brand-black/40 hover:border-accent-red/30'"
              @click="newColEmoji = em"
            >{{ em }}</button>
          </div>
          <!-- Name input -->
          <div class="flex gap-2">
            <input
              v-model="newColName"
              type="text"
              placeholder='Collection name (e.g. Kitchen, Travel, Business...)'
              class="flex-1 px-4 py-2.5 bg-brand-black border border-brand-border/50 rounded-xl text-white placeholder-gray-600 text-sm outline-none focus:border-accent-red/50 transition-colors"
              @keydown.enter="createCollection"
            />
            <button
              class="px-4 py-2.5 bg-gradient-to-r from-accent-red to-accent-flame text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 whitespace-nowrap"
              :disabled="!newColName.trim() || creatingCol"
              @click="createCollection"
            >{{ creatingCol ? '...' : '+ Create' }}</button>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="collections.length === 0" class="text-center py-16">
          <p class="text-5xl mb-4">🗂️</p>
          <p class="text-gray-400 font-medium">No collections yet.</p>
          <p class="text-gray-600 text-sm mt-1">Create your first one above — try "🍳 Kitchen", "✈️ Travel", or "💼 Business"!</p>
        </div>

        <!-- Collection boxes grid -->
        <div v-else class="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div
            v-for="col in collections"
            :key="col.id"
            class="relative glass-card-hover p-5 cursor-pointer text-center group"
            @click="openCollection(col)"
          >
            <!-- Delete button -->
            <button
              class="absolute top-2 right-2 w-6 h-6 rounded-md flex items-center justify-center text-gray-700 hover:text-accent-red hover:bg-accent-red/10 opacity-0 group-hover:opacity-100 transition-all text-xs"
              title="Delete collection"
              @click.stop="deleteCollection(col.id)"
            >✕</button>
            <!-- Emoji -->
            <div class="text-5xl mb-3">{{ col.emoji }}</div>
            <!-- Name -->
            <h3 class="font-display font-bold text-white text-sm leading-tight mb-1 truncate">{{ col.name }}</h3>
            <!-- Word count -->
            <p class="text-gray-500 text-xs">{{ wordCountForCollection(col.id) }} word{{ wordCountForCollection(col.id) !== 1 ? 's' : '' }}</p>
          </div>
        </div>
      </template>
    </div>

    <!-- ===== YOUTUBE TAB ===== -->
    <div v-else-if="activeTab === 'youtube'" class="px-4 sm:px-6 max-w-4xl mx-auto space-y-6">
      <!-- URL Input -->
      <div class="glass-card p-5">
        <h2 class="font-display font-bold text-white mb-1 flex items-center gap-2">
          🎥 Learn from YouTube
        </h2>
        <p class="text-gray-500 text-sm mb-4">Paste any YouTube video with English subtitles — we'll extract the key vocabulary for you.</p>
        <div class="flex gap-2">
          <input
            v-model="ytUrl"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            class="flex-1 px-4 py-2.5 bg-brand-black border border-brand-border/50 rounded-xl text-white placeholder-gray-600 text-sm outline-none focus:border-accent-red/50 transition-colors"
            @keydown.enter="analyzeYoutube"
          />
          <button
            class="px-5 py-2.5 bg-gradient-to-r from-accent-red to-accent-flame text-white rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-40 whitespace-nowrap"
            :disabled="!ytUrl.trim() || ytLoading"
            @click="analyzeYoutube"
          >
            {{ ytLoading ? '⏳ Analyzing...' : '🔍 Analyze' }}
          </button>
        </div>

        <!-- Manual transcript fallback (collapsible) -->
        <button
          type="button"
          class="mt-3 text-xs text-gray-500 hover:text-accent-amber transition-colors flex items-center gap-1"
          @click="showManualPaste = !showManualPaste"
        >
          <span>{{ showManualPaste ? '▼' : '▶' }}</span>
          <span>Auto-fetch not working? Paste transcript manually</span>
        </button>
        <div v-if="showManualPaste" class="mt-3 space-y-2">
          <p class="text-xs text-gray-500 leading-relaxed">
            On YouTube, click <span class="text-white">⋯ More</span> below the video → <span class="text-white">Show transcript</span> → select all (⌘+A / Ctrl+A) → copy → paste here.
          </p>
          <textarea
            v-model="ytManualTranscript"
            rows="6"
            placeholder="0:00 hello and welcome to this video...&#10;0:05 today we will talk about..."
            class="w-full px-3 py-2 bg-brand-black border border-brand-border/50 rounded-lg text-white placeholder-gray-700 text-xs outline-none focus:border-accent-red/50 transition-colors font-mono resize-y"
          />
          <p v-if="ytManualTranscript.trim().length > 0 && ytManualTranscript.trim().length < 50" class="text-xs text-accent-amber">
            Paste at least a few sentences (50+ chars) for the AI to extract useful vocabulary.
          </p>
        </div>

        <p v-if="ytError" class="mt-3 text-sm text-accent-red">{{ ytError }}</p>
      </div>

      <!-- Result -->
      <div v-if="ytResult">
        <!-- Video embed + title -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
          <div class="rounded-xl overflow-hidden border border-brand-border/30 aspect-video">
            <iframe
              :src="`https://www.youtube.com/embed/${ytResult.videoId}`"
              class="w-full h-full"
              frameborder="0"
              allowfullscreen
            />
          </div>
          <div class="flex flex-col justify-between">
            <div>
              <p class="text-xs uppercase tracking-widest text-gray-600 mb-1">Video topic</p>
              <p class="text-white font-bold text-lg leading-snug mb-3">{{ ytResult.titleGuess }}</p>
              <p class="text-gray-500 text-sm">{{ ytResult.words.length }} key words extracted · Click any word to add to your vocabulary</p>
            </div>
            <button
              class="mt-4 px-4 py-2.5 bg-accent-red/10 border border-accent-red/30 text-accent-red rounded-xl text-sm font-semibold hover:bg-accent-red/20 transition-all self-start"
              @click="addAllYtWords"
            >
              ＋ Add All Words to My Vocabulary
            </button>
          </div>
        </div>

        <!-- Extracted vocabulary words -->
        <div class="glass-card p-5">
          <h3 class="font-display font-bold text-white mb-4">Key Vocabulary ({{ ytResult.words.length }} words)</h3>
          <div class="space-y-3">
            <div
              v-for="(w, i) in ytResult.words"
              :key="i"
              class="flex items-start justify-between gap-3 p-3 rounded-xl border transition-all"
              :class="ytSaved.has(w.word)
                ? 'border-green-500/30 bg-green-500/5'
                : 'border-brand-border/20 bg-brand-black/40 hover:border-accent-red/20'"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-baseline gap-2 flex-wrap">
                  <span class="font-display font-bold text-white">{{ w.word }}</span>
                  <span class="text-accent-amber text-sm">· {{ w.translation }}</span>
                </div>
                <p class="text-gray-400 text-sm mt-0.5">{{ w.definition }}</p>
                <p v-if="w.example" class="text-gray-600 text-xs mt-1 italic">"{{ w.example }}"</p>
              </div>
              <button
                class="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                :class="ytSaved.has(w.word)
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-accent-red/10 text-accent-red border border-accent-red/20 hover:bg-accent-red/20'"
                @click="addYtWord(w)"
              >
                {{ ytSaved.has(w.word) ? '✓ Saved' : '+ Save' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Transcript -->
        <div class="glass-card p-5">
          <button
            class="flex items-center justify-between w-full text-left"
            @click="showTranscript = !showTranscript"
          >
            <h3 class="font-display font-bold text-white">📄 Full Transcript</h3>
            <span class="text-gray-500 text-sm">{{ showTranscript ? '▲ Hide' : '▼ Show' }}</span>
          </button>
          <div v-if="showTranscript" class="mt-4 max-h-72 overflow-y-auto">
            <p class="text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">{{ ytResult.fullText }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Not logged in -->
    <div v-if="!user" class="px-4 sm:px-6 max-w-md mx-auto text-center py-20">
      <p class="text-4xl mb-4">🔒</p>
      <p class="text-gray-300 font-medium mb-2">Sign in to save your vocabulary</p>
      <p class="text-gray-600 text-sm mb-6">Your words are saved to your account and synced across devices.</p>
      <NuxtLink to="/login" class="btn-primary">Sign In</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

interface VocabWord {
  id: string
  word: string
  definition: string
  example: string
  translation: string
  created_at: string
  collection_id?: string | null
}

interface Collection {
  id: string
  name: string
  emoji: string
  created_at: string
}

interface QuizQuestion {
  word: string
  definition: string
  example: string
  options: string[]
}

const user = useSupabaseUser()

// ─── State ───────────────────────────────────────────────
const words = ref<VocabWord[]>([])
const loading = ref(false)
const fetchError = ref('')
const search = ref('')
const activeTab = ref<'words' | 'flashcards' | 'quiz' | 'collections' | 'youtube'>('words')

const tabs = [
  { id: 'words', icon: '📖', label: 'My Words' },
  { id: 'flashcards', icon: '🃏', label: 'Flashcards' },
  { id: 'quiz', icon: '🧠', label: 'Quiz' },
  { id: 'collections', icon: '🗂️', label: 'Collections' },
  { id: 'youtube', icon: '🎥', label: 'YouTube' },
]

// ─── Add word ────────────────────────────────────────────
const newWord = ref('')
const lookingUp = ref(false)
const saving = ref(false)
const lookupResult = ref<{ definition: string; example: string; translation: string } | null>(null)

const filteredWords = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return words.value
  return words.value.filter(w =>
    w.word.includes(q) || w.definition.toLowerCase().includes(q) || w.translation.toLowerCase().includes(q)
  )
})

async function fetchWords() {
  if (!user.value) return
  loading.value = true
  fetchError.value = ''
  try {
    const data = await $fetch<VocabWord[]>('/api/vocab')
    words.value = data || []
  } catch (e: any) {
    fetchError.value = e?.data?.statusMessage || e?.message || 'Failed to load words'
  } finally {
    loading.value = false
  }
}

async function lookupWord() {
  if (!newWord.value.trim() || lookingUp.value) return
  lookingUp.value = true
  lookupResult.value = null
  try {
    const data = await $fetch<{ definition: string; example: string; translation: string }>('/api/vocab/lookup', {
      method: 'POST',
      body: { word: newWord.value.trim() },
    })
    lookupResult.value = data
  } catch {
    lookupResult.value = { definition: '', example: '', translation: '' }
  } finally {
    lookingUp.value = false
  }
}

async function saveWord() {
  if (!lookupResult.value || saving.value) return
  saving.value = true
  try {
    const data = await $fetch<VocabWord>('/api/vocab', {
      method: 'POST',
      body: {
        word: newWord.value.trim(),
        definition: lookupResult.value.definition,
        example: lookupResult.value.example,
        translation: lookupResult.value.translation,
      },
    })
    words.value.unshift(data)
    newWord.value = ''
    lookupResult.value = null
  } catch (e: any) {
    console.error(e)
  } finally {
    saving.value = false
  }
}

async function deleteWord(id: string) {
  await $fetch(`/api/vocab/${id}`, { method: 'DELETE' })
  words.value = words.value.filter(w => w.id !== id)
}

// ─── Flashcards ───────────────────────────────────────────
const flashIndex = ref(0)
const flipped = ref(false)
const shuffledWords = ref<VocabWord[]>([])

const currentFlashcard = computed(() => shuffledWords.value[flashIndex.value] || words.value[flashIndex.value])

function nextCard() {
  flipped.value = false
  setTimeout(() => { flashIndex.value++ }, 150)
}

function prevCard() {
  flipped.value = false
  setTimeout(() => { flashIndex.value-- }, 150)
}

function shuffleCards() {
  flipped.value = false
  flashIndex.value = 0
  shuffledWords.value = [...words.value].sort(() => Math.random() - 0.5)
}

// ─── Quiz ─────────────────────────────────────────────────
const quizMode = ref<'choice' | 'typing'>('choice')
const quizStarted = ref(false)
const quizDone = ref(false)
const quizIndex = ref(0)
const quizScore = ref(0)
const quizQuestions = ref<QuizQuestion[]>([])
const answered = ref<'correct' | 'wrong' | null>(null)
const selectedOption = ref<string | null>(null)
const typingAnswer = ref('')
const typingInput = ref<HTMLInputElement | null>(null)

const currentQuestion = computed(() => quizQuestions.value[quizIndex.value])

function buildQuestions(mode: 'choice' | 'typing'): QuizQuestion[] {
  const shuffled = [...words.value].sort(() => Math.random() - 0.5)
  return shuffled.map(w => {
    const others = words.value.filter(x => x.id !== w.id).sort(() => Math.random() - 0.5).slice(0, 3)
    const options = [w.word, ...others.map(o => o.word)].sort(() => Math.random() - 0.5)
    return { word: w.word, definition: w.definition || w.translation, example: w.example, options }
  })
}

function startQuiz(mode: 'choice' | 'typing') {
  quizMode.value = mode
  quizQuestions.value = buildQuestions(mode)
  quizIndex.value = 0
  quizScore.value = 0
  answered.value = null
  selectedOption.value = null
  typingAnswer.value = ''
  quizStarted.value = true
  quizDone.value = false
}

function answerChoice(option: string) {
  if (answered.value) return
  selectedOption.value = option
  if (option === currentQuestion.value.word) {
    answered.value = 'correct'
    quizScore.value++
  } else {
    answered.value = 'wrong'
  }
}

function answerTyping() {
  if (!typingAnswer.value.trim() || answered.value) return
  const isCorrect = typingAnswer.value.trim().toLowerCase() === currentQuestion.value.word.toLowerCase()
  answered.value = isCorrect ? 'correct' : 'wrong'
  if (isCorrect) quizScore.value++
}

function nextQuestion() {
  if (quizIndex.value + 1 >= quizQuestions.value.length) {
    quizDone.value = true
    return
  }
  quizIndex.value++
  answered.value = null
  selectedOption.value = null
  typingAnswer.value = ''
  nextTick(() => typingInput.value?.focus())
}

function getOptionClass(option: string) {
  if (!answered.value) return 'quiz-option-default'
  if (option === currentQuestion.value.word) return 'quiz-option-correct'
  if (option === selectedOption.value) return 'quiz-option-wrong'
  return 'quiz-option-dim'
}

const scoreEmoji = computed(() => {
  const pct = quizScore.value / quizQuestions.value.length
  if (pct === 1) return '🔥'
  if (pct >= 0.8) return '😤'
  if (pct >= 0.6) return '📚'
  return '💀'
})

const scoreMessage = computed(() => {
  const pct = quizScore.value / quizQuestions.value.length
  if (pct === 1) return 'Perfect! Tayaq.ai is slightly less disappointed in you.'
  if (pct >= 0.8) return 'Not bad. Keep going.'
  if (pct >= 0.6) return 'Mediocre. Add more words and study harder.'
  return 'Tayaq.ai is deeply disappointed. Try again.'
})

// ─── YouTube ──────────────────────────────────────────────
interface YtWord { word: string; definition: string; example: string; translation: string }
interface YtResult {
  videoId: string
  titleGuess: string
  words: YtWord[]
  fullText: string
}

const ytUrl = ref('')
const ytManualTranscript = ref('')
const showManualPaste = ref(false)
const ytLoading = ref(false)
const ytError = ref('')
const ytResult = ref<YtResult | null>(null)
const ytSaved = ref<Set<string>>(new Set())
const showTranscript = ref(false)

async function analyzeYoutube() {
  if (!ytUrl.value.trim() || ytLoading.value) return
  const manual = ytManualTranscript.value.trim()
  // If user opened the manual field but pasted too little, block — better than confusing AI output
  if (showManualPaste.value && manual.length > 0 && manual.length < 50) {
    ytError.value = 'Pasted transcript is too short. Paste at least a few sentences.'
    return
  }
  ytLoading.value = true
  ytError.value = ''
  ytResult.value = null
  ytSaved.value = new Set()
  showTranscript.value = false
  try {
    const body: { url: string; transcript?: string } = { url: ytUrl.value.trim() }
    if (manual.length >= 50) body.transcript = manual
    const data = await $fetch<YtResult>('/api/youtube/analyze', {
      method: 'POST',
      body,
    })
    ytResult.value = data
  } catch (e: any) {
    ytError.value = e?.data?.statusMessage || e?.message || 'Failed to analyze video. Try the manual paste option below.'
    showManualPaste.value = true
  } finally {
    ytLoading.value = false
  }
}

async function addYtWord(w: YtWord) {
  if (ytSaved.value.has(w.word)) return
  try {
    const data = await $fetch<VocabWord>('/api/vocab', {
      method: 'POST',
      body: { word: w.word, definition: w.definition, example: w.example, translation: w.translation },
    })
    words.value.unshift(data)
    ytSaved.value = new Set([...ytSaved.value, w.word])
  } catch (e) {
    console.error(e)
  }
}

async function addAllYtWords() {
  if (!ytResult.value) return
  for (const w of ytResult.value.words) {
    if (!ytSaved.value.has(w.word)) await addYtWord(w)
  }
}

// ─── Collections ──────────────────────────────────────────
const collections = ref<Collection[]>([])
const activeCollection = ref<Collection | null>(null)
const newColName = ref('')
const newColEmoji = ref('📚')
const creatingCol = ref(false)
const showAddWords = ref(false)
const assigningWordId = ref<string | null>(null)
const assignError = ref('')

const collectionEmojis = [
  '📚','🍳','✈️','💼','🏋️','🎬','🎵','🏠','💻','🎯',
  '🌍','❤️','🎓','🔬','🌿','🛒','🎨','⚽','🍕','💊',
]

const collectionWords = computed(() =>
  activeCollection.value
    ? words.value.filter(w => w.collection_id === activeCollection.value!.id)
    : []
)

const wordsNotInCollection = computed(() =>
  activeCollection.value
    ? words.value.filter(w => w.collection_id !== activeCollection.value!.id)
    : []
)

function wordCountForCollection(id: string) {
  return words.value.filter(w => w.collection_id === id).length
}

function openCollection(col: Collection) {
  activeCollection.value = col
  showAddWords.value = false
}

async function fetchCollections() {
  if (!user.value) return
  try {
    const data = await $fetch<Collection[]>('/api/vocab/collections')
    collections.value = data || []
  } catch (e) {
    console.error(e)
  }
}

async function createCollection() {
  if (!newColName.value.trim() || creatingCol.value) return
  creatingCol.value = true
  try {
    const data = await $fetch<Collection>('/api/vocab/collections', {
      method: 'POST',
      body: { name: newColName.value.trim(), emoji: newColEmoji.value },
    })
    collections.value.unshift(data)
    newColName.value = ''
    newColEmoji.value = '📚'
  } catch (e) {
    console.error(e)
  } finally {
    creatingCol.value = false
  }
}

async function deleteCollection(id: string) {
  await $fetch(`/api/vocab/collections/${id}`, { method: 'DELETE' })
  collections.value = collections.value.filter(c => c.id !== id)
  words.value = words.value.map(w => w.collection_id === id ? { ...w, collection_id: null } : w)
  if (activeCollection.value?.id === id) activeCollection.value = null
}

async function assignWord(wordId: string, collectionId: string | null) {
  assigningWordId.value = wordId
  assignError.value = ''
  try {
    const updated = await $fetch<VocabWord>(`/api/vocab/${wordId}`, {
      method: 'PATCH',
      body: { collection_id: collectionId },
    })
    words.value = words.value.map(w => w.id === wordId ? { ...w, collection_id: updated.collection_id ?? null } : w)
  } catch (e: any) {
    assignError.value = e?.data?.statusMessage || e?.message || 'Failed to update word'
  } finally {
    assigningWordId.value = null
  }
}

// ─── Tab switch ───────────────────────────────────────────
function setTab(id: string) {
  activeTab.value = id as typeof activeTab.value
  if (id !== 'collections') activeCollection.value = null
  if (id === 'flashcards') {
    flashIndex.value = 0
    flipped.value = false
    shuffledWords.value = [...words.value]
  }
  if (id === 'quiz') {
    quizStarted.value = false
    quizDone.value = false
  }
}

// ─── Init ─────────────────────────────────────────────────
onMounted(() => {
  if (user.value) { fetchWords(); fetchCollections() }
})

watch(user, (u) => { if (u) { fetchWords(); fetchCollections() } })

useHead({ title: 'Vocabulary — Tayaq.ai' })
</script>

<style scoped>
.word-field {
  @apply w-full mt-1 px-3 py-2 bg-brand-black border border-brand-border/40 rounded-lg text-white text-sm outline-none focus:border-accent-red/40 transition-colors;
}

/* Flashcard */
.flashcard-wrapper {
  perspective: 1200px;
  cursor: pointer;
}

.flashcard {
  position: relative;
  width: 100%;
  min-height: 280px;
  transform-style: preserve-3d;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.flashcard.flipped {
  transform: rotateY(180deg);
}

.flashcard-face {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  border-radius: 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border: 1px solid rgba(42, 42, 42, 0.5);
}

.flashcard-front {
  background: rgba(26, 26, 26, 0.8);
}

.flashcard-back {
  background: rgba(239, 68, 68, 0.06);
  border-color: rgba(239, 68, 68, 0.2);
  transform: rotateY(180deg);
}

/* Quiz */
.quiz-mode-btn {
  @apply w-full flex items-center gap-4 p-5 rounded-xl bg-brand-card/60 border border-brand-border/30 hover:border-accent-red/30 hover:bg-accent-red/5 transition-all text-left;
}

.quiz-option {
  @apply w-full py-3 px-5 rounded-xl font-semibold text-left transition-all border;
}

.quiz-option-default {
  @apply bg-brand-card/60 border-brand-border/30 text-white hover:border-accent-red/40 hover:bg-accent-red/5;
}

.quiz-option-correct {
  @apply bg-green-500/10 border-green-500/40 text-green-400;
}

.quiz-option-wrong {
  @apply bg-accent-red/10 border-accent-red/40 text-accent-red;
}

.quiz-option-dim {
  @apply bg-brand-card/30 border-brand-border/20 text-gray-600;
}
</style>
