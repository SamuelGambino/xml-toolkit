<script setup lang="ts">
import "./ProfileView.css"
import Button from '@/components/Button/Button.vue';
import { useSbisStore } from "@/stores/sbis.ts";
import { storeToRefs } from "pinia";

const { sbisOrg, response, error } = storeToRefs(useSbisStore());

const setValue = (type: string, id: number) => {
  switch (type) {
    case "salesPoint":
      sbisOrg.value.salesPoint = id;
      break;
    case "priceList":
      sbisOrg.value.priceList = id;
      break;
    default:
      error.value = "Не извесный тип значения ";
      break;
  }
}
</script>

<template>
  <div class="profile">
    <div class="profile__wrapper">
      <h2>Точки продаж:</h2>
      <div class="profile__content">
        <Button @:click="setValue('salesPoint', point.id)" v-for="point in response?.salesPoints?.salesPoints" :key="point.id"
          kind="secondary">{{ "ID: " + point.id + " | Name: " + point.name }}</Button>
      </div>
      <div class="profile__content">
        <VueJsonPretty v-if="response?.salesPoints" :data="response?.salesPoints" />
        <p v-else>Нет данных</p>
      </div>
    </div>

    <div class="profile__wrapper">
      <h2>Прайс листы:</h2>
      <div class="profile__content">
        <Button @:click="setValue('priceList', price.id)" v-for="price in response?.priceLists?.priceLists" :key="price.id"
          kind="secondary">{{ "ID: " + price.id + " | Name: " + price.name }}</Button>
      </div>
      <div class="profile__content">
        <VueJsonPretty v-if="response?.priceLists" :data="response?.priceLists" />
        <p v-else>Нет данных</p>
      </div>
    </div>
  </div>
</template>
