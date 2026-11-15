<template>
  <div class="min-h-screen p-8 flex items-center justify-center">
    <div v-if="loading" class="bg-white border border-gray-300 p-12 text-center shadow-sm max-w-md w-full">
      <div class="flex flex-col items-center gap-6">
        <div class="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    </div>

    <div v-else-if="error"
      class="bg-white border border-gray-300 p-12 text-center shadow-sm max-w-md w-full text-gray-800">
      <svg class="w-12 h-12 mx-auto mb-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="12" r="10" stroke-width="2" />
        <line x1="12" y1="8" x2="12" y2="12" stroke-width="2" />
        <line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2" />
      </svg>
      <h3 class="text-2xl mb-2 text-black">Oops! Something went wrong</h3>
      <p class="text-gray-600 mb-6">{{ error }}</p>
      <button @click="retry"
        class="flex items-center gap-2 px-6 py-3 bg-black text-white cursor-pointer text-base font-medium transition-colors hover:bg-gray-800 mx-auto">
        <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M1 4v6h6M23 20v-6h-6" stroke-width="2" />
          <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" stroke-width="2" />
        </svg>
        Try Again
      </button>
    </div>

    <div v-else-if="authStore.currentUser"
      class="bg-white border border-gray-300 shadow-lg max-w-4xl w-full overflow-hidden">
      <div class="bg-black p-12 text-center relative text-white border-b border-gray-300">
        <div class="mb-6 relative inline-block">
          <img v-if="authStore.currentUser.photo_avatar_filename"
            :src="`${API_BASE_URL.replace('/api/v1', '').replace('v1/', '')}/storage/photos_avatars/${authStore.currentUser.photo_avatar_filename}`"
            :alt="authStore.currentUser.name" class="w-24 h-24 border-[3px] border-white object-cover" />
          <div v-else
            class="w-24 h-24 border-[3px] border-white bg-white text-black flex items-center justify-center text-4xl font-semibold">
            {{ authStore.currentUser.name.charAt(0).toUpperCase() }}
          </div>
          <button @click="triggerFileInput"
            class="absolute bottom-0 right-0 w-9 h-9 bg-white border-2 border-black cursor-pointer flex items-center justify-center transition-colors hover:bg-gray-100">
            <svg class="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                stroke-width="1.5" />
              <circle cx="12" cy="13" r="4" stroke-width="1.5" />
            </svg>
          </button>
          <input ref="fileInput" type="file" accept="image/*" @change="handleAvatarUpload" class="hidden" />
        </div>
        <div>
          <h1 class="text-3xl font-semibold mb-2">{{ authStore.currentUser.name }}</h1>
          <p class="text-base opacity-80">@{{ authStore.currentUser.nickname }}</p>
        </div>
        <div
          class="inline-flex items-center gap-2 bg-white text-black px-4 py-2 mt-6 font-medium text-base border border-gray-300">
          <svg class="w-5 h-5 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10" stroke-width="1.5" />
            <text x="12" y="16" text-anchor="middle" fill="currentColor" font-size="12" font-weight="bold">
              $
            </text>
          </svg>
          <span>{{ authStore.currentUser.coins_balance }} coins</span>
        </div>
      </div>

      <div>
        <div class="flex border-b border-gray-300 bg-gray-50 overflow-x-auto">
          <button :class="[
            'flex-1 p-4 bg-transparent border-none border-b-2 border-transparent cursor-pointer text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 hover:text-black whitespace-nowrap',
            { 'border-b-black text-black bg-white': activeTab === 'info' },
          ]" @click="activeTab = 'info'">
            Profile Info
          </button>
          <button :class="[
            'flex-1 p-4 bg-transparent border-none border-b-2 border-transparent cursor-pointer text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 hover:text-black whitespace-nowrap',
            { 'border-b-black text-black bg-white': activeTab === 'edit' },
          ]" @click="activeTab = 'edit'">
            Edit Profile
          </button>
          <button v-if="!authStore.isAdmin" :class="[
            'flex-1 p-4 bg-transparent border-none border-b-2 border-transparent cursor-pointer text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 hover:text-black whitespace-nowrap',
            { 'border-b-black text-black bg-white': activeTab === 'transaction-history' },
          ]" @click="activeTab = 'transaction-history'">
            Transactions
          </button>
          <button v-if="!authStore.isAdmin" :class="[
            'flex-1 p-4 bg-transparent border-none border-b-2 border-transparent cursor-pointer text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 hover:text-black whitespace-nowrap',
            { 'border-b-black text-black bg-white': activeTab === 'game-history' },
          ]" @click="activeTab = 'game-history'">
            Games
          </button>
          <button v-if="!authStore.isAdmin" :class="[
            'flex-1 p-4 bg-transparent border-none border-b-2 border-transparent cursor-pointer text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 hover:text-black whitespace-nowrap',
            { 'border-b-black text-black bg-white': activeTab === 'match-history' },
          ]" @click="activeTab = 'match-history'">
            Matches
          </button>
          <button :class="[
            'flex-1 p-4 bg-transparent border-none border-b-2 border-transparent cursor-pointer text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 hover:text-black whitespace-nowrap',
            { 'border-b-black text-black bg-white': activeTab === 'password' },
          ]" @click="activeTab = 'password'">
            Security
          </button>
          <button v-if="!authStore.isAdmin" :class="[
            'flex-1 p-4 bg-transparent border-none border-b-2 border-transparent cursor-pointer text-sm font-medium text-gray-600 transition-all hover:bg-gray-100 hover:text-black whitespace-nowrap',
            { 'border-b-black text-black bg-white': activeTab === 'delete' },
          ]" @click="activeTab = 'delete'">
            Delete
          </button>
        </div>

        <div v-if="activeTab === 'info'" class="p-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex items-start gap-4 p-5 bg-white border border-gray-300 transition-shadow hover:shadow-md">
              <div class="w-10 h-10 flex items-center justify-center flex-shrink-0 text-gray-600">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div class="flex-1">
                <label class="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Email</label>
                <p class="text-sm text-black">{{ authStore.currentUser.email }}</p>
              </div>
            </div>

            <div class="flex items-start gap-4 p-5 bg-white border border-gray-300 transition-shadow hover:shadow-md">
              <div class="w-10 h-10 flex items-center justify-center flex-shrink-0 text-gray-600">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div class="flex-1">
                <label class="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Account
                  Type</label>
                <p class="text-sm text-black">
                  {{ authStore.currentUser.type === 'P' ? 'Player' : 'Other' }}
                </p>
              </div>
            </div>

            <div class="flex items-start gap-4 p-5 bg-white border border-gray-300 transition-shadow hover:shadow-md">
              <div class="w-10 h-10 flex items-center justify-center flex-shrink-0 text-gray-600">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div class="flex-1">
                <label class="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Member
                  Since</label>
                <p class="text-sm text-black">{{ formatDate(authStore.currentUser.created_at) }}</p>
              </div>
            </div>

            <div class="flex items-start gap-4 p-5 bg-white border border-gray-300 transition-shadow hover:shadow-md">
              <div class="w-10 h-10 flex items-center justify-center flex-shrink-0 text-gray-600">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div class="flex-1">
                <label class="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Status</label>
                <p>
                  <span :class="[
                    'inline-block px-3 py-1 text-sm font-medium border',
                    authStore.currentUser.blocked
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-black',
                  ]">
                    {{ authStore.currentUser.blocked ? 'Blocked' : 'Active' }}
                  </span>
                </p>
              </div>
            </div>

            <div v-if="authStore.currentUser.email_verified_at"
              class="flex items-start gap-4 p-5 bg-white border border-gray-300 transition-shadow hover:shadow-md">
              <div class="w-10 h-10 flex items-center justify-center flex-shrink-0 text-gray-600">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div class="flex-1">
                <label class="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Email
                  Verified</label>
                <p class="text-sm text-black">
                  {{ formatDate(authStore.currentUser.email_verified_at) }}
                </p>
              </div>
            </div>

            <div class="flex items-start gap-4 p-5 bg-white border border-gray-300 transition-shadow hover:shadow-md">
              <div class="w-10 h-10 flex items-center justify-center flex-shrink-0 text-gray-600">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <polyline points="23 4 23 10 17 10" />
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                </svg>
              </div>
              <div class="flex-1">
                <label class="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">Last
                  Updated</label>
                <p class="text-sm text-black">{{ formatDate(authStore.currentUser.updated_at) }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'edit'" class="p-8">
          <form @submit.prevent="updateProfile" class="max-w-lg">
            <div class="mb-6">
              <label for="name" class="block text-sm font-semibold text-gray-800 mb-2">Name</label>
              <input id="name" v-model="profileForm.name" type="text" required :disabled="updatingProfile"
                class="w-full px-3 py-3 border border-gray-300 text-base transition-colors focus:outline-none focus:border-black disabled:bg-gray-100 disabled:cursor-not-allowed" />
            </div>

            <div class="mb-6">
              <label for="nickname" class="block text-sm font-semibold text-gray-800 mb-2">Nickname</label>
              <input id="nickname" v-model="profileForm.nickname" type="text" required :disabled="updatingProfile"
                class="w-full px-3 py-3 border border-gray-300 text-base transition-colors focus:outline-none focus:border-black disabled:bg-gray-100 disabled:cursor-not-allowed" />
            </div>

            <div class="flex gap-4 mt-8">
              <button type="button" @click="resetProfileForm" :disabled="updatingProfile"
                class="px-6 py-3 border border-black cursor-pointer text-base font-medium transition-all bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                Cancel
              </button>
              <button type="submit" :disabled="updatingProfile"
                class="px-6 py-3 border border-black cursor-pointer text-base font-medium transition-all bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ updatingProfile ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>

            <div v-if="profileMessage" :class="[
              'mt-4 px-3 py-3 border text-sm',
              profileMessageType === 'success'
                ? 'bg-blue-50 border-black text-black'
                : 'bg-red-50 border-black text-black',
            ]">
              {{ profileMessage }}
            </div>
          </form>
        </div>

        <div v-if="activeTab === 'transaction-history' && !authStore.isAdmin" class="p-8">
          <div class="flex flex-wrap gap-4 mb-6 items-end">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-muted-foreground">Type</label>
              <select v-model="filters.type" @change="resetAndFetch"
                class="bg-background border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none">
                <option value="all">All Types</option>
                <option value="credit">Credit (+)</option>
                <option value="debit">Debit (-)</option>
              </select>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-muted-foreground">From</label>
              <input type="date" v-model="filters.startDate" :max="filters.endDate" @change="resetAndFetch"
                class="bg-background border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-muted-foreground">To</label>
              <input type="date" v-model="filters.endDate" :min="filters.startDate" @change="resetAndFetch"
                class="bg-background border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>

            <button @click="clearFilters" class="text-xs text-purple-500 hover:underline pb-2">
              Clear Filters
            </button>
          </div>

          <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div v-if="transactions.length === 0" class="p-6 text-center text-sm text-muted-foreground">
              No transactions yet.
            </div>
            <div v-else class="max-h-[450px] overflow-y-auto custom-scrollbar p-1">
              <div v-for="transaction in transactions" :key="transaction.id"
                class="flex items-center justify-between p-4 mb-3 border rounded-lg transition-all hover:bg-muted/50 hover:border-purple-500"
                :class="[
                  transaction.type === 'credit' ? 'border-green-500/30' : 'border-red-500/30',
                ]">
                <div class="flex items-center gap-4">
                  <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    :class="transaction.type === 'credit'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                      ">
                    <span v-if="transaction.type === 'credit'">+</span>
                    <span v-else>-</span>
                  </div>

                  <div class="flex flex-col">
                    <div class="font-semibold text-sm">
                      {{ transaction.category }}
                    </div>
                    <div class="text-xs text-muted-foreground">
                      {{ new Date(transaction.began_at).toLocaleDateString() }} •
                      {{
                        new Date(transaction.began_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      }}
                    </div>
                  </div>
                </div>

                <div class="text-right">
                  <div class="font-bold text-sm"
                    :class="transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'">
                    {{ transaction.type === 'credit' ? '+' : '-' }}{{ transaction.amount }} coins
                  </div>
                  <div class="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {{ transaction.reference }}
                  </div>
                </div>
              </div>

              <div ref="observerTarget" class="h-10 flex items-center justify-center">
                <span v-if="isLoading" class="text-xs text-purple-500 animate-pulse">Loading more...</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'game-history' && !authStore.isAdmin" class="p-8">
          <div class="flex flex-wrap gap-4 mb-6 items-end">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-muted-foreground">Variant</label>
              <select v-model="filters.variant" @change="resetAndFetch"
                class="bg-background border rounded-md px-3 py-2 text-sm outline-none">
                <option value="all">All Variants</option>
                <option value="3">Bisca 3</option>
                <option value="9">Bisca 9</option>
              </select>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-muted-foreground">From</label>
              <input type="date" v-model="filters.startDate" :max="filters.endDate" @change="resetAndFetch"
                class="bg-background border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-muted-foreground">To</label>
              <input type="date" v-model="filters.endDate" :min="filters.startDate" @change="resetAndFetch"
                class="bg-background border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>

            <button @click="clearFilters" class="text-xs text-purple-500 hover:underline pb-2">
              Clear Filters
            </button>

            <div class="flex flex-row gap-4 ml-auto">
              <div class="flex flex-col gap-1">
                <label class="text-xs font-medium text-muted-foreground">Sort By</label>
                <div class="flex gap-2">
                  <select v-model="filters.sort.column" @change="resetAndFetch"
                    class="bg-background border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="began_at">Date</option>
                    <option value="total_time">Duration</option>
                  </select>

                  <button @click="handleSortChange(filters.sort.column)"
                    class="bg-background border rounded-md px-4 py-2 text-sm outline-none transition-all hover:ring-2 hover:ring-purple-500 flex items-center justify-center min-w-[42px]"
                    title="Toggle Order">
                    <span v-if="filters.sort.order === 'desc'" class="leading-none">↓</span>
                    <span v-else class="leading-none">↑</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div v-if="games.length === 0" class="p-6 text-center text-sm text-muted-foreground">
              No games played yet.
            </div>
            <div v-else class="max-h-[450px] overflow-y-auto custom-scrollbar p-1">
              <div v-for="game in games" :key="game.id"
                class="p-4 mb-3 border rounded-lg transition-all hover:bg-muted/50 hover:border-purple-500">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div :class="game.outcome === 'win' ? 'text-green-500' : 'text-red-500'"
                      class="font-bold uppercase text-xs">
                      {{ game.outcome }}
                    </div>
                    <div>
                      <div class="font-semibold text-sm">Game #{{ game.id }}</div>
                      <div class="text-xs text-muted-foreground">
                        {{ game.variant }} • {{ game.duration }}
                      </div>
                    </div>
                  </div>

                  <div class="text-right">

                    <div class="font-bold text-sm">{{ game.points }} pts</div>
                    <div class="text-[10px] text-muted-foreground">
                      {{ new Date(game.began_at).toLocaleDateString() }} •
                      {{
                        new Date(game.began_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      }}
                    </div>
                  </div>
                </div>

                <div class="mt-3 pt-3 border-t flex gap-4 text-[10px] uppercase font-medium text-muted-foreground">
                  <span>Capotes: {{ game.details.capotes }}</span>
                  <span>Bandeiras: {{ game.details.bandeiras }}</span>
                </div>
              </div>

              <div ref="observerTarget" class="h-10 flex items-center justify-center">
                <span v-if="isLoading" class="text-xs text-purple-500 animate-pulse">Loading more...</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'match-history' && !authStore.isAdmin" class="p-8">
          <div class="flex flex-wrap gap-4 mb-6 items-end">
            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-muted-foreground">Variant</label>
              <select v-model="filters.variant" @change="resetAndFetch"
                class="bg-background border rounded-md px-3 py-2 text-sm outline-none">
                <option value="all">All Variants</option>
                <option value="3">Bisca 3</option>
                <option value="9">Bisca 9</option>
              </select>
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-muted-foreground">From</label>
              <input type="date" v-model="filters.startDate" :max="filters.endDate" @change="resetAndFetch"
                class="bg-background border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>

            <div class="flex flex-col gap-1">
              <label class="text-xs font-medium text-muted-foreground">To</label>
              <input type="date" v-model="filters.endDate" :min="filters.startDate" @change="resetAndFetch"
                class="bg-background border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>

            <button @click="clearFilters" class="text-xs text-purple-500 hover:underline pb-2">
              Clear Filters
            </button>

            <div class="flex flex-row gap-4 ml-auto">
              <div class="flex flex-col gap-1">
                <label class="text-xs font-medium text-muted-foreground">Sort By</label>
                <div class="flex gap-2">
                  <select v-model="filters.sort.column" @change="resetAndFetch"
                    class="bg-background border rounded-md px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="began_at">Date</option>
                    <option value="total_time">Duration</option>
                  </select>

                  <button @click="handleSortChange(filters.sort.column)"
                    class="bg-background border rounded-md px-4 py-2 text-sm outline-none transition-all hover:ring-2 hover:ring-purple-500 flex items-center justify-center min-w-[42px]"
                    title="Toggle Order">
                    <span v-if="filters.sort.order === 'desc'" class="leading-none">↓</span>
                    <span v-else class="leading-none">↑</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div v-if="matches.length === 0" class="p-6 text-center text-sm text-muted-foreground">
              No matches played yet.
            </div>
            <div v-else class="max-h-[450px] overflow-y-auto custom-scrollbar p-1">
              <div v-for="match in matches" :key="match.id"
                class="p-4 mb-3 border rounded-lg transition-all hover:bg-muted/50 hover:border-purple-500">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div :class="match.outcome === 'win' ? 'text-green-500' : 'text-red-500'"
                      class="font-bold uppercase text-xs">
                      {{ match.outcome }}
                    </div>
                    <div>
                      <div class="font-semibold text-sm">vs {{ match.opponent }}</div>
                      <div class="text-xs text-muted-foreground">
                        {{ match.variant }} • {{ match.duration }}
                      </div>
                    </div>
                  </div>

                  <div class="text-right">
                    <div class="font-bold text-sm" :class="{
                      'text-green-600': match.outcome === 'win',
                      'text-red-600': match.outcome === 'loss',
                      'text-gray-600': match.outcome === 'draw',
                    }">
                      {{ match.outcome === 'win' ? '+' : match.outcome === 'loss' ? '-' : ''
                      }}{{ match.amount }} coins
                    </div>

                    <div class="text-[10px] text-muted-foreground">
                      {{ new Date(match.began_at).toLocaleDateString() }} •
                      {{
                        new Date(match.began_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      }}
                    </div>
                  </div>
                </div>

                <div class="mt-3 pt-3 border-t flex gap-4 text-[10px] uppercase font-medium text-muted-foreground">
                  <span>Capotes: {{ match.details.capotes }}</span>
                  <span>Bandeiras: {{ match.details.bandeiras }}</span>
                </div>
              </div>

              <div ref="observerTarget" class="h-10 flex items-center justify-center">
                <span v-if="isLoading" class="text-xs text-purple-500 animate-pulse">Loading more...</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'password'" class="p-8">
          <form @submit.prevent="changePassword" class="max-w-lg">
            <div class="mb-6">
              <label for="current_password" class="block text-sm font-semibold text-gray-800 mb-2">Current
                Password</label>
              <input id="current_password" v-model="passwordForm.current_password" type="password" required
                :disabled="updatingPassword"
                class="w-full px-3 py-3 border border-gray-300 text-base transition-colors focus:outline-none focus:border-black disabled:bg-gray-100 disabled:cursor-not-allowed" />
            </div>

            <div class="mb-6">
              <label for="new_password" class="block text-sm font-semibold text-gray-800 mb-2">New Password</label>
              <input id="new_password" v-model="passwordForm.new_password" type="password" required minlength="8"
                :disabled="updatingPassword"
                class="w-full px-3 py-3 border border-gray-300 text-base transition-colors focus:outline-none focus:border-black disabled:bg-gray-100 disabled:cursor-not-allowed" />
              <small class="block mt-1 text-xs text-gray-600">Password must be at least 8 characters long</small>
            </div>

            <div class="mb-6">
              <label for="confirm_password" class="block text-sm font-semibold text-gray-800 mb-2">Confirm New
                Password</label>
              <input id="confirm_password" v-model="passwordForm.confirm_password" type="password" required
                :disabled="updatingPassword"
                class="w-full px-3 py-3 border border-gray-300 text-base transition-colors focus:outline-none focus:border-black disabled:bg-gray-100 disabled:cursor-not-allowed" />
            </div>

            <div class="flex gap-4 mt-8">
              <button type="button" @click="resetPasswordForm" :disabled="updatingPassword"
                class="px-6 py-3 border border-black cursor-pointer text-base font-medium transition-all bg-white text-black hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                Cancel
              </button>
              <button type="submit" :disabled="updatingPassword"
                class="px-6 py-3 border border-black cursor-pointer text-base font-medium transition-all bg-black text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
                {{ updatingPassword ? 'Updating...' : 'Change Password' }}
              </button>
            </div>

            <div v-if="passwordMessage" :class="[
              'mt-4 px-3 py-3 border text-sm',
              passwordMessageType === 'success'
                ? 'bg-blue-50 border-black text-black'
                : 'bg-red-50 border-black text-black',
            ]">
              {{ passwordMessage }}
            </div>
          </form>
        </div>

        <div v-if="activeTab === 'delete' && !authStore.isAdmin" class="p-8 flex flex-col items-center">
          <div class="max-w-lg">
            <div class="border border-red-600 bg-red-50 p-6 mb-6">
              <div class="flex items-start gap-3">
                <svg class="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" stroke-width="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div>
                  <h3 class="text-lg font-semibold text-red-900 mb-2">Danger Zone</h3>
                  <p class="text-sm text-red-800 mb-2">
                    Deleting your account is permanent and cannot be undone. This action will:
                  </p>
                  <ul class="text-sm text-red-800 list-disc list-inside space-y-1">
                    <li>Permanently delete all your account data</li>
                    <li>
                      Forfeit your current coin balance of
                      <strong>{{ authStore.currentUser.coins_balance }} coins</strong>
                    </li>
                    <li>Remove your access to all games and matches</li>
                    <li>Delete your profile and all associated information</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="bg-white border border-gray-300 p-6">
              <h4 class="text-base font-semibold text-gray-900 mb-4">Are you absolutely sure?</h4>
              <p class="text-sm text-gray-600 mb-4">
                To confirm deletion, please type your email address:
                <strong class="text-black">{{ authStore.currentUser.email }}</strong>
              </p>

              <input v-model="deleteConfirmEmail" type="text" placeholder="Enter your email to confirm"
                class="w-full px-3 py-3 border border-gray-300 text-base mb-4 focus:outline-none focus:border-red-600" />

              <div class="flex gap-4">
                <button type="button" @click="activeTab = 'info'"
                  class="flex-1 px-6 py-3 border border-gray-300 cursor-pointer text-base font-medium transition-all bg-white text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button @click="showDeleteConfirmation = true"
                  :disabled="deleteConfirmEmail !== authStore.currentUser.email"
                  class="flex-1 px-6 py-3 border border-red-600 cursor-pointer text-base font-medium transition-all bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600">
                  Delete My Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showDeleteConfirmation"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      @click.self="showDeleteConfirmation = false">
      <div class="bg-white border border-gray-300 max-w-md w-full shadow-xl">
        <div class="p-6 border-b border-gray-300">
          <h3 class="text-xl font-semibold text-gray-900">Final Confirmation</h3>
        </div>

        <div class="p-6">
          <div class="flex items-start gap-3 mb-4">
            <svg class="w-12 h-12 text-red-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
            <div>
              <p class="text-base text-gray-900 font-semibold mb-2">
                This is your last chance to cancel.
              </p>
              <p class="text-sm text-gray-600">
                Once you click "Yes, Delete My Account", your account and all associated data will
                be permanently deleted. You will lose your
                <strong>{{ authStore.currentUser.coins_balance }} coins</strong> forever.
              </p>
            </div>
          </div>

          <div v-if="deletingAccount" class="text-center py-4">
            <div class="spinner mx-auto mb-3"></div>
            <p class="text-sm text-gray-600">Deleting your account...</p>
          </div>
        </div>

        <div class="p-6 border-t border-gray-300 flex gap-3">
          <button @click="showDeleteConfirmation = false" :disabled="deletingAccount"
            class="flex-1 px-6 py-3 border border-gray-300 cursor-pointer text-base font-medium transition-all bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            Cancel
          </button>
          <button @click="deleteAccount" :disabled="deletingAccount"
            class="flex-1 px-6 py-3 border border-red-600 cursor-pointer text-base font-medium transition-all bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
            Yes, Delete My Account
          </button>
        </div>
      </div>
    </div>

    <div v-else-if="!authStore.isLoggedIn"
      class="bg-white border border-gray-300 p-12 text-center shadow-sm max-w-md w-full">
      <div class="flex flex-col items-center gap-6">
        <div class="spinner"></div>
        <p>Redirecting to login...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject, reactive, watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useAPIStore } from '@/stores/api'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'

const authStore = useAuthStore()
const apiStore = useAPIStore()
const router = useRouter()
const API_BASE_URL = inject('apiBaseURL')

const loading = ref(false)
const error = ref(null)
const activeTab = ref('info')
const fileInput = ref(null)

const profileForm = reactive({
  name: '',
  nickname: '',
})
const updatingProfile = ref(false)
const profileMessage = ref('')
const profileMessageType = ref('')

const passwordForm = reactive({
  current_password: '',
  new_password: '',
  confirm_password: '',
})
const updatingPassword = ref(false)
const passwordMessage = ref('')
const passwordMessageType = ref('')

const deleteConfirmEmail = ref('')
const showDeleteConfirmation = ref(false)
const deletingAccount = ref(false)

const transactions = ref([])
const games = ref([])
const matches = ref([])

const observerTarget = ref(null)
const observer = ref(null)
const isLoading = ref(false)

const pagination = ref({
  transactions: { page: 1, hasMore: true },
  games: { page: 1, hasMore: true },
  matches: { page: 1, hasMore: true },
})

const filters = ref({
  type: 'all',
  variant: 'all',
  startDate: '',
  endDate: '',
  sort: {
    column: 'began_at',
    order: 'desc',
  },
})

const handleSortChange = (column) => {
  if (filters.value.sort.column === column) {
    filters.value.sort.order = filters.value.sort.order === 'asc' ? 'desc' : 'asc'
  } else {
    filters.value.sort.column = column
    filters.value.sort.order = 'desc'
  }
  resetAndFetch()
}

watch(activeTab, async (newTab) => {
  if (newTab !== 'transaction-history' && newTab !== 'game-history' && newTab !== 'match-history')
    return

  await nextTick()

  if (newTab === 'transaction-history' && transactions.value.length > 0) return
  if (newTab === 'game-history' && games.value.length > 0) return
  if (newTab === 'match-history' && matches.value.length > 0) return

  await fetchData()
  setupObserver()
})

const fetchData = async () => {
  const currentTab = activeTab.value
  const isTransaction = currentTab === 'transaction-history'
  const isGame = currentTab === 'game-history'
  const isMatch = currentTab === 'match-history'

  let state
  if (isTransaction) state = pagination.value.transactions
  else if (isGame) state = pagination.value.games
  else if (isMatch) state = pagination.value.matches

  if (isLoading.value || !state || !state.hasMore) return
  isLoading.value = true

  try {
    let newData = []

    if (isTransaction) {
      const apiParams = {
        page: state.page,
        type:
          filters.value.type === 'credit' ? 'C' : filters.value.type === 'debit' ? 'D' : undefined,
        date_from: filters.value.startDate || undefined,
        date_to: filters.value.endDate || undefined,
      }

      const response = await apiStore.getCurrentUserTransactions(apiParams)
      const apiTxns = response.data.data

      newData = apiTxns.map((txn) => ({
        id: txn.id.toString(),
        type: txn.type.type === 'D' ? 'debit' : 'credit',
        category: txn.type.name,
        amount: Math.abs(txn.coins),
        began_at: txn.transaction_datetime,
        reference: txn.match_id
          ? `Match #${txn.match_id}`
          : txn.game_id
            ? `Game #${txn.game_id}`
            : 'N/A',
      }))

      transactions.value.push(...newData)
    }

    const gameMatchParams = {
      page: state.page,
      type: filters.value.variant !== 'all' ? filters.value.variant : undefined,
      status: 'Ended',
      date_from: filters.value.startDate || undefined,
      date_to: filters.value.endDate || undefined,
      sort_by: filters.value.sort.column,
      sort_direction: filters.value.sort.order,
    }

    if (isGame) {
      const response = await apiStore.getCurrentUserGames(gameMatchParams)
      const apiGames = response.data.data

      newData = apiGames.map((game) => {
        let outcome = 'loss'
        if (game.game_status === 'E') {
          if (game.total_time < 9999) outcome = 'win'
        }
        if (game.winner_user_id === authStore.currentUser.id) outcome = 'win'

        return {
          id: game.id,
          variant: `Type ${game.type}`,
          outcome: outcome,
          opponent: null,
          amount: game.total_points || 0,
          points: game.player1_user_id === authStore.currentUser.id
            ? game.player1_points
            : game.player2_points,
          duration: `${Math.floor(game.total_time / 60)}m ${game.total_time % 60}s`,
          began_at: game.began_at,
          details: {
            capotes: 0,
            bandeiras: 0,
          },
        }
      })
      games.value.push(...newData)
    }
    if (isMatch) {
      const response = await apiStore.getCurrentUserMatches(gameMatchParams)
      const apiMatches = response.data.data

      newData = apiMatches.map((game) => {
        const isPlayer1 = game.player1_user_id === authStore.currentUser.id
        const opponent = isPlayer1 ? game.player2 : game.player1

        let outcome = 'loss'
        if (game.is_draw) outcome = 'draw'
        else if (game.winner_user_id === authStore.currentUser.id) outcome = 'win'

        let stakeAmount = 0
        if (game.stake) {
          stakeAmount = parseFloat(game.stake)
        }

        let displayAmount = 0

        if (outcome === 'win') {
          displayAmount = stakeAmount
        } else if (outcome === 'loss') {
          displayAmount = stakeAmount
        }

        return {
          id: game.id,
          variant: `Type ${game.type}`,
          outcome: outcome,
          opponent: opponent?.nickname || 'Unknown Player',
          amount: displayAmount,
          duration: `${Math.floor(game.total_time / 60)}m ${game.total_time % 60}s`,
          began_at: game.began_at,
          details: {
            capotes: 0,
            bandeiras: 0,
          },
        }
      })
      matches.value.push(...newData)
    }

    if (newData.length < 10) state.hasMore = false
    state.page++
  } catch (error) {
    console.error('Fetch failed', error)
  } finally {
    isLoading.value = false
  }
}

const setupObserver = () => {
  if (observer.value) observer.value.disconnect()

  const scrollContainer = document.querySelector('.custom-scrollbar')

  observer.value = new IntersectionObserver(
    async (entries) => {
      const isGame = activeTab.value === 'game-history'
      const isMatch = activeTab.value === 'match-history'

      let hasMore = false
      if (activeTab.value === 'transaction-history') hasMore = pagination.value.transactions.hasMore
      else if (isGame) hasMore = pagination.value.games.hasMore
      else if (isMatch) hasMore = pagination.value.matches.hasMore

      if (entries[0].isIntersecting && !isLoading.value && hasMore) {
        fetchData()
      }
    },
    {
      root: scrollContainer,
      threshold: 0.1,
      rootMargin: '100px',
    },
  )

  if (observerTarget.value) observer.value.observe(observerTarget.value)
}

const resetAndFetch = async () => {
  if (activeTab.value === 'transaction-history') {
    transactions.value = []
    pagination.value.transactions = { page: 1, hasMore: true }
  }

  if (activeTab.value === 'game-history') {
    games.value = []
    pagination.value.games = { page: 1, hasMore: true }
  }

  if (activeTab.value === 'match-history') {
    matches.value = []
    pagination.value.matches = { page: 1, hasMore: true }
  }

  await nextTick()
  await fetchData()
  setupObserver()
}

const clearFilters = () => {
  const isGameOrMatch = activeTab.value === 'game-history' || activeTab.value === 'match-history'
  const defaultSortColumn = isGameOrMatch ? 'began_at' : 'transaction_datetime'

  const isAlreadyDefault =
    filters.value.startDate === '' &&
    filters.value.endDate === '' &&
    filters.value.sort.column === defaultSortColumn &&
    filters.value.sort.order === 'desc' &&
    (isGameOrMatch
      ? filters.value.variant === 'all' && filters.value.outcome === 'all'
      : filters.value.type === 'all')

  if (isAlreadyDefault) {
    return
  }

  if (isGameOrMatch) {
    filters.value.variant = 'all'
  } else {
    filters.value.type = 'all'
  }

  filters.value.startDate = ''
  filters.value.endDate = ''
  filters.value.sort = {
    column: defaultSortColumn,
    order: 'desc',
  }

  resetAndFetch()
}

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const fetchProfile = async () => {
  loading.value = true
  error.value = null

  try {
    const response = await apiStore.getAuthUser()
    authStore.currentUser = response.data
    resetProfileForm()
  } catch (err) {
    error.value = err.response?.data?.message || 'Failed to fetch user profile'

    if (err.response?.status === 401) {
      await authStore.logout()
      router.push('/login')
    }
  } finally {
    loading.value = false
  }
}

const retry = () => {
  fetchProfile()
}

const resetProfileForm = () => {
  profileForm.name = authStore.currentUser?.name || ''
  profileForm.nickname = authStore.currentUser?.nickname || ''
  profileMessage.value = ''
}

const resetPasswordForm = () => {
  passwordForm.current_password = ''
  passwordForm.new_password = ''
  passwordForm.confirm_password = ''
  passwordMessage.value = ''
}

const updateProfile = async () => {
  profileMessage.value = ''

  if (!profileForm.name.trim() || !profileForm.nickname.trim()) {
    profileMessage.value = 'Name and nickname are required'
    profileMessageType.value = 'error'
    return
  }

  updatingProfile.value = true

  try {
    const response = await axios.put(`${API_BASE_URL}/users/me`, {
      name: profileForm.name,
      nickname: profileForm.nickname,
    })

    authStore.currentUser = response.data
    profileMessage.value = 'Profile updated successfully!'
    profileMessageType.value = 'success'
  } catch (err) {
    profileMessage.value = err.response?.data?.message || 'Failed to update profile'
    profileMessageType.value = 'error'
  } finally {
    updatingProfile.value = false
  }
}

const changePassword = async () => {
  passwordMessage.value = ''

  if (passwordForm.new_password !== passwordForm.confirm_password) {
    passwordMessage.value = 'New passwords do not match'
    passwordMessageType.value = 'error'
    return
  }

  if (passwordForm.new_password.length < 8) {
    passwordMessage.value = 'Password must be at least 8 characters long'
    passwordMessageType.value = 'error'
    return
  }

  updatingPassword.value = true

  try {
    await axios.put(`${API_BASE_URL}/users/me/password`, {
      current_password: passwordForm.current_password,
      new_password: passwordForm.new_password,
      new_password_confirmation: passwordForm.confirm_password,
    })

    passwordMessage.value = 'Password changed successfully!'
    passwordMessageType.value = 'success'
    resetPasswordForm()
  } catch (err) {
    passwordMessage.value = err.response?.data?.message || 'Failed to change password'
    passwordMessageType.value = 'error'
  } finally {
    updatingPassword.value = false
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleAvatarUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('avatar', file)

  try {
    const response = await axios.post(`${API_BASE_URL}/users/me/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    authStore.currentUser = response.data
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to upload avatar')
  }
}

const deleteAccount = async () => {
  deletingAccount.value = true

  try {
    await axios.delete(`${API_BASE_URL}/users/me`)

    await authStore.logout()

    showDeleteConfirmation.value = false

    router.push('/login')
  } catch (err) {
    deletingAccount.value = false
    showDeleteConfirmation.value = false
    alert(err.response?.data?.message || 'Failed to delete account')
  }
}

onMounted(async () => {
  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }
  const route = useRoute()
  if (route.query.tab) {
    activeTab.value = route.query.tab
    router.replace({ query: {} })
  }

  if (!authStore.currentUser) {
    await fetchProfile()
  } else {
    resetProfileForm()
  }
})
</script>

<style scoped>
@import './UserPage.css';
</style>
