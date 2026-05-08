<template>
  <button class="chatbot-button" type="button" aria-label="챗봇">
    <svg class="chat-icon" viewBox="0 0 26 22" aria-hidden="true">
      <path
        d="M4 1h18a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H15l-2 4-2-4H4a3 3 0 0 1-3-3V4a3 3 0 0 1 3-3z"
      />
      <circle cx="8" cy="8.5" r="1.5" />
      <circle cx="13" cy="8.5" r="1.5" />
      <circle cx="18" cy="8.5" r="1.5" />
    </svg>
    챗봇
  </button>
</template>

<style scoped>
.chatbot-button {
  position: fixed;
  right: 46px;
  bottom: 30px;
  width: 96px;
  height: 96px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 0;
  border-radius: 50%;
  background: var(--color-navy);
  color: #ffffff;
  font-size: 15px;
  font-weight: 700;
  box-shadow: 0 14px 30px rgba(4, 24, 62, 0.35);
}

.chat-icon {
  width: 36px;
  height: 36px;
  fill: #ffffff;
  stroke: none;
}

.chat-icon circle {
  fill: var(--color-navy);
}

@media (max-width: 900px) {
  .chatbot-button {
    width: 88px;
    height: 88px;
    right: 18px;
    bottom: 18px;
    font-size: 14px;
  }
}
</style>
