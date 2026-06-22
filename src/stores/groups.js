import { ref } from 'vue'
import { defineStore } from 'pinia'
import { apiGet, apiPost } from '@/services/api'

export const useGroupStore = defineStore('groups', () => {
  const groups = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchGroups() {
    loading.value = true
    error.value = null
    try {
      groups.value = (await apiGet('/api/groups')) ?? []
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createGroup(groupName) {
    const created = await apiPost('/api/groups', { groupName })
    groups.value.unshift(created)
    return created
  }

  return { groups, loading, error, fetchGroups, createGroup }
})
