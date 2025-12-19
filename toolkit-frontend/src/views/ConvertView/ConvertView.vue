<script setup lang="ts">
import Table from "@/components/Table/Table.vue";
import Button from "@/components/Button/Button.vue";
import Tools from "@/components/Tools/Tools.vue";
import "./ConvertView.css";
import { computed, ref } from "vue";

const isDisabled = ref<boolean>(true);
</script>

<template>
  <section class="convert">
    <Table  @isSelect="(val: boolean) => isDisabled = val" />
    <Tools>
      <Button :isDisabled="isDisabled">Конвертировать</Button>
    </Tools>
    <div class="convert__xml"></div>
  </section>
</template>
