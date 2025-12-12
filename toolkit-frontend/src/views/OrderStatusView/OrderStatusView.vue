<script setup lang="ts">
import "./OrderStatusView.css";
import { useSbisStore } from "@/stores/sbis";
import { storeToRefs } from "pinia";
import { ref } from "vue";

const { setOrg } = useSbisStore();
const { response } = storeToRefs(useSbisStore());
const orderId = ref<string>("");
</script>

<template>
  <div class="order-status">
    <div class="order-status__input">
      <label>Id:</label>
      <input @:input="setOrg({ orderId: orderId })" v-model="orderId" class="order-status__input-text" />
    </div>
  </div>
  <div class="order-status">
    <VueJsonPretty v-if="response?.orderStatus" :data="response?.orderStatus" />
    <p v-else>Нет данных</p>
  </div>
</template>
