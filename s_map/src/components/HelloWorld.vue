<script setup>
import { ref } from 'vue'
import viteLogo from '../assets/vite.svg'
import heroImg from '../assets/hero.png'
import vueLogo from '../assets/vue.svg'

const count = ref(0)
</script>

<template>
  <button class="btn btn-primary">Bootstrap OK</button>
  <div class="min-h-screen bg-slate-100 p-10">
    <h1 class="text-3xl font-bold text-blue-600">
      Tailwind 연결 성공
    </h1>

    <button class="mt-4 rounded-lg bg-black px-4 py-2 text-white">
      테스트 버튼
    </button>
  </div>
</template>
