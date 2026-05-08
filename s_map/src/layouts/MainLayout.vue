<template>
  <div class="app-layout">
    <aside class="sidebar d-flex flex-column text-white">
      <div class="brand d-flex align-items-center">
        <img class="brand-logo" :src="logoSymbol" alt="" />
        <span>S-MAP</span>
      </div>

      <nav class="nav-list d-flex flex-column" aria-label="Main navigation">
        <a
          v-for="item in navigation"
          :key="item.key"
          class="nav-item position-relative d-flex align-items-center text-decoration-none"
          :class="{ active: item.key === activeMenu }"
          href="#"
        >
          <span class="nav-icon d-grid" v-html="item.icon"></span>
          <span>{{ item.label }}</span>
        </a>
      </nav>
    </aside>

    <main class="main-content">
      <header class="topbar d-flex justify-content-between align-items-start">
        <div>
          <h1 class="mb-2">{{ pageTitle }}</h1>
          <p class="m-0">{{ pageDescription }}</p>
        </div>

        <div class="top-actions d-flex align-items-center">
          <div class="user-menu d-flex align-items-center">
            {{ userName }}
            <span class="chevron"></span>
          </div>
        </div>
      </header>

      <slot />
    </main>
  </div>
</template>

<script setup>
import logoSymbol from "../assets/s-map-logo-symbol.svg";

defineProps({
  pageTitle: {
    type: String,
    default: "대시보드",
  },
  pageDescription: {
    type: String,
    default: "실시간 운영 현황을 한눈에 확인하세요.",
  },
  activeMenu: {
    type: String,
    default: "dashboard",
  },
  userName: {
    type: String,
    default: "관리자",
  },
});

const baseIcon = `
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1v-8.5Z" />
  </svg>
`;

const icons = {
  dashboard: baseIcon,
  calendar: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3v4M17 3v4M4 9h16M6 5h12a2 2 0 0 1 2 2v12H4V7a2 2 0 0 1 2-2Z" /></svg>`,
  plan: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9Z" /><path d="m9 12 2 2 4-5" /></svg>`,
  box: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16v12H4Z" /><path d="m8 8 4-4 4 4" /></svg>`,
  line: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h6v6H4ZM14 5h6v6h-6ZM4 15h6v4H4ZM14 15h6v4h-6Z" /></svg>`,
  risk: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 4 10 17H2L12 4Z" /><path d="M12 10v5M12 18h.01" /></svg>`,
  report: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h14v16H5Z" /><path d="M8 9h8M8 13h5M16 14l2 2 3-4" /></svg>`,
};

const navigation = [
  { key: "dashboard", label: "대시보드", icon: icons.dashboard },
  { key: "orders", label: "주문 관리", icon: icons.calendar },
  { key: "production", label: "생산계획", icon: icons.plan },
  { key: "materials", label: "자재 현황", icon: icons.box },
  { key: "lines", label: "라인 현황", icon: icons.line },
  { key: "risks", label: "리스크 분석", icon: icons.risk },
  { key: "reports", label: "보고서", icon: icons.report },
];
</script>

<style scoped>
.app-layout {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  background: var(--color-bg);
  color: var(--color-text-main);
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  background: var(--color-sidebar);
  box-shadow: 8px 0 22px rgba(0, 0, 0, 0.3);
}

.brand {
  height: 122px;
  gap: 14px;
  padding: 0 30px;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 0;
}

.brand-logo {
  width: 46px;
  height: 46px;
  flex: 0 0 auto;
  object-fit: contain;
  padding: 5px;
  border-radius: 8px;
  background: var(--color-logo-bg);
}

.nav-item {
  gap: 18px;
  height: 74px;
  padding: 0 34px;
  color: rgba(255, 255, 255, 0.88);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.1px;
}

.nav-item.active {
  background: var(--color-primary);
  color: #ffffff;
}

.nav-item.active::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 9px;
  background: var(--color-primary-point);
}

.nav-icon {
  width: 28px;
  height: 28px;
  place-items: center;
}

.nav-icon :deep(svg) {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.4;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.main-content {
  min-width: 0;
  padding: 28px 54px 34px 24px;
}

.topbar {
  gap: 24px;
  margin-bottom: 28px;
}

.topbar h1 {
  color: var(--color-text-main);
  font-size: 29px;
  line-height: 1.2;
  font-weight: 700;
  letter-spacing: -0.3px;
}

.topbar p {
  color: var(--color-text-subtle);
  font-size: 18px;
  font-weight: 500;
}

.top-actions {
  gap: 22px;
}

.user-menu {
  gap: 13px;
  color: var(--color-text-main);
  font-size: 17px;
  font-weight: 600;
}

.chevron {
  width: 8px;
  height: 8px;
  display: inline-block;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg) translateY(-2px);
}

@media (max-width: 1280px) {
  .app-layout {
    grid-template-columns: 96px minmax(0, 1fr);
  }

  .brand > span,
  .nav-item span:last-child {
    display: none;
  }

  .brand {
    justify-content: center;
    padding: 0;
  }

  .nav-item {
    justify-content: center;
    padding: 0;
  }
}

@media (max-width: 900px) {
  .app-layout {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
    height: auto;
  }

  .brand {
    height: 74px;
  }

  .brand > span,
  .nav-item span:last-child {
    display: inline;
  }

  .nav-list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }

  .nav-item {
    height: 58px;
    justify-content: flex-start;
    padding: 0 24px;
  }

  .main-content {
    padding: 24px 18px 34px;
  }

  .topbar,
  .top-actions {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
