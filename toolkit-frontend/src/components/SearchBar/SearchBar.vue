<script setup lang="ts">
import "./SearchBar.css"
import { ref, watch } from 'vue'

const props = defineProps<{
    modelValue: string
    placeholder?: string
    isDisabled?: boolean
    debounce?: number
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()

const localValue = ref(props.modelValue)
let timeout: number | undefined

watch(
    () => localValue.value,
    (value) => {
        if (props.debounce) {
            clearTimeout(timeout)
            timeout = window.setTimeout(() => {
                emit('update:modelValue', value)
            }, props.debounce)
        } else {
            emit('update:modelValue', value)
        }
    }
)

watch(
    () => props.modelValue,
    (value) => {
        localValue.value = value
    }
)
</script>

<template>
    <input class="search" type="search" :placeholder="placeholder || 'Search...'" :disabled="isDisabled"
        v-model="localValue" />
</template>
