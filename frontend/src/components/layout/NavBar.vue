<template>
  <div>
    <NavigationMenu>
      <NavigationMenuList class="justify-around gap-20">
        <NavigationMenuItem v-if="!userLoggedIn">
          <NavigationMenuLink>
            <RouterLink to="/login">Login</RouterLink>
          </NavigationMenuLink>
        </NavigationMenuItem>

        <NavigationMenuItem v-else class="flex flex-row gap-4">
          <NavigationMenuLink v-if="userStore.coins > 0" href="/coins-purchase"
            class="flex flex-row items-center gap-1">
            <div class="flex items-center justify-center w-5 h-5 bg-purple-400 rounded-full shadow-sm">
              <span class="text-[10px] font-bold text-purple-900">$</span>
            </div>

            <span class="text-sm font-medium tabular-nums">
              {{ userStore.coins }} <span class="text-muted-foreground text-xs">Coins</span>
            </span>
          </NavigationMenuLink>
          <NavigationMenuLink>
            <RouterLink to="/user">Profile</RouterLink>
          </NavigationMenuLink>
          <NavigationMenuLink>
            <a href="/home" @click.prevent="logoutClickHandler" class="cursor-pointer">Logout</a>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  </div>
</template>

<script setup>
import { useBiscaStore } from '@/stores/bisca'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import router from '@/router'
import { watch } from 'vue'
import { useUserStore } from '@/stores/user'

const emits = defineEmits(['logout'])
const { userLoggedIn } = defineProps(['userLoggedIn'])

const biscaStore = useBiscaStore()

const logoutClickHandler = () => {
  if (biscaStore.isGameRunning) {
    const confirmLogout = window.confirm(
      'If you leave now this game will count as "FORFEIT". Are you sure you want to logout?',
    )
    if (!confirmLogout) return

    biscaStore.isLoggingOut = true

    biscaStore.quitGame()

    return
  }

  emits('logout')
  router.push('/login')
}

const userStore = useUserStore()

watch(
  () => userLoggedIn,
  async (isLoggedIn) => {
    if (isLoggedIn) {
      await userStore.fetchCoins()
    } else {
      userStore.coins = 0
    }
  }, { immediate: true })
</script>
