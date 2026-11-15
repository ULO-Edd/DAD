<script setup>
import { User, Trophy, Coins } from 'lucide-vue-next'
import { ref, onMounted, nextTick, inject, computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { watch } from 'vue';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'
import { useAPIStore } from '@/stores/api'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import axios from 'axios'
import { toast } from 'vue-sonner'

const API_BASE_URL = inject('apiBaseURL')
const apiStore = useAPIStore()
const router = useRouter()
const openGames = ref([])
const selectedMode = ref('9')
const gObserverTarget = ref(null);
const gObserver = ref(null);
const gLoading = ref(false);
const gPage = ref(1);
const openMatches = ref([])
const mObserverTarget = ref(null);
const mObserver = ref(null);
const mLoading = ref(false);
const mPage = ref(1);
const showHostModal = ref(false)
const showLeaderboardModal = ref(false)
const showStatsModal = ref(false)
const userStats = ref(null)
const statsLoading = ref(false)
const leaderboardEntries = ref([])
const lbLoading = ref(false)
const lbPage = ref(1)
const lbObserverTarget = ref(null)
const lbObserver = ref(null)
const lbMorePages = ref(true)
const publicStats = ref(null)
const isLoggedIn = useAuthStore().isLoggedIn
const isBestOfThree = ref(false)
const wagerAmount = ref(0)
const authStore = useAuthStore()
const userStore = useUserStore()
const userLoggedIn = computed(() => authStore.isLoggedIn)
const userCoins = ref(0)
const hostLoading = ref(false)
const gHasMore = ref(true);
const mHasMore = ref(true);

const setupMatchesObserver = () => {
  if (mObserver.value) mObserver.value.disconnect();

  mObserver.value = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !mLoading.value && openMatches.value.length > 0) {
      getPendingMatches();
    }
  }, { threshold: 0.1 });

  if (mObserverTarget.value) {
    mObserver.value.observe(mObserverTarget.value);
  }
}

const setupGamesObserver = () => {
  if (gObserver.value) gObserver.value.disconnect();

  gObserver.value = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !gLoading.value && openGames.value.length > 0) {
      getPendingGames();
    }
  }, { threshold: 0.1 });

  if (gObserverTarget.value) {
    gObserver.value.observe(gObserverTarget.value);
  }
}

const getPendingGames = async (mode = selectedMode.value) => {
  if (gLoading.value || !gHasMore.value) return;
  gLoading.value = true;

  try {
    const response = await axios.get(`${API_BASE_URL}/games/open`, {
      params: { type: mode, page: gPage.value }
    });
    const newGames = response.data.data;
    if (newGames.length === 0) {
      gHasMore.value = false;
    } else {
      openGames.value = [...openGames.value, ...newGames];
      gPage.value++;
    }
  } finally {
    gLoading.value = false;
  }
}

const getPendingMatches = async (mode = selectedMode.value) => {
  if (mLoading.value || !mHasMore.value) return;
  mLoading.value = true;

  try {
    const response = await axios.get(`${API_BASE_URL}/matches/open`, {
      params: { type: mode, page: mPage.value }
    });
    const newMatches = response.data.data;
    if (newMatches.length === 0) {
      mHasMore.value = false;
    } else {
      openMatches.value = [...openMatches.value, ...newMatches];
      mPage.value++;
    }
  } finally {
    mLoading.value = false;
  }
}

const fetchPublicStats = async () => {
  try {
    const response = await apiStore.getPublicStats()
    publicStats.value = response.data
  } catch (error) {
    console.error("Failed to fetch public stats", error)
  }
}

const openStats = async () => {
  showStatsModal.value = true
  statsLoading.value = true
  try {
    const response = await apiStore.getCurrentUserStats()
    userStats.value = response.data
  } catch (error) {
    console.error("Failed to fetch stats", error)
  } finally {
    statsLoading.value = false
  }
}

const getAvatarUrl = (filename) => {
  return filename
    ? `${API_BASE_URL.replace('/api/v1', '').replace('v1/', '')}/storage/photos_avatars/${filename}`
    : `${API_BASE_URL.replace('/api/v1', '').replace('v1/', '')}/storage/photos_avatars/anonymous.png`;
}

const fetchLeaderboard = async () => {
  if (lbLoading.value || !lbMorePages.value) return;
  lbLoading.value = true;
  try {
    const response = await apiStore.getLeaderboard({ page: lbPage.value });
    const newEntries = response.data.data;
    if (newEntries.length < 10) {
      lbMorePages.value = false;
    }
    leaderboardEntries.value = [...leaderboardEntries.value, ...newEntries];
    lbPage.value++;
  } finally {
    lbLoading.value = false;
  }
}

const openLeaderboard = async () => {
  leaderboardEntries.value = [];
  lbPage.value = 1;
  showLeaderboardModal.value = true;
  await nextTick();
  setupLeaderboardObserver();
  await fetchLeaderboard();
}

const setupLeaderboardObserver = () => {
  if (lbObserver.value) lbObserver.value.disconnect();
  lbObserver.value = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !lbLoading.value && leaderboardEntries.value.length > 0) {
      fetchLeaderboard();
    }
  }, { threshold: 0.1 });
  if (lbObserverTarget.value) {
    lbObserver.value.observe(lbObserverTarget.value);
  }
}

const clickMode = async (mode) => {
  if (selectedMode.value === mode) return;
  selectedMode.value = mode;
  openGames.value = [];
  openMatches.value = [];
  gPage.value = 1;
  mPage.value = 1;
  gHasMore.value = true;
  mHasMore.value = true;
  await Promise.all([getPendingGames(), getPendingMatches()]);
  setupGamesObserver();
  setupMatchesObserver();
}

const startSingle = () => {
  router.push({ name: 'bisca' + selectedMode.value });
}

const joinMatch = async (match) => {
  const cost = match.stake || match.wager || 0;

  if (cost > userCoins.value) {
    toast.error(`Insufficient funds! You need ${cost} coins.`);
    return;
  }

  if (!confirm(`Join match for ${cost} coins?`)) {
    return;
  }

  try {
    await axios.post(`${API_BASE_URL}/matches/${match.id}/join`)
    router.push({
      name: 'multiplayer-match',
      params: { id: match.id },
      query: { type: selectedMode.value }
    })
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to join match');
  }
}

const hostGame = async () => {
  if (isBestOfThree.value) {
    if (wagerAmount.value <= 0) {
      toast.error("Stake must be at least 1 coin.");
      return;
    }
    if (wagerAmount.value > userCoins.value) {
      toast.error("Insufficient coins!");
      return;
    }
  }

  hostLoading.value = true;
  const endpoint = isBestOfThree.value ? '/matches/host' : '/games/host'
  const payload = isBestOfThree.value
    ? { type: parseInt(selectedMode.value), stake: parseInt(wagerAmount.value) }
    : { type: parseInt(selectedMode.value) }

  try {
    const response = await axios.post(`${API_BASE_URL}${endpoint}`, payload)
    const resultId = response.data.match?.id || response.data.id || response.data.data?.id;

    if (!resultId) throw new Error("Missing ID");

    showHostModal.value = false;
    router.push({
      name: isBestOfThree.value ? 'multiplayer-match' : 'multiplayer-game',
      params: { id: resultId },
      query: { type: selectedMode.value }
    })
  } catch (error) {
    if (error.response?.data?.message) {
      toast.error(error.response.data.message);
    } else {
      toast.error('Failed to host game');
    }
  } finally {
    hostLoading.value = false;
  }
}

const joinGame = async (game) => {
  try {
    await axios.post(`${API_BASE_URL}/games/${game.id}/join`)
    router.push({
      name: 'multiplayer-game',
      params: { id: game.id },
      query: { type: selectedMode.value }
    })
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to join game');
  }
}

const openHostModal = (forMatch) => {
  isBestOfThree.value = forMatch;
  showHostModal.value = true;
  wagerAmount.value = 0;
}

watch(() => userLoggedIn, async (isLoggedIn) => {
  if (isLoggedIn) {
    await userStore.fetchCoins()
    userCoins.value = userStore.coins
  } else {
    userStore.coins = 0
  }
}, { immediate: true })

onMounted(async () => {
  await fetchPublicStats();
  if (isLoggedIn) {
    await Promise.all([getPendingGames(), getPendingMatches()]);
    await nextTick();
    setupGamesObserver();
    setupMatchesObserver();
  }
})
</script>

<template>
  <div class="min-h-screen bg-cover bg-center transition-all duration-700">
    <div class="flex flex-col justify-center items-center gap-5 pt-10 pb-10 px-4">

      <Card v-if="publicStats" class="w-full max-w-2xl border-[#a855f7] bg-[#f8f0ff] shadow-sm">
        <CardContent class="p-4">
          <div class="flex justify-around items-center">
            <div class="text-center">
              <p class="text-xs uppercase font-bold opacity-70">Players</p>
              <p class="text-xl font-black">{{ publicStats.total_players }}</p>
            </div>
            <div class="h-8 w-[1px] bg-[#a855f7]/20"></div>
            <div class="text-center">
              <p class="text-xs uppercase font-bold opacity-70">Total Games</p>
              <p class="text-xl font-black">{{ publicStats.total_games }}</p>
            </div>
            <div class="h-8 w-[1px] bg-[#a855f7]/20"></div>
            <div class="text-center">
              <p class="text-xs uppercase font-bold opacity-70">Active</p>
              <p class="text-xl font-black">{{ publicStats.active_games }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div class="relative w-full max-w-md bg-card rounded-lg border shadow-sm overflow-hidden">
        <div class="relative h-14 flex items-center">
          <button @click="clickMode('9')"
            class="h-full flex items-center justify-center font-semibold transition-all duration-500 ease-in-out border-r last:border-r-0"
            :class="{ 'w-2/3 z-10 text-purple-600 bg-purple-500/10': selectedMode === '9', 'w-1/3 z-0 text-muted-foreground/40': selectedMode !== '9' }">
            <span>Bisca de 9</span>
          </button>
          <button @click="clickMode('3')"
            class="h-full flex items-center justify-center font-semibold transition-all duration-500 ease-in-out"
            :class="{ 'w-2/3 z-10 text-purple-600 bg-purple-500/10': selectedMode === '3', 'w-1/3 z-0 text-muted-foreground/40': selectedMode !== '3' }">
            <span>Bisca de 3</span>
          </button>
        </div>
      </div>

      <div class="flex flex-col items-center gap-5 w-[100vw]">
        <Card class="w-full max-w-2xl">
          <CardHeader>
            <CardTitle class="text-3xl font-bold text-center">Single Player</CardTitle>
            <CardDescription class="text-center">Go against one of our bots!</CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="flex justify-center">
              <Button @click="startSingle()" size="lg" variant="secondary"
                class="hover:bg-purple-500 hover:text-slate-200">
                Start Game
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card class="w-full max-w-2xl flex flex-col">
          <CardHeader>
            <CardTitle class="text-3xl font-bold text-center">Multi Player</CardTitle>
            <CardDescription class="text-center">Go one on one with another player!</CardDescription>
          </CardHeader>
          <CardContent class="flex-1 flex flex-col space-y-6">

            <div class="flex flex-col flex-1">
              <div class="flex justify-between items-end mb-2">
                <label class="text-sm font-bold uppercase tracking-wider text-muted-foreground">Open Matches (Best of
                  3)</label>
                <Button v-if="isLoggedIn" @click="openHostModal(true)" size="sm" variant="outline"
                  class="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white font-bold">
                  Host
                </Button>
              </div>
              <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div v-if="openMatches.length === 0" class="p-6 text-center text-sm text-muted-foreground">
                  No open matches.
                </div>
                <div v-else class="max-h-[350px] overflow-y-auto custom-scrollbar p-1">
                  <div v-for="(match, index) in openMatches" :key="match.id" @click="joinMatch(match)"
                    class="flex items-center justify-between p-3 mb-2 border border-transparent rounded-lg cursor-pointer transition-all hover:bg-muted/50 hover:border-purple-500">
                    <div class="flex items-center gap-3">
                      <div
                        class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold bg-red-100 text-red-700">
                        {{ index + 1 }}
                      </div>
                      <div>
                        <div class="font-medium text-sm flex items-center gap-2">
                          Match #{{ match.id }}
                          <span
                            class="flex items-center text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                            <Coins class="w-3 h-3 mr-1" /> {{ match.stake || match.wager }}
                          </span>
                        </div>
                        <div class="text-[10px] text-muted-foreground">Host: {{ match.player1?.nickname || 'Unknown' }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div ref="mObserverTarget" class="h-10 flex items-center justify-center">
                    <span v-if="mLoading" class="text-xs text-purple-500 animate-pulse">Loading...</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-col flex-1">
              <div class="flex justify-between items-end mb-2">
                <label class="text-sm font-medium uppercase tracking-wider text-muted-foreground">Open Games
                  (Single)</label>
                <Button v-if="isLoggedIn" @click="openHostModal(false)" size="sm" variant="outline"
                  class="border-purple-500 text-purple-500 hover:bg-purple-500 hover:text-white font-bold">
                  Host
                </Button>
              </div>
              <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
                <div v-if="openGames.length === 0" class="p-6 text-center text-sm text-muted-foreground">
                  No open games.
                </div>
                <div v-else class="max-h-[350px] overflow-y-auto custom-scrollbar p-1">
                  <div v-for="(game, index) in openGames" :key="game.id" @click="joinGame(game)"
                    class="flex items-center justify-between p-3 mb-2 border border-transparent rounded-lg cursor-pointer transition-all hover:bg-muted/50 hover:border-purple-500">
                    <div class="flex items-center gap-3">
                      <div
                        class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold bg-green-100 text-green-700">
                        {{ index + 1 }}
                      </div>
                      <div>
                        <div class="font-medium text-sm">Host: {{ game.player1?.nickname || 'Anonymous' }}</div>
                      </div>
                    </div>
                  </div>
                  <div ref="gObserverTarget" class="h-10 flex items-center justify-center">
                    <span v-if="gLoading" class="text-xs text-purple-500 animate-pulse">Loading...</span>
                  </div>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>

    <div v-if="showStatsModal"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card class="w-full max-w-sm max-h-2/3 border-purple-500 shadow-2xl">
        <CardHeader class="border-b bg-muted/20">
          <div class="flex justify-between items-center">
            <CardTitle class="flex items-center gap-2">
              <User class="text-yellow-500" /> My Statistics
            </CardTitle>
            <Button variant="ghost" size="sm" @click="showStatsModal = false">X</Button>
          </div>
        </CardHeader>

        <CardContent class="py-6">
          <div v-if="statsLoading" class="flex flex-col items-center py-10 gap-4">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent">
            </div>
            <p class="text-sm text-muted-foreground">Calculating your glory...</p>
          </div>

          <div v-else-if="userStats" class="space-y-6">
            <div class="text-center">
              <h3 class="text-2xl font-bold text-purple-600">{{ userStats.nickname }}</h3>
              <p class="text-sm text-muted-foreground">Performance Overview</p>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div
                class="rounded-lg bg-muted/50 p-4 text-center border border-transparent hover:border-purple-500/30 transition-all">
                <p class="text-xs uppercase text-muted-foreground font-semibold">Total Games</p>
                <p class="text-2xl font-bold">{{ userStats.total_games }}</p>
              </div>
              <div class="rounded-lg bg-purple-500/10 p-4 text-center border border-purple-500/20">
                <p class="text-xs uppercase text-purple-600 font-semibold">Win Rate</p>
                <p class="text-2xl font-bold text-purple-600">{{ userStats.win_rate }}</p>
              </div>
              <div class="rounded-lg bg-green-500/10 p-4 text-center border border-green-500/20">
                <p class="text-xs uppercase text-green-600 font-semibold">Wins</p>
                <p class="text-2xl font-bold text-green-600">{{ userStats.total_wins }}</p>
              </div>
              <div class="rounded-lg bg-red-500/10 p-4 text-center border border-red-500/20">
                <p class="text-xs uppercase text-red-600 font-semibold">Losses</p>
                <p class="text-2xl font-bold text-red-600">{{ userStats.total_losses }}</p>
              </div>
            </div>

            <div class="space-y-2">
              <div class="flex justify-between text-xs font-medium">
                <span>Win/Loss Ratio</span>
                <span>{{ userStats.total_wins }}W - {{ userStats.total_losses }}L</span>
              </div>
              <div class="h-2 w-full bg-red-500/20 rounded-full overflow-hidden flex">
                <div class="bg-green-500 h-full" :style="{ width: userStats.win_rate }"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div v-if="showLeaderboardModal"
      class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card class="w-full max-w-lg max-h-1/2 h-[80vh] flex flex-col border-purple-500 shadow-2xl">
        <CardHeader class="border-b">
          <div class="flex justify-between items-center">
            <CardTitle class="flex items-center gap-2">
              <Trophy class="text-purple-500" /> Leaderboard
            </CardTitle>
            <Button variant="ghost" size="sm" @click="showLeaderboardModal = false">X</Button>
          </div>
        </CardHeader>

        <CardContent class="flex-1 overflow-y-auto custom-scrollbar p-0">
          <div v-for="(user, index) in leaderboardEntries" :key="user.id"
            class="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/30 transition-colors">

            <div class="flex items-center gap-4">
              <span class="font-bold text-muted-foreground w-6 text-center"
                :class="{ 'text-yellow-500': index === 0, 'text-slate-400': index === 1, 'text-orange-400': index === 2 }">
                #{{ index + 1 }}
              </span>
              <img :src="getAvatarUrl(user.photo_avatar_filename)"
                class="h-10 w-10 rounded-full border border-purple-200 object-cover" alt="Avatar" />
              <div>
                <p class="font-semibold text-sm">{{ user.nickname }}</p>
                <p class="text-[10px] text-muted-foreground uppercase tracking-wider">Player</p>
              </div>
            </div>

            <div class="text-right">
              <p class="text-lg font-bold text-purple-600">{{ user.won_games_count }}</p>
              <p class="text-[10px] text-muted-foreground uppercase">Wins</p>
            </div>
          </div>

          <div ref="lbObserverTarget" class="h-20 flex items-center justify-center">
            <span v-if="lbLoading" class="text-purple-500 animate-bounce">Loading rankings...</span>
          </div>
        </CardContent>
      </Card>
    </div>


    <div v-if="showHostModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card class="w-full max-w-sm border-purple-500 shadow-2xl">
        <CardHeader>
          <CardTitle class="text-center">{{ isBestOfThree ? 'Host Match (Best of 3)' : 'Host Game' }}</CardTitle>
        </CardHeader>
        <CardContent class="flex flex-col gap-6 py-4">
          <div v-if="isBestOfThree" class="space-y-2">
            <Label>Wager (Coins)</Label>
            <div class="relative">
              <Coins class="absolute left-3 top-2.5 h-4 w-4 text-yellow-500" />
              <Input v-model="wagerAmount" type="number" min="0" class="pl-9" />
            </div>
            <p class="text-xs text-muted-foreground text-right">Balance: {{ userCoins }}</p>
          </div>
          <div class="flex gap-2">
            <Button variant="outline" class="flex-1" @click="showHostModal = false"
              :disabled="hostLoading">Cancel</Button>
            <Button class="flex-1 bg-purple-600 hover:bg-purple-700" @click="hostGame" :disabled="hostLoading">
              {{ hostLoading ? 'Creating...' : 'Create' }}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-40">
      <Button @click="openLeaderboard" variant="outline" size="icon"
        class="h-12 w-12 rounded-full shadow-lg border-purple-500 bg-card hover:bg-purple-500 hover:text-white transition-all">
        <Trophy class="h-6 w-6" />
      </Button>
      <Button v-if="useAuthStore().isLoggedIn" @click="openStats" variant="outline" size="icon"
        class="h-12 w-12 rounded-full shadow-lg border-purple-500 bg-card hover:bg-purple-500 hover:text-white transition-all">
        <User class="h-6 w-6" />
      </Button>
    </div>

  </div>
</template>
