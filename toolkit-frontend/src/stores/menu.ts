import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useDebounceFn } from "@vueuse/core"

interface IOtions {
  debounceClose?: number;
  autoOpenOnRoute?: boolean
}

type Action = "open" | "close" | "toggle" | "hover-enter" | "hover-leave" | "route-change";

export const useMenuState = (options: IOtions = {}) => {
  const { debounceClose = 500, autoOpenOnRoute = true } = options;

  const isOpen = ref<Boolean>(false);
  const isHovered = ref<Boolean>(false);
  const route = useRoute();

  const hasActiveRoute = computed(() => {
    return route.path && route.path !== "/"
  });

  const debouncedClose = useDebounceFn(() => {
    if (!hasActiveRoute.value && !isHovered.value) {
      isOpen.value = false;
    }
  }, debounceClose)

  const setMenuState = (action: Action, immediate: boolean = false) => {
    switch (action) {
      case "open":
        isOpen.value = true;
        break;
      case "close":
        if (!hasActiveRoute.value) {
          isOpen.value = false;
        }
        break;
      case "toggle":
        if (hasActiveRoute.value && !isOpen.value) {
          isOpen.value = true;
        } else isOpen.value = !isOpen.value;
        break;
      case "hover-enter":
        isHovered.value = true;
        isOpen.value = true;
        break;
      case "hover-leave":
        isHovered.value = false;
        if (!hasActiveRoute.value) {
          if (immediate) {
            isOpen.value = false;
          } else {
            debouncedClose();
          }
        }
        break;
      case "route-change":
        if (autoOpenOnRoute && hasActiveRoute.value) {
          isOpen.value = true;
        }
        break;

      default:
        console.warn(`Неизвесное действие: ${action}`)
    }
  }

  watch(() => route.path, (newPath, oldPath) => {
    if (newPath !== oldPath) {
      setMenuState('route-change')
    }
  }, { immediate: true });

  // onMounted(() => {
  //   debouncedClose.cancel?.()
  // })

  return {
    isOpen,
    setMenuState,

    openMenu: () => setMenuState('open'),
    closeMenu: () => setMenuState('close'),
    toggleMenu: () => setMenuState('toggle'),
    onMouseEnter: () => setMenuState('hover-enter'),
    onMouseLeave: () => setMenuState('hover-leave'),
  }
}