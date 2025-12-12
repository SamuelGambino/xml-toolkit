<script setup lang="ts">
import './Account.css'
import Header from '@/components/Header/Header.vue';
import { useSbisStore } from '@/stores/sbis';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';

const { sbisOrg, error } = storeToRefs(useSbisStore());
const { setOrg } = useSbisStore();
const token = ref<string>("");

</script>

<template>
    <form class="account">
        <div class="account__input">
            <label>Токен:</label>
            <input @:input="setOrg({sbisToken: token})" v-model="token" class="account__input-text" />
        </div>
        <div class="account__input">
            <label>Точка продаж:</label>
            <span class="account__input-value">{{ sbisOrg.salesPoint }}</span>
        </div>
        <div class="account__input">
            <label>Прайс лист:</label>
            <span class="account__input-value">{{ sbisOrg.priceList }}</span>
        </div>
        <span class="account__error" v-if="error">Ошибка: {{ error }}</span>
    </form>
</template>