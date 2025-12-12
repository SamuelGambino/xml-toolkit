<script setup lang="ts">
import './BaseLayoutView.css'
import Button from '@/components/Button/Button.vue';
import Header from '@/components/Header/Header.vue';
import Account from '@/components/Account/Account.vue';
import Loader from '@/components/Loader/Loader.vue';
import { useRoute } from 'vue-router';
import { ref, watch } from 'vue';
import { useSbisStore } from '@/stores/sbis.ts';
import { storeToRefs } from 'pinia';

const pageTitle = ref<string>('');
const route = useRoute();
const { sbisOrg, setOrg, getSalesPoints, getPriceLists, getNomenclature, getOrderStatus } = useSbisStore();
const { error, isLoading } = storeToRefs(useSbisStore());

const getData = async () => {
  switch (route.name?.toString()) {
    case 'Аккаунт':
      if (isLoading.value) break;
      if (sbisOrg.sbisToken && !sbisOrg.salesPoint && !sbisOrg.priceList) {
        await getSalesPoints();
      } else if (sbisOrg.sbisToken && sbisOrg.salesPoint && !sbisOrg.priceList) {
        await getPriceLists();
      } else {
        setOrg({ salesPoint: undefined, priceList: undefined });
        await getSalesPoints();
      }
      break;
    case 'Номенклатура':
      if (isLoading.value) break;
      if (sbisOrg.sbisToken && sbisOrg.priceList && sbisOrg.salesPoint) {
        await getNomenclature();
      } else error.value = "В аккаунте нет данных!";
      break;
    case 'Статус заказа':
      if (isLoading.value) break;
      if (sbisOrg.sbisToken && sbisOrg.orderId) {
        await getOrderStatus();
      } else error.value = "Не достаточно данных!";
      break;
    default:
      error.value = "Неизвестное действие!";
  }
}

watch(
  () => route.name,
  (newName) => {
    pageTitle.value = newName?.toString() || 'Аккаунт'
  },
  { immediate: true }
)
</script>

<template>
  <main class="base-layout">
    <Header />

    <section class="base-layout__page">
      <div class="base-layout__content">
        <Account />
        <Button @:click="getData" class="base-layout__btn" :isDisabled="isLoading">
          Получить данные
        </Button>

        <div v-if="isLoading" class="base-layout__loader">
          <Loader />
        </div>
        <router-view v-else />
      </div>
    </section>
  </main>
</template>
