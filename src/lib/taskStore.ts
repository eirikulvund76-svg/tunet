// src/lib/taskStore.ts
// Global in-memory store som overlever navigasjon i same nettlesarøkt

type TaskStore = {
  checked: Record<string, boolean>
  date: string
}

const store: TaskStore = {
  checked: {},
  date: new Date().toISOString().split('T')[0]
}

export function getChecked(): Record<string, boolean> {
  const today = new Date().toISOString().split('T')[0]
  if (store.date !== today) {
    store.checked = {}
    store.date = today
  }
  return store.checked
}

export function setChecked(key: string, value: boolean) {
  store.checked[key] = value
}
