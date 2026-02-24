<template>
  <div>
    <!-- ===== HERO SECTION ===== -->
    <section class="relative min-h-screen flex items-center justify-center overflow-hidden bg-hero-pattern">
      <!-- Animated background orbs -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -left-40 w-80 h-80 bg-accent-red/10 rounded-full blur-3xl animate-pulse-slow" />
        <div class="absolute top-1/3 -right-20 w-96 h-96 bg-accent-flame/8 rounded-full blur-3xl animate-float" />
        <div class="absolute -bottom-40 left-1/3 w-72 h-72 bg-accent-amber/8 rounded-full blur-3xl animate-pulse-slow" style="animation-delay: 1.5s" />
      </div>

      <div class="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        <!-- Badge -->
        <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm font-medium mb-8 animate-fade-in">
          <span class="w-2 h-2 rounded-full bg-accent-red animate-pulse" />
          AI-Powered Voice Tutor · Speak & Learn
        </div>

        <!-- Main Headline -->
        <h1 class="font-display font-black text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-[0.9] tracking-tight mb-6 animate-slide-up">
          <span class="text-white">Learn English.</span>
          <br />
          <span class="text-gradient">Get Roasted.</span>
        </h1>

        <!-- Kazakh subheadline -->
        <p class="text-xl sm:text-2xl text-gray-400 max-w-2xl mx-auto mb-4 animate-slide-up font-medium" style="animation-delay: 0.15s">
          Ағылшын тілін үйрен, <span class="text-accent-amber font-bold">қатты сөгіс ал</span>, бірақ ешқашан ұмытпа.
        </p>

        <!-- English subtitle -->
        <p class="text-lg text-gray-500 max-w-xl mx-auto mb-10 animate-slide-up" style="animation-delay: 0.3s">
          The AI teacher that <span class="text-white font-semibold">roasts your mistakes in Kazakh</span>, then teaches you
          <span class="text-white font-semibold">perfect English</span>. You'll never forget a lesson again.
        </p>

        <!-- CTA Button -->
        <div class="animate-slide-up" style="animation-delay: 0.45s">
          <button
            id="hero-start-btn"
            class="btn-primary text-xl px-10 py-5 animate-glow"
            @click="openModal"
          >
            <span>🔥 Start Suffering (Learning)</span>
          </button>
          <p class="mt-4 text-sm text-gray-600">Free · No credit card · Just pain and progress</p>
        </div>

        <!-- Demo Roast Preview -->
        <div class="mt-16 max-w-2xl mx-auto animate-slide-up" style="animation-delay: 0.6s">
          <div class="glass-card p-6 text-left">
            <div class="flex items-start gap-3">
              <div class="w-10 h-10 rounded-full bg-accent-red/20 flex items-center justify-center text-lg shrink-0">
                😤
              </div>
              <div>
                <p class="text-sm text-accent-red font-semibold mb-1">Qatel Mugalim</p>
                <p class="text-gray-300 leading-relaxed">
                  <span class="text-accent-amber">"20 жасқа келдің,</span> бірақ 'I am went' деп жазасың ба?!
                  Тіпті менің көршінің мысығы 'went' деген past tense екенін біледі!
                  <span class="text-accent-amber">Мынаны жақсылап оқы:"</span>
                </p>
                <div class="mt-3 pl-3 border-l-2 border-accent-red/30">
                  <p class="text-sm text-gray-400">
                    ✅ <span class="text-white">Correct:</span> "I went" (Simple Past) or "I am going" (Present Continuous)
                  </p>
                  <p class="text-sm text-gray-400 mt-1">
                    ❌ <span class="text-accent-red">Wrong:</span> "I am went" — you can't mix "am" + past tense "went"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Scroll indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>

    <!-- ===== HOW IT WORKS ===== -->
    <section id="how-it-works" class="py-24 relative">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <p class="text-accent-red font-semibold text-sm uppercase tracking-wider mb-3">How It Works</p>
          <h2 class="section-heading text-white">
            Three steps to <span class="text-gradient">unforgettable</span> English
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Step 1 -->
          <div class="glass-card-hover p-8 text-center group">
            <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent-red/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
              🎤
            </div>
            <div class="text-accent-red font-display font-bold text-sm mb-2">STEP 01</div>
            <h3 class="font-display font-bold text-xl text-white mb-3">Speak in English</h3>
            <p class="text-gray-400 leading-relaxed">
              Talk to the AI like a real conversation. Ordering food, job interview, casual chat — pick your scenario and speak freely.
            </p>
          </div>

          <!-- Step 2 -->
          <div class="glass-card-hover p-8 text-center group">
            <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent-flame/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
              💀
            </div>
            <div class="text-accent-flame font-display font-bold text-sm mb-2">STEP 02</div>
            <h3 class="font-display font-bold text-xl text-white mb-3">Get Brutally Roasted</h3>
            <p class="text-gray-400 leading-relaxed">
              Made a mistake? The AI will <span class="text-accent-amber">roast you in Kazakh</span> so hard you'll feel it in your bones. Age-calibrated savagery — no mercy.
            </p>
          </div>

          <!-- Step 3 -->
          <div class="glass-card-hover p-8 text-center group">
            <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent-amber/10 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
              📚
            </div>
            <div class="text-accent-amber font-display font-bold text-sm mb-2">STEP 03</div>
            <h3 class="font-display font-bold text-xl text-white mb-3">Actually Learn</h3>
            <p class="text-gray-400 leading-relaxed">
              After the roast, get a <span class="text-white font-medium">perfect, structured grammar explanation</span>. The pain makes the knowledge stick forever.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== ROAST EXAMPLES ===== -->
    <section class="py-24 relative bg-brand-dark/30">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <p class="text-accent-flame font-semibold text-sm uppercase tracking-wider mb-3">Taste The Pain</p>
          <h2 class="section-heading text-white">
            Sample <span class="text-gradient">roasts</span> from your future teacher
          </h2>
        </div>

        <div class="space-y-6">
          <!-- Roast 1 -->
          <div class="glass-card p-6">
            <div class="flex items-center gap-2 mb-3">
              <span class="px-2 py-1 rounded-md bg-accent-red/10 text-accent-red text-xs font-bold">Student, Age 22</span>
              <span class="text-gray-600 text-xs">said: "I am agree with you"</span>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-accent-red/20 flex items-center justify-center text-sm shrink-0">😤</div>
              <p class="text-gray-300">
                <span class="text-accent-amber">"22 жастасың ба?</span> Университетті бітірдің бе, жоқ әлде тек фото ғана түсірдің бе?
                'I am agree' деп жазу — бұл ағылшын тіліне деген қылмыс!
                <span class="text-white font-medium">'Agree' — етістік, оның алдына 'am' қоймайды. Дұрыс жауап: 'I agree with you.'</span>
                Мұны тағы бір рет қате жазсаң, сенің дипломыңды жыртамын! 📜💀"
              </p>
            </div>
          </div>

          <!-- Roast 2 -->
          <div class="glass-card p-6">
            <div class="flex items-center gap-2 mb-3">
              <span class="px-2 py-1 rounded-md bg-accent-flame/10 text-accent-flame text-xs font-bold">Student, Age 17</span>
              <span class="text-gray-600 text-xs">said: "She don't like me"</span>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-accent-flame/20 flex items-center justify-center text-sm shrink-0">🤦</div>
              <p class="text-gray-300">
                <span class="text-accent-amber">"Сенің жасыңда</span> мен үш тілді білдім, ал сен 'she don't' деп жүрсің!
                She, he, it — бұлардың бәрі <span class="text-white font-medium">'does'</span> керек етеді, 'do' емес!
                <span class="text-white font-medium">Дұрыс: 'She doesn't like me.'</span>
                Қыз ұнатпай тұр деп ренжігенше, ағылшыныңды түзе — сонда ұнатуы мүмкін! 😏"
              </p>
            </div>
          </div>

          <!-- Roast 3 -->
          <div class="glass-card p-6">
            <div class="flex items-center gap-2 mb-3">
              <span class="px-2 py-1 rounded-md bg-accent-amber/10 text-accent-amber text-xs font-bold">Student, Age 30</span>
              <span class="text-gray-600 text-xs">said: "I have went to the store"</span>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-8 h-8 rounded-full bg-accent-amber/20 flex items-center justify-center text-sm shrink-0">💀</div>
              <p class="text-gray-300">
                <span class="text-accent-amber">"30 жас!</span> Отыз жас! Осы жасқа дейін 'have went' деп келдің бе?!
                'Have' — present perfect үшін қолданасың, оған <span class="text-white font-medium">past participle 'gone'</span> керек, 'went' емес!
                <span class="text-white font-medium">Дұрыс: 'I have gone to the store'</span> немесе жай ғана <span class="text-white font-medium">'I went to the store.'</span>
                Дүкенге бардым дегеннің өзін дұрыс айта алмасаң, не сатып алдың — кітап алмағаның анық! 📖"
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== SOCIAL PROOF / STATS ===== -->
    <section class="py-20">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div class="font-display font-black text-4xl text-gradient mb-2">98%</div>
            <p class="text-sm text-gray-500">Remember lessons after being roasted</p>
          </div>
          <div>
            <div class="font-display font-black text-4xl text-gradient mb-2">3x</div>
            <p class="text-sm text-gray-500">Faster than traditional methods</p>
          </div>
          <div>
            <div class="font-display font-black text-4xl text-gradient mb-2">🇰🇿</div>
            <p class="text-sm text-gray-500">Made in Kazakhstan with love & pain</p>
          </div>
          <div>
            <div class="font-display font-black text-4xl text-gradient mb-2">24/7</div>
            <p class="text-sm text-gray-500">Your teacher never sleeps, never forgives</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ===== FINAL CTA ===== -->
    <section class="py-24 relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-t from-accent-red/5 to-transparent pointer-events-none" />
      <div class="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 class="section-heading text-white mb-4">
          Ready to get <span class="text-gradient">destroyed</span>?
        </h2>
        <p class="text-lg text-gray-400 mb-8">
          Enter your age, hit the button, and let the most savage teacher in Kazakhstan fix your English. <span class="text-accent-amber font-medium">Ауырмай — шыдамай, ағылшын тілін үйренбейсің!</span>
        </p>
        <button
          id="cta-start-btn"
          class="btn-primary text-xl px-10 py-5"
          @click="openModal"
        >
          <span>💀 I'm Ready. Roast Me.</span>
        </button>
      </div>
    </section>

    <!-- ===== AGE GATE MODAL ===== -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="isModalOpen"
          id="age-modal-overlay"
          class="fixed inset-0 z-[100] flex items-center justify-center p-4"
          @click.self="closeModal"
        >
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/70 backdrop-blur-sm" />

          <!-- Modal Card -->
          <div class="relative z-10 w-full max-w-md glass-card p-8 animate-bounce-in border-accent-red/20">
            <!-- Close button -->
            <button
              id="modal-close-btn"
              class="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
              @click="closeModal"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <!-- Modal Content -->
            <div class="text-center mb-6">
              <div class="text-5xl mb-4">😈</div>
              <h3 class="font-display font-bold text-2xl text-white mb-2">Before we begin...</h3>
              <p class="text-gray-400 text-sm">
                Tell us your age so we can calibrate the <span class="text-accent-red font-semibold">roast intensity</span> properly.
              </p>
            </div>

            <!-- Age Input -->
            <div class="mb-6">
              <label for="age-input" class="block text-sm font-medium text-gray-400 mb-2">Your Age</label>
              <input
                id="age-input"
                v-model.number="userAge"
                type="number"
                min="10"
                max="99"
                placeholder="e.g. 20"
                class="w-full px-4 py-3 bg-brand-black/80 border border-brand-border rounded-xl text-white text-lg text-center font-display font-bold placeholder-gray-600 focus:outline-none focus:border-accent-red/50 focus:ring-2 focus:ring-accent-red/20 transition-all"
                :class="{ 'animate-shake border-accent-red/50': ageError }"
                @keyup.enter="startLearning"
              />
              <Transition name="fade">
                <p v-if="ageError" class="mt-2 text-sm text-accent-red">{{ ageError }}</p>
              </Transition>
            </div>

            <!-- Roast intensity preview -->
            <div v-if="userAge && !ageError" class="mb-6 p-3 rounded-lg bg-brand-black/50 border border-brand-border/30">
              <div class="flex items-center justify-between text-sm mb-2">
                <span class="text-gray-400">Roast Intensity:</span>
                <span :class="intensityColor" class="font-bold">{{ intensityLabel }}</span>
              </div>
              <div class="w-full h-2 bg-brand-border rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500"
                  :class="intensityBarColor"
                  :style="{ width: intensityPercent + '%' }"
                />
              </div>
            </div>

            <!-- Submit Button -->
            <button
              id="start-learning-btn"
              class="w-full btn-primary text-lg py-4"
              :disabled="!userAge || !!ageError"
              @click="startLearning"
            >
              <span>🔥 Start Suffering (Learning)</span>
            </button>

            <p class="mt-4 text-xs text-gray-600 text-center">
              Warning: Side effects include improved English, emotional damage, and uncontrollable laughter.
            </p>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
const router = useRouter()

// Modal state
const isModalOpen = ref(false)
const userAge = ref(null)
const ageError = ref('')

const openModal = () => {
  isModalOpen.value = true
  document.body.style.overflow = 'hidden'
}

const closeModal = () => {
  isModalOpen.value = false
  document.body.style.overflow = ''
}

// Age validation
watch(userAge, (val) => {
  if (!val) {
    ageError.value = ''
    return
  }
  if (val < 10) {
    ageError.value = "You're too young for this level of pain. Come back later! 👶"
  } else if (val > 99) {
    ageError.value = "Respect, ата! But please enter a real age 😄"
  } else {
    ageError.value = ''
  }
})

// Roast intensity based on age
const intensityPercent = computed(() => {
  if (!userAge.value || userAge.value < 10) return 0
  if (userAge.value <= 15) return 40
  if (userAge.value <= 20) return 60
  if (userAge.value <= 25) return 75
  if (userAge.value <= 30) return 85
  return 95
})

const intensityLabel = computed(() => {
  if (intensityPercent.value <= 40) return '🌶️ Mild'
  if (intensityPercent.value <= 60) return '🌶️🌶️ Spicy'
  if (intensityPercent.value <= 75) return '🌶️🌶️🌶️ Painful'
  if (intensityPercent.value <= 85) return '💀 Brutal'
  return '☠️ No Mercy'
})

const intensityColor = computed(() => {
  if (intensityPercent.value <= 40) return 'text-yellow-400'
  if (intensityPercent.value <= 60) return 'text-accent-amber'
  if (intensityPercent.value <= 75) return 'text-accent-flame'
  if (intensityPercent.value <= 85) return 'text-accent-red'
  return 'text-red-400'
})

const intensityBarColor = computed(() => {
  if (intensityPercent.value <= 40) return 'bg-yellow-400'
  if (intensityPercent.value <= 60) return 'bg-accent-amber'
  if (intensityPercent.value <= 75) return 'bg-accent-flame'
  if (intensityPercent.value <= 85) return 'bg-accent-red'
  return 'bg-red-500'
})

// Navigate to chat
const startLearning = () => {
  if (!userAge.value || ageError.value) return
  closeModal()
  router.push({ path: '/chat', query: { age: userAge.value } })
}

// SEO
useHead({
  title: 'Qatel Mugalim — The AI English Tutor That Roasts You in Kazakh 🔥',
  meta: [
    {
      name: 'description',
      content: 'Learn English through brutal, hilarious Kazakh roasts. The AI teacher checks your age and savagely roasts your grammar mistakes — then actually teaches you. Speech-to-Speech powered.'
    }
  ]
})
</script>

<style scoped>
/* Modal transitions */
.modal-enter-active {
  transition: all 0.3s ease-out;
}
.modal-leave-active {
  transition: all 0.2s ease-in;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .glass-card {
  transform: scale(0.9) translateY(20px);
}

/* Fade transition for error messages */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
