<template>
  <div class="map-page">
    <!-- Header -->
    <div class="map-header">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div class="text-center mb-6">
          <span class="text-4xl mb-2 block">🗺️</span>
          <h1 class="font-display font-bold text-3xl text-white">Student Map</h1>
          <p class="text-gray-400 mt-1">Tayaq.ai learners across Kazakhstan — powered by H3 hexagonal indexing</p>
        </div>

        <!-- Filter Tabs -->
        <div class="flex justify-center gap-2 flex-wrap">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            :class="['tab-btn', { active: activeTab === tab.id }]"
            @click="activeTab = tab.id"
          >
            <span>{{ tab.icon }}</span>
            <span>{{ tab.label }}</span>
            <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Map Container -->
    <div class="map-container">
      <div id="map" ref="mapRef" class="map-element" />
    </div>

    <!-- Stats Bar -->
    <div class="stats-bar">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-6">
          <div class="stat-item">
            <span class="stat-icon">🏫</span>
            <span class="stat-text">{{ schoolsData.length }} Schools</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">📅</span>
            <span class="stat-text">{{ eventsData.length }} Events</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">👨‍🎓</span>
            <span class="stat-text">{{ totalStudents }} Students</span>
          </div>
          <div class="stat-item">
            <span class="stat-icon">⬡</span>
            <span class="stat-text">{{ hexCells }} H3 Cells</span>
          </div>
        </div>
        <div class="text-xs text-gray-500">
          H3 Resolution: 7 (~5 km² per hex)
        </div>
      </div>
    </div>

    <!-- Info Panel -->
    <div v-if="selectedItem" class="info-panel">
      <button class="close-btn" @click="selectedItem = null">✕</button>
      <h3 class="font-display font-bold text-lg text-white">{{ selectedItem.name || selectedItem.title }}</h3>
      <p class="text-sm text-gray-400 mt-1">{{ selectedItem.city }}</p>
      <div v-if="selectedItem.h3_index" class="h3-badge">
        <span class="text-xs text-gray-500">H3 Index:</span>
        <code class="text-xs text-accent-red">{{ selectedItem.h3_index }}</code>
      </div>
      <div v-if="selectedItem.student_count" class="mt-2 text-sm text-gray-300">
        👨‍🎓 {{ selectedItem.student_count }} students
      </div>
      <div v-if="selectedItem.description" class="mt-2 text-sm text-gray-300">
        {{ selectedItem.description }}
      </div>
      <div v-if="selectedItem.date" class="mt-2 text-sm text-gray-400">
        📅 {{ selectedItem.date }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const activeTab = ref('all')
const selectedItem = ref<any>(null)
const mapRef = ref<HTMLElement | null>(null)
const schoolsData = ref<any[]>([])
const eventsData = ref<any[]>([])
const heatmapData = ref<any[]>([])
const totalStudents = ref(0)
const hexCells = ref(0)

const tabs = computed(() => [
  { id: 'all', icon: '🗺️', label: 'All', count: null },
  { id: 'schools', icon: '🏫', label: 'Schools', count: schoolsData.value.length },
  { id: 'events', icon: '📅', label: 'Events', count: eventsData.value.length },
  { id: 'heatmap', icon: '🔥', label: 'Student Density', count: null },
])

// Fetch data from our Nuxt proxy routes → Python H3 service
const fetchData = async () => {
  try {
    const [schools, events, heatmap] = await Promise.all([
      $fetch<any>('/api/geo/schools'),
      $fetch<any>('/api/geo/events'),
      $fetch<any>('/api/geo/heatmap'),
    ])
    schoolsData.value = schools.schools || []
    eventsData.value = events.events || []
    heatmapData.value = heatmap.heatmap || []
    totalStudents.value = heatmap.total_students || 0
    hexCells.value = heatmap.unique_cells || 0
  } catch (e) {
    console.warn('Geo data fetch failed — is the Python H3 service running on port 8000?', e)
  }
}

// Initialize Leaflet map
const initMap = async () => {
  if (!import.meta.client) return

  // Dynamic import Leaflet (client-side only)
  const L = (await import('leaflet')).default

  // Add Leaflet CSS
  if (!document.querySelector('link[href*="leaflet"]')) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)
  }

  // Wait a tick for CSS to load
  await new Promise(resolve => setTimeout(resolve, 300))

  const map = L.map('map').setView([48.0, 68.0], 5) // Center on Kazakhstan

  // Dark tile layer
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  }).addTo(map)

  // Helper: create school markers
  const schoolLayer = L.layerGroup()
  schoolsData.value.forEach((school: any) => {
    const marker = L.circleMarker([school.lat, school.lng], {
      radius: 8 + (school.student_count || 0) / 80,
      fillColor: '#ef4444',
      color: '#fff',
      weight: 2,
      fillOpacity: 0.85,
    })
    marker.bindTooltip(`🏫 ${school.name}`, { direction: 'top', offset: [0, -10] })
    marker.on('click', () => { selectedItem.value = school })
    schoolLayer.addLayer(marker)
  })

  // Helper: create event markers
  const eventLayer = L.layerGroup()
  eventsData.value.forEach((event: any) => {
    const marker = L.circleMarker([event.lat, event.lng], {
      radius: 7,
      fillColor: '#f59e0b',
      color: '#fff',
      weight: 2,
      fillOpacity: 0.85,
    })
    marker.bindTooltip(`📅 ${event.title}`, { direction: 'top', offset: [0, -10] })
    marker.on('click', () => { selectedItem.value = event })
    eventLayer.addLayer(marker)
  })

  // Helper: create H3 hex polygons for heatmap
  const heatmapLayer = L.layerGroup()
  const maxCount = Math.max(...heatmapData.value.map((h: any) => h.student_count), 1)
  heatmapData.value.forEach((cell: any) => {
    const intensity = cell.student_count / maxCount
    const color = intensity > 0.7 ? '#ef4444' : intensity > 0.4 ? '#f59e0b' : '#22c55e'
    const vertices = cell.boundary.map((b: any) => [b.lat, b.lng] as [number, number])
    const polygon = L.polygon(vertices, {
      fillColor: color,
      color: '#333',
      weight: 1,
      fillOpacity: 0.4 + intensity * 0.4,
    })
    polygon.bindTooltip(`⬡ ${cell.student_count} student(s)<br>H3: ${cell.h3_index}`, { direction: 'top' })
    heatmapLayer.addLayer(polygon)
  })

  // Add all layers by default
  schoolLayer.addTo(map)
  eventLayer.addTo(map)
  heatmapLayer.addTo(map)

  // Watch tab changes to toggle layers
  watch(activeTab, (tab) => {
    map.removeLayer(schoolLayer)
    map.removeLayer(eventLayer)
    map.removeLayer(heatmapLayer)

    if (tab === 'all' || tab === 'schools') schoolLayer.addTo(map)
    if (tab === 'all' || tab === 'events') eventLayer.addTo(map)
    if (tab === 'all' || tab === 'heatmap') heatmapLayer.addTo(map)
  })
}

onMounted(async () => {
  await fetchData()
  await initMap()
})

useHead({ title: 'Student Map — Tayaq.ai' })
</script>

<style scoped>
.map-page {
  min-height: calc(100vh - 4rem);
  position: relative;
}

.map-header {
  background: rgba(10, 10, 10, 0.95);
  border-bottom: 1px solid rgba(42, 42, 42, 0.5);
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 1rem;
  background: rgba(17, 17, 17, 0.8);
  border: 1px solid rgba(42, 42, 42, 0.5);
  border-radius: 9999px;
  color: #9ca3af;
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  border-color: rgba(239, 68, 68, 0.3);
  color: white;
}

.tab-btn.active {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.5);
  color: #ef4444;
}

.tab-count {
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 700;
}

.map-container {
  width: 100%;
  height: 55vh;
  min-height: 400px;
}

.map-element {
  width: 100%;
  height: 100%;
  background: #0a0a0a;
}

.stats-bar {
  background: rgba(10, 10, 10, 0.95);
  border-top: 1px solid rgba(42, 42, 42, 0.5);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.stat-icon {
  font-size: 1rem;
}

.stat-text {
  font-size: 0.8125rem;
  color: #d1d5db;
  font-weight: 500;
}

.info-panel {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 320px;
  padding: 1.25rem;
  background: rgba(17, 17, 17, 0.95);
  border: 1px solid rgba(42, 42, 42, 0.5);
  border-radius: 1rem;
  backdrop-filter: blur(24px);
  z-index: 1000;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

.close-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  color: #6b7280;
  font-size: 0.875rem;
  cursor: pointer;
  background: none;
  border: none;
}

.close-btn:hover {
  color: white;
}

.h3-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding: 0.375rem 0.625rem;
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.15);
  border-radius: 0.5rem;
}

/* Override Leaflet defaults for dark theme */
:deep(.leaflet-container) {
  background: #0a0a0a;
}

:deep(.leaflet-control-attribution) {
  background: rgba(0, 0, 0, 0.7) !important;
  color: #6b7280 !important;
  font-size: 10px !important;
}

:deep(.leaflet-control-attribution a) {
  color: #9ca3af !important;
}

:deep(.leaflet-tooltip) {
  background: rgba(17, 17, 17, 0.95) !important;
  border: 1px solid rgba(42, 42, 42, 0.5) !important;
  color: white !important;
  border-radius: 0.5rem !important;
  padding: 0.375rem 0.75rem !important;
  font-size: 0.75rem !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4) !important;
}

:deep(.leaflet-tooltip-top::before) {
  border-top-color: rgba(42, 42, 42, 0.5) !important;
}
</style>
