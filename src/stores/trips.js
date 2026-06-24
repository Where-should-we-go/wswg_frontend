import { ref } from 'vue'
import { defineStore } from 'pinia'
import { apiGet, apiPost } from '@/services/api'

export const useTripStore = defineStore('trips', () => {
  const trips = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchTrips(groupId) {
    loading.value = true
    error.value = null
    try {
      const path = '/api/trips' + (groupId != null ? `?groupId=${groupId}` : '')
      trips.value = (await apiGet(path)) ?? []
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createTrip({ title, startDate, endDate, groupId }) {
    const body = { title, startDate, endDate }
    if (groupId != null) {
      body.groupId = groupId
    }
    return apiPost('/api/trips', body)
  }

  return { trips, loading, error, fetchTrips, createTrip }
})
