<script setup lang="ts">
import "./IntroView.css"
</script>

<template>
  <section class="intro-view">
    <header class="intro-view__header">
      <h1 class="intro-view__title">XML Toolkit</h1>
      <p class="intro-view__subtitle">Простой и удобный сервис для работы с XML и конвертацией данных</p>
    </header>

    <div class="intro-view__features">
      <div class="intro-view__feature">
        <img src="@/assets/convert-icon.svg" alt="Конвертер" class="intro-view__feature-icon" />
        <h3 class="intro-view__feature-title">Конвертер XML</h3>
        <p class="intro-view__feature-desc">Преобразуйте файлы таблиц в XML и обратно всего в пару кликов.</p>
      </div>

      <div class="intro-view__feature">
        <img src="@/assets/editor-icon.svg" alt="Редактор" class="intro-view__feature-icon" />
        <h3 class="intro-view__feature-title">Редактор XML</h3>
        <p class="intro-view__feature-desc">Редактируйте структуру XML прямо в браузере с подсветкой синтаксиса.</p>
      </div>

      <div class="intro-view__feature">
        <img src="@/assets/merge-icon.svg" alt="Объединение" class="intro-view__feature-icon" />
        <h3 class="intro-view__feature-title">Объединение XML</h3>
        <p class="intro-view__feature-desc">Сливайте несколько XML-файлов в один без потери данных.</p>
      </div>

      <div class="intro-view__feature">
        <img src="@/assets/export-icon.svg" alt="Экспорт" class="intro-view__feature-icon" />
        <h3 class="intro-view__feature-title">Экспорт изображений</h3>
        <p class="intro-view__feature-desc">Экспортируйте визуализации из таблиц и XML-файлов</p>
      </div>
    </div>
  </section>
</template>
