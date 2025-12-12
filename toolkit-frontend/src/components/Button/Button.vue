<script setup lang="ts">
import { useAttrs } from "vue";
import "./Button.css";
import Loader from "../Loader/Loader.vue";

interface Props {
    isLoading?: boolean;
    isDisabled?: boolean;
    kind?: "primary" | "secondary";
    type?: "submit" | "reset" | "button";
}

const props = defineProps<Props>();
const attrs = useAttrs();
</script>

<template>
    <button
        class="button"
        :data-kind="props.kind ?? 'primary'"
        :disabled="props.isDisabled ?? props.isLoading"
        :type="props.type"
        v-bind="attrs"
    >
        <Loader v-if="props.isLoading" />
        <slot v-else></slot>
    </button>
</template>