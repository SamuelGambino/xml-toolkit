<script setup lang="ts">
import "./NomenclatureView.css";
import { useSbisStore } from "@/stores/sbis";
import { storeToRefs } from "pinia";

const { response } = storeToRefs(useSbisStore());
</script>

<template>
  <div class="nomenclature">
    <VueJsonPretty v-if="response?.nomenclature" :data="response?.nomenclature" />
    <p v-else>Нет данных</p>
  </div>
</template>
