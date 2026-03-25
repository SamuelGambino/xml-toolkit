<script setup lang="ts">
import './DropBox.css'
import { computed, onBeforeUnmount, ref } from 'vue'

const props = defineProps<{
  options: { value: string; label: string }[]
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const rootRef = ref<HTMLElement | null>(null)
const searchRef = ref<HTMLInputElement | null>(null)
const isOpen = ref(false)
const searchQuery = ref('')

const selectedOption = computed(() =>
  props.options.find((option) => option.value === props.modelValue)
)

const filteredOptions = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return props.options
  }

  return props.options.filter((option) => option.label.toLowerCase().includes(query))
})

const open = async () => {
  isOpen.value = true
  searchQuery.value = ''
  await Promise.resolve()
  searchRef.value?.focus()
}

const close = () => {
  isOpen.value = false
  searchQuery.value = ''
}

const toggle = () => {
  if (isOpen.value) {
    close()
    return
  }

  void open()
}

const selectOption = (value: string) => {
  emit('update:modelValue', value)
  close()
}

const onDocumentClick = (event: MouseEvent) => {
  const target = event.target as Node | null
  if (!target || !rootRef.value) {
    return
  }

  if (!rootRef.value.contains(target)) {
    close()
  }
}

if (typeof document !== 'undefined') {
  document.addEventListener('click', onDocumentClick)
}

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', onDocumentClick)
  }
})
</script>

<template>
  <div class="drop-box" ref="rootRef">
    <button type="button" class="drop-box__trigger" :class="{ 'drop-box__trigger--open': isOpen }"
      @click="toggle" :aria-expanded="isOpen" aria-haspopup="listbox">
      <span class="drop-box__selected">{{ selectedOption?.label ?? 'Не выбрано' }}</span>
      <span class="drop-box__arrow">▾</span>
    </button>

    <div v-if="isOpen" class="drop-box__panel">
      <input ref="searchRef" v-model="searchQuery" type="text" class="drop-box__search" placeholder="Поиск по списку..."
        @keydown.esc.prevent="close" />

      <ul class="drop-box__list" role="listbox">
        <li v-for="option in filteredOptions" :key="option.value" role="option" :aria-selected="option.value === props.modelValue">
          <button type="button" class="drop-box__option"
            :class="{ 'drop-box__option--selected': option.value === props.modelValue }" @click="selectOption(option.value)">
            {{ option.label }}
          </button>
        </li>

        <li v-if="filteredOptions.length === 0" class="drop-box__empty">
          Ничего не найдено
        </li>
      </ul>
    </div>
  </div>
</template>
