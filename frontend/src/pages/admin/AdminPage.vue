<template>
  <div class="min-h-screen p-4 md:p-8 flex flex-col items-center font-sans text-black">
    <div class="max-w-7xl w-full mb-8">
      <div class="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-8">
        <div>
          <h1 class="text-4xl font-black uppercase tracking-tighter">Admin Panel</h1>
          <p class="text-gray-500 text-xs mt-1 uppercase tracking-[0.2em] font-bold">
            Platform Oversight
          </p>
        </div>
        <button
          @click="showCreateModal = true"
          class="px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-all active:scale-95 border border-black"
        >
          + Create Admin
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white border border-gray-300 p-6 shadow-sm">
          <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1"
            >Total Players</span
          >
          <span class="text-3xl font-black">{{
            stats.global_counters?.total_players ?? 'Loading'
          }}</span>
        </div>

        <div class="bg-white border border-gray-300 p-6 shadow-sm">
          <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1"
            >Active Games</span
          >
          <span class="text-3xl font-black">{{
            stats.global_counters?.active_games ?? 'Loading'
          }}</span>
        </div>

        <div
          @click="openChart('games')"
          class="bg-white border border-gray-300 p-6 shadow-sm cursor-pointer hover:border-black transition-colors group"
        >
          <div class="flex justify-between items-start">
            <span class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1"
              >Total Games</span
            >
            <svg
              class="w-4 h-4 text-gray-300 group-hover:text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M7 12l5 5L22 7"></path>
            </svg>
          </div>
          <span class="text-3xl font-black">{{
            stats.global_counters?.total_games ?? 'Loading'
          }}</span>
          <span
            class="block text-[10px] mt-2 underline opacity-0 group-hover:opacity-100 transition-opacity"
            >View Volume Chart</span
          >
        </div>

        <div
          @click="openChart('revenue')"
          class="bg-black text-white p-6 shadow-lg cursor-pointer hover:bg-gray-900 transition-colors group"
        >
          <div class="flex justify-between items-start">
            <span class="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1"
              >Estimated Revenue</span
            >
            <svg
              class="w-4 h-4 opacity-40 group-hover:opacity-100"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              ></path>
            </svg>
          </div>
          <span class="text-3xl font-black"
            >€
            {{
              (stats.global_counters?.total_coins_purchased / 10).toLocaleString() ?? 'Loading'
            }}</span
          >
          <span
            class="block text-[10px] mt-2 underline opacity-60 group-hover:opacity-100 transition-opacity"
            >View Purchase History</span
          >
        </div>
      </div>
    </div>

    <div
      v-if="activeChart"
      class="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4"
      @click.self="activeChart = null"
    >
      <div class="bg-white border border-gray-300 w-full max-w-5xl overflow-hidden shadow-2xl">
        <div class="p-6 border-b border-gray-300 flex justify-between items-center bg-white">
          <div>
            <h3 class="text-2xl font-black uppercase tracking-tighter">
              {{ activeChart === 'games' ? 'Games Volume' : 'Purchases History' }}
            </h3>
            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
              Last 12 Months Activity
            </p>
          </div>
          <button
            @click="activeChart = null"
            class="w-12 h-12 flex items-center justify-center border border-black hover:bg-black hover:text-white transition-all group"
          >
            <span class="text-xl group-hover:rotate-90 transition-transform">✕</span>
          </button>
        </div>

        <div class="p-12 min-h-[400px] flex flex-col justify-end">
          <div v-if="chartData.length > 0" class="flex items-end gap-3 h-64 w-full">
            <div
              v-for="(data, index) in chartData"
              :key="data.month"
              class="flex-1 flex flex-col items-center group relative h-full justify-end"
            >
              <div
                class="absolute -top-12 bg-black text-white text-[10px] py-2 px-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-bold"
              >
                {{ data.total || data.total_coins }}
                <div
                  class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-black rotate-45"
                ></div>
              </div>

              <div
                class="w-full bg-black hover:bg-gray-700 transition-all ease-out"
                :style="{
                  height: showBars ? `${calculateHeight(data.total || data.total_coins)}%` : '0%',
                  transitionDelay: `${index * 50}ms`,
                  transitionDuration: '800ms',
                }"
              ></div>

              <div class="h-8 flex items-center">
                <span class="text-[9px] font-black uppercase text-gray-400">
                  {{ formatMonth(data.month) }}
                </span>
              </div>
            </div>
          </div>

          <div
            v-else
            class="h-64 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100"
          >
            <p class="text-xs font-bold uppercase tracking-widest">
              No data available for this period
            </p>
          </div>
        </div>

        <div class="bg-gray-50 p-8 border-t border-gray-300 flex justify-between items-center">
          <div class="flex gap-12">
            <div
              v-if="activeChart === 'games'"
              v-for="gt in stats.charts.games_by_type"
              :key="gt.type"
            >
              <span class="text-[10px] font-bold uppercase text-gray-400 block tracking-widest"
                >Bisca {{ gt.type }}</span
              >
              <span class="text-2xl font-black">{{ gt.total.toLocaleString() }}</span>
            </div>
            <div v-if="activeChart === 'revenue'">
              <span class="text-[10px] font-bold uppercase text-gray-400 block tracking-widest"
                >Total Period Volume</span
              >
              <span class="text-2xl font-black"
                >{{ stats.global_counters.total_coins_purchased.toLocaleString() }} Coins</span
              >
            </div>
          </div>
          <div class="text-[10px] font-bold text-gray-400 uppercase italic">
            * Admin Full-Access View
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white border border-gray-300 shadow-2xl max-w-7xl w-full overflow-hidden">
      <div class="flex border-b border-gray-300 bg-gray-50 overflow-x-auto scrollbar-hide">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="[
            'flex-1 min-w-[150px] p-5 text-xs font-bold uppercase tracking-widest transition-all outline-none',
            activeTab === tab.id
              ? 'bg-white border-b-2 border-black text-black'
              : 'text-gray-400 hover:text-black hover:bg-gray-100 border-b-2 border-transparent',
          ]"
        >
          {{ tab.name }}
        </button>
      </div>

      <div class="min-h-[400px]">
        <div
          v-if="activeTab === 'users'"
          class="animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <div class="overflow-x-auto">
            <div
              id="table-scroll-container"
              class="overflow-y-auto h-[500px] scrollbar-thin scrollbar-thumb-black"
            >
              <table class="w-full text-left border-collapse sticky-header">
                <thead class="bg-gray-50 border-b border-gray-300">
                  <tr>
                    <th
                      class="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 cursor-pointer hover:text-black transition-colors"
                    >
                      Name
                    </th>
                    <th
                      class="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 cursor-pointer hover:text-black transition-colors"
                    >
                      Coins
                    </th>
                    <th
                      @click="handleSort('type')"
                      class="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 cursor-pointer hover:text-black transition-colors"
                    >
                      Role
                      <span class="ml-1">
                        <template v-if="filters.type === 'A'"> (Admins)</template>
                        <template v-else-if="filters.type === 'P'"> (Players)</template>
                        <template v-else> ↕</template>
                      </span>
                    </th>

                    <th
                      @click="handleSort('blocked')"
                      class="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 cursor-pointer hover:text-black transition-colors"
                    >
                      Status
                      <span class="ml-1">
                        <template v-if="filters.blocked === true"> (Blocked)</template>
                        <template v-else-if="filters.blocked === false"> (Active)</template>
                        <template v-else> ↕</template>
                      </span>
                    </th>
                    <th></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <template v-if="filteredUsers.length > 0">
                    <tr
                      v-for="user in filteredUsers"
                      :key="user.id"
                      class="hover:bg-gray-50/80 transition-colors"
                    >
                      <td class="p-4">
                        <div class="flex items-center gap-3">
                          <div
                            class="w-10 h-10 bg-black text-white flex items-center justify-center font-bold text-sm border-2 border-black"
                          >
                            {{ user.name.charAt(0) }}
                          </div>
                          <div>
                            <div class="text-sm font-bold">{{ user.name }}</div>
                            <div v-if="user.nickname" class="text-xs text-gray-500 font-mono">
                              @{{ user.nickname }}
                            </div>
                            <div class="text-xs text-gray-500 font-mono">{{ user.email }}</div>
                          </div>
                        </div>
                      </td>
                      <td class="p-4">
                        <div v-if="user.coins_balance" class="flex items-center gap-2">
                          <div
                            class="flex items-center justify-center w-5 h-5 bg-purple-400 rounded-full shadow-sm"
                          >
                            <span class="text-[10px] font-bold text-purple-900">$</span>
                          </div>
                          <span class="text-[10px] uppercase font-bold tracking-tight">{{
                            user.coins_balance
                          }}</span>
                        </div>
                      </td>
                      <td class="p-4">
                        <span
                          :class="[
                            'px-2 py-1 text-[10px] font-bold border',
                            user.type === 'A'
                              ? 'bg-black text-white border-black'
                              : 'bg-white text-gray-600 border-gray-300',
                          ]"
                        >
                          {{ user.type === 'A' ? 'ADMIN' : 'PLAYER' }}
                        </span>
                      </td>
                      <td class="p-4">
                        <div class="flex items-center gap-2">
                          <div
                            :class="[
                              'w-2 h-2 rounded-full',
                              user.blocked ? 'bg-red-600' : 'bg-green-500',
                            ]"
                          ></div>
                          <span class="text-[10px] uppercase font-bold tracking-tight">{{
                            user.blocked ? 'Blocked' : 'Active'
                          }}</span>
                        </div>
                      </td>
                      <td class="p-4 text-right">
                        <div v-if="user.type != 'A'" class="space-x-2 flex justify-end">
                          <button
                            @click="toggleBlock(user)"
                            class="text-[10px] font-bold uppercase tracking-tighter border-2 border-black px-3 py-1 hover:bg-black hover:text-white transition-all"
                          >
                            {{ user.blocked ? 'Unblock' : 'Block' }}
                          </button>
                          <button
                            @click="confirmDelete(user)"
                            class="text-[10px] font-bold uppercase tracking-tighter bg-red-600 text-white border-2 border-red-600 px-3 py-1 hover:bg-red-700 transition-all"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  </template>
                  <tr v-else-if="!isLoading">
                    <td
                      colspan="3"
                      class="p-12 text-center text-gray-400 uppercase text-xs font-bold tracking-widest"
                    >
                      No users found
                    </td>
                  </tr>
                  <tr ref="loadMoreTrigger">
                    <td colspan="4" class="p-4 text-center">
                      <span v-if="isLoading" class="text-xs font-bold uppercase animate-pulse"
                        >Loading more...</span
                      >
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div
          v-else-if="activeTab === 'transactions'"
          class="animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <div class="overflow-x-auto">
            <div
              id="table-scroll-container"
              class="overflow-y-auto h-[500px] scrollbar-thin scrollbar-thumb-black"
            >
              <table class="w-full text-left border-collapse sticky-header">
                <thead class="bg-gray-50 border-b border-gray-300">
                  <tr>
                    <th
                      @click="handleSort('datetime')"
                      class="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 cursor-pointer hover:text-black transition-colors"
                    >
                      Date Time
                      <span>{{ filters.sort_datetime === 'desc' ? ' ↓' : ' ↑' }}</span>
                    </th>
                    <th class="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      User
                    </th>
                    <th class="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Transaction type
                    </th>
                    <th
                      @click="handleSort('coins')"
                      class="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 cursor-pointer hover:text-black transition-colors"
                    >
                      Coins
                      <span v-if="filters.sort_coins">
                        {{ filters.sort_coins === 'desc' ? ' ↓' : '↑' }}</span
                      >
                      <span v-else> ↕</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <template v-if="transactions.length > 0">
                    <tr
                      v-for="tx in transactions"
                      :key="tx.id"
                      class="hover:bg-gray-50/80 transition-colors"
                    >
                      <td class="p-4 text-xs font-mono text-gray-600">
                        {{ new Date(tx.transaction_datetime).toLocaleDateString() }} •
                        {{
                          new Date(tx.transaction_datetime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        }}
                      </td>
                      <td class="p-4">
                        <div class="text-sm font-bold">{{ tx.user?.nickname || 'Guest' }}</div>
                        <div class="text-[10px] text-gray-500 font-mono">{{ tx.user?.email }}</div>
                      </td>
                      <td class="p-4">
                        <div class="flex items-center gap-4">
                          <div
                            class="px-2 py-1 bg-gray-100 border border-gray-300 text-[9px] font-black uppercase tracking-tighter text-gray-500 min-w-[80px] text-center"
                          >
                            {{ tx.type?.name || 'Manual' }}
                          </div>
                        </div>
                      </td>
                      <td class="p-4">
                        <div class="inline-flex items-center gap-2">
                          <span
                            :class="[
                              'text-sm font-black tracking-tighter',
                              tx.coins >= 0 ? 'text-green-400' : 'text-red-400',
                            ]"
                          >
                            {{ tx.coins > 0 ? '+' : '' }}{{ tx.coins.toLocaleString() }}
                          </span>

                          <span
                            class="text-[10px] font-bold text-gray-400 uppercase tracking-widest"
                            >Coins</span
                          >
                        </div>
                      </td>
                    </tr>
                  </template>
                  <tr v-else-if="!isLoading">
                    <td
                      colspan="3"
                      class="w-1 p-12 text-center text-gray-400 uppercase text-xs font-bold tracking-widest"
                    >
                      No transactions found
                    </td>
                  </tr>
                  <tr ref="loadMoreTrigger">
                    <td colspan="4" class="p-4 text-center">
                      <span v-if="isLoading" class="text-xs font-bold uppercase animate-pulse"
                        >Loading more...</span
                      >
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div
          v-else-if="activeTab === 'games'"
          class="animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <div class="overflow-x-auto">
            <div
              id="table-scroll-container"
              class="overflow-y-auto h-[500px] scrollbar-thin scrollbar-thumb-black"
            >
              <table class="w-full text-left border-collapse sticky-header">
                <thead class="bg-gray-50 border-b border-gray-300">
                  <tr>
                    <th
                      @click="handleSort('date')"
                      class="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 cursor-pointer hover:text-black transition-colors"
                    >
                      Timeline
                      <span>{{ filters.game_sort_direction === 'desc' ? ' ↓' : ' ↑' }}</span>
                    </th>
                    <th class="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Player 1
                    </th>
                    <th class="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Player 2
                    </th>
                    <th class="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Result
                    </th>
                    <th
                      @click="handleSort('type')"
                      class="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 cursor-pointer hover:text-black transition-colors"
                    >
                      Variant
                      <span v-if="filters.game_type"> (Bisca {{ filters.game_type }})</span>
                      <span v-else> ↕</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <template v-if="games.length > 0">
                    <tr
                      v-for="game in games"
                      :key="game.id"
                      class="hover:bg-gray-50/80 transition-colors"
                    >
                      <td class="p-4">
                        <div class="text-[10px] font-mono text-black font-bold">
                          {{ new Date(game.began_at).toLocaleDateString() }}
                        </div>
                        <div class="text-[10px] font-mono text-gray-400 italic">
                          {{
                            new Date(game.began_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          }}
                          •
                          {{
                            new Date(game.ended_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          }}
                        </div>
                      </td>

                      <td class="p-4">
                        <div class="text-sm font-bold text-black">{{ game.player1?.nickname }}</div>
                        <div
                          class="text-[10px] font-black text-gray-400 uppercase tracking-tighter"
                        >
                          {{ game.player1_points }} Points
                        </div>
                      </td>

                      <td class="p-4">
                        <div class="text-sm font-bold text-black">{{ game.player2?.nickname }}</div>
                        <div
                          class="text-[10px] font-black text-gray-400 uppercase tracking-tighter"
                        >
                          {{ game.player2_points }} Points
                        </div>
                      </td>

                      <td class="p-4">
                        <div v-if="game.is_draw" class="text-xs font-bold text-gray-400">
                          — Draw —
                        </div>
                        <div v-else class="flex flex-col">
                          <span
                            class="text-[9px] font-bold uppercase text-gray-400 tracking-widest mb-0.5"
                            >Winner</span
                          >
                          <span
                            class="text-xs font-black bg-black text-white px-2 py-0.5 w-fit uppercase tracking-tighter"
                          >
                            {{
                              game.winner_user_id === game.player1_user_id
                                ? game.player1?.nickname
                                : game.player2?.nickname
                            }}
                          </span>
                        </div>
                      </td>

                      <td class="p-4">
                        <div
                          class="px-2 py-1 bg-gray-100 border border-gray-300 text-[10px] font-black text-center w-20"
                        >
                          BISCA {{ game.type }}
                        </div>
                      </td>
                    </tr>
                    <tr ref="loadMoreTrigger">
                      <td colspan="5" class="p-8 text-center border-none">
                        <div v-if="isLoading" class="flex flex-col items-center gap-2">
                          <div
                            class="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"
                          ></div>
                          <span class="text-[10px] font-black uppercase tracking-[0.2em]"
                            >Retrieving game data...</span
                          >
                        </div>
                      </td>
                    </tr>
                  </template>
                  <tr v-else-if="!isLoading">
                    <td
                      colspan="5"
                      class="p-12 text-center text-gray-400 uppercase text-xs font-bold tracking-widest border-none"
                    >
                      No game history found
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div
          v-else-if="activeTab === 'matches'"
          class="animate-in fade-in slide-in-from-bottom-2 duration-300"
        >
          <div class="overflow-x-auto">
            <div
              id="table-scroll-container"
              class="overflow-y-auto h-[500px] scrollbar-thin scrollbar-thumb-black"
            >
              <table class="w-full text-left border-collapse sticky-header">
                <thead class="bg-gray-50 border-b border-gray-300">
                  <tr>
                    <th
                      class="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500"
                      @click="handleSort('date')"
                    >
                      Match Date
                      <span>{{ filters.match_sort_direction === 'desc' ? ' ↓' : ' ↑' }}</span>
                    </th>
                    <th class="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Matchup (P1 vs P2)
                    </th>
                    <th
                      class="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500"
                      @click="handleSort('type')"
                    >
                      Variant
                      <span v-if="filters.match_type"> (Bisca {{ filters.match_type }})</span>
                      <span v-else> ↕</span>
                    </th>
                    <th class="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                      Outcome
                    </th>
                    <th
                      class="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500"
                      @click="handleSort('pot')"
                    >
                      Total Pot
                      <span v-if="filters.pot"> ({{ filters.pot }})</span>
                      <span v-else> ↕</span>
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <template v-if="matches.length > 0">
                    <tr
                      v-for="match in matches"
                      :key="match.id"
                      class="hover:bg-gray-50/80 transition-colors"
                    >
                      <td class="p-4">
                        <div class="text-[10px] font-mono text-black font-bold">
                          {{ new Date(match.began_at).toLocaleDateString() }}
                        </div>
                        <div class="text-[10px] font-mono text-gray-400 italic">
                          {{
                            new Date(match.began_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          }}
                        </div>
                      </td>
                      <td class="p-4">
                        <div class="flex flex-col gap-1">
                          <span class="text-xs font-bold"
                            >{{ match.player1?.nickname }}
                            <span class="text-gray-400 text-[10px]"
                              >({{ match.player1_points }})</span
                            >
                          </span>
                          <span class="text-[10px] font-bold text-gray-400 uppercase">vs</span>
                          <span class="text-xs font-bold"
                            >{{ match.player2?.nickname }}
                            <span class="text-gray-400 text-[10px]"
                              >({{ match.player2_points }})</span
                            >
                          </span>
                        </div>
                      </td>
                      <td class="p-4">
                        <div
                          class="px-2 py-1 bg-gray-100 border border-gray-300 text-[10px] font-black text-center w-20"
                        >
                          BISCA {{ match.type }}
                        </div>
                      </td>
                      <td class="p-4">
                        <div v-if="match.is_draw" class="text-xs font-bold text-gray-400">Draw</div>
                        <div v-else>
                          <span
                            class="text-xs font-black bg-black text-white px-2 py-0.5 uppercase tracking-tighter"
                          >
                            {{
                              match.winner_user_id === match.player1_user_id
                                ? match.player1?.nickname
                                : match.player2?.nickname
                            }}
                            Wins
                          </span>
                        </div>
                      </td>
                      <td class="p-4">
                        <div class="flex items-center gap-2">
                          <div
                            class="w-5 h-5 flex items-center justify-center bg-yellow-100 rounded-full"
                          >
                            <span class="text-[10px] font-bold text-yellow-700">C</span>
                          </div>
                          <span class="text-sm font-black">
                            {{ match.stake ? (match.stake * 2).toLocaleString() : '0' }}
                          </span>
                          <span
                            class="text-[10px] font-bold text-gray-400 uppercase tracking-widest"
                            >Coins</span
                          >
                        </div>
                      </td>
                    </tr>
                    <tr ref="loadMoreTrigger">
                      <td colspan="5" class="p-8 text-center border-none">
                        <span
                          v-if="isLoading"
                          class="text-[10px] font-black uppercase tracking-[0.2em] animate-pulse"
                          >Loading matches...</span
                        >
                      </td>
                    </tr>
                  </template>
                  <tr v-else-if="!isLoading">
                    <td
                      colspan="5"
                      class="p-12 text-center text-gray-400 uppercase text-xs font-bold tracking-widest border-none"
                    >
                      No matches found
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="showCreateModal"
      class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        class="bg-white border border-gray-300 w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200"
      >
        <div class="p-6 border-b border-gray-300 bg-black text-white">
          <h3 class="text-xl font-black uppercase tracking-tighter">New Admin</h3>
        </div>
        <form @submit.prevent="handleSubmitAdmin" class="p-6 space-y-4">
          <div>
            <label class="block text-[10px] font-bold uppercase text-gray-500 mb-1"
              >Full Name</label
            >
            <input
              v-model="adminForm.name"
              type="text"
              required
              class="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none transition-colors"
            />
          </div>
          <div>
            <label class="block text-[10px] font-bold uppercase text-gray-500 mb-1"
              >Email Address</label
            >
            <input
              v-model="adminForm.email"
              type="email"
              required
              class="w-full border border-gray-300 p-3 text-sm focus:border-black outline-none transition-colors"
            />
          </div>
          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="showCreateModal = false"
              class="flex-1 px-4 py-3 border border-gray-300 font-bold uppercase text-xs hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 px-4 py-3 bg-black text-white font-bold uppercase text-xs hover:bg-gray-800 transition-all"
            >
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch, nextTick } from 'vue'
import { useAPIStore } from '@/stores/api'
import { useAuthStore } from '@/stores/auth'
import { toast } from 'vue-sonner'

const activeTab = ref('users')
const showCreateModal = ref(false)
const activeChart = ref(null)
const showBars = ref(false)
const stats = ref({})
const users = ref([])
const transactions = ref([])
const games = ref([])
const matches = ref([]) 
const isLoading = ref(false)
const loadMoreTrigger = ref(null)

const apiStore = useAPIStore()

const pagination = reactive({
  users: { page: 1, lastPage: 1 },
  transactions: { page: 1, lastPage: 1 },
  games: { page: 1, lastPage: 1 },
  matches: { page: 1, lastPage: 1 }, 
})

const filters = reactive({
  type: null,
  blocked: null,
  sort_datetime: 'desc',
  sort_coins: null,
  game_sort_direction: 'desc',
  game_type: null,
  match_type: null,
  match_outcome: null,
  match_date_from: '',
  match_date_to: '',
  match_sort_direction: null,
  pot: null,
})

watch(activeTab, async () => {
  resetPagination()
  await fetchData()
  await nextTick()
  setupObserver()
})

const tabs = [
  { id: 'users', name: 'User Management' },
  { id: 'transactions', name: 'Transactions' },
  { id: 'games', name: 'Games History' },
  { id: 'matches', name: 'Matches History' }, 
]

const chartData = computed(() => {
  if (!stats.value) return []
  if (activeChart.value === 'games') return [...stats.value.charts.games_per_month].reverse()
  if (activeChart.value === 'revenue') return [...stats.value.charts.purchases_per_month].reverse()
  return []
})

const openChart = (type) => {
  activeChart.value = type
  showBars.value = false

  setTimeout(() => {
    showBars.value = true
  }, 50)
}

const calculateHeight = (value) => {
  const max = Math.max(...chartData.value.map((d) => d.total || d.total_coins))
  return (value / max) * 100
}

const formatMonth = (monthStr) => {
  const [_, month] = monthStr.split('-')
  const months = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ]
  return months[parseInt(month) - 1]
}

const adminForm = reactive({ name: '', nickname: '', email: '' })

const toggleBlock = (user) => {
  user.blocked == false ? apiStore.blockUser(user) : apiStore.unblockUser(user)
  user.blocked = !user.blocked
}

const confirmDelete = (user) => {
  if (
    confirm(
      `Remove ${user.name}? This action follows platform rules for ${user.type === 'P' ? 'soft-deletion' : 'permanent removal'}.`,
    )
  ) {
    apiStore.deleteUser(user)
    users.value = users.value.filter((u) => u.id !== user.id)
  }
}

const handleSubmitAdmin = () => {
  adminForm.type = 'A'
  adminForm.password = '123'
  adminForm.blocked = false

  const promise = apiStore.postAdmin(adminForm)
  toast.promise(promise, {
    loading: 'Calling API',
    success: () => {
      return `Admin created with success`
    },
    error: (error) => error.response?.data?.message,
  })

  showCreateModal.value = false
  adminForm.name = ''
  adminForm.email = ''
}

const resetPagination = () => {
  pagination[activeTab.value].page = 1
  if (activeTab.value === 'users') users.value = []
  if (activeTab.value === 'transactions') transactions.value = []
  if (activeTab.value === 'games') games.value = []
  if (activeTab.value === 'matches') matches.value = []
}

const filteredUsers = computed(() => {
  return users.value.filter((user) => user.id !== useAuthStore().currentUserID)
})

const fetchData = async () => {
  if (isLoading.value) return
  const currentTab = activeTab.value
  if (
    pagination[currentTab].page > pagination[currentTab].lastPage &&
    pagination[currentTab].page !== 1
  )
    return

  isLoading.value = true
  try {
    let response
    if (currentTab === 'users') {
      const params = {
        page: pagination[currentTab].page,
        type: filters.type,
        blocked: filters.blocked,
      }
      response = await apiStore.getAdminUsers(params)
      users.value.push(...response.data.data)
    } else if (currentTab === 'transactions') {
      const params = {
        page: pagination[currentTab].page,
        sort_datetime: filters.sort_datetime,
        sort_coins: filters.sort_coins,
      }
      response = await apiStore.getAdminTransactions(params)
      transactions.value.push(...response.data.data)
    } else if (currentTab === 'games') {
      const params = {
        page: pagination[currentTab].page,
        sort_direction: filters.game_sort_direction,
        type: filters.game_type,
      }
      response = await apiStore.getAdminGames(params)
      games.value.push(...response.data.data)
    } else if (currentTab === 'matches') {
      const params = {
        page: pagination[currentTab].page,
        sort_direction: filters.match_sort_direction,
        type: filters.match_type,
        pot: filters.pot,
      }
      response = await apiStore.getAdminMatches(params)
      matches.value.push(...response.data.data)
    }

    pagination[currentTab].lastPage = response.data.last_page
    pagination[currentTab].page++
  } catch (error) {
    console.error('Fetch failed', error)
  } finally {
    isLoading.value = false
  }
}

const handleSort = async (column) => {
  if (activeTab.value === 'users') {
    if (column === 'type') {
      filters.type = filters.type === null ? 'A' : filters.type === 'A' ? 'P' : null
    } else if (column === 'blocked') {
      filters.blocked = filters.blocked === null ? true : filters.blocked === true ? false : null
    }
  } else if (activeTab.value === 'transactions') {
    if (column === 'datetime') {
      filters.sort_datetime = filters.sort_datetime === 'desc' ? 'asc' : 'desc'
    } else if (column === 'coins') {
      if (filters.sort_coins === null) filters.sort_coins = 'desc'
      else if (filters.sort_coins === 'desc') filters.sort_coins = 'asc'
      else filters.sort_coins = null
    }
  } else if (activeTab.value === 'games') {
    if (column === 'date') {
      filters.game_sort_direction = filters.game_sort_direction === 'desc' ? 'asc' : 'desc'
    } else if (column === 'type') {
      if (filters.game_type === null) filters.game_type = '9'
      else if (filters.game_type === '9') filters.game_type = '3'
      else filters.game_type = null
    }
  } else if (activeTab.value === 'matches') {
    if (column === 'type') {
      filters.match_type =
        filters.match_type === null ? '9' : filters.match_type === '9' ? '3' : null
    } else if (column === 'date') {
      filters.pot = null 
      filters.match_sort_direction = filters.match_sort_direction === 'desc' ? 'asc' : 'desc'
    } else if (column === 'pot') {
      filters.match_sort_direction = null 
      if (filters.pot === null) filters.pot = 'desc'
      else if (filters.pot === 'desc') filters.pot = 'asc'
      else filters.pot = 'desc'
    }
  }

  resetPagination()
  await fetchData()
  await nextTick()
  setupObserver()
}

const setupObserver = () => {
  if (window.adminTableObserver) window.adminTableObserver.disconnect()

  const container = document.querySelector('#table-scroll-container')

  const observer = new IntersectionObserver(
    (entries) => {
      const currentTab = activeTab.value
      const hasMore = pagination[currentTab].page <= pagination[currentTab].lastPage

      if (entries[0].isIntersecting && !isLoading.value && hasMore) {
        fetchData()
      }
    },
    {
      root: container,
      threshold: 0.1,
      rootMargin: '100px',
    },
  )

  if (loadMoreTrigger.value) {
    observer.observe(loadMoreTrigger.value)
    window.adminTableObserver = observer
  }
}

onMounted(async () => {
  const statsResponse = await apiStore.getAdminStats()
  const globalResponse = await apiStore.getPublicStats()
  stats.value = statsResponse.data
  stats.value.global_counters.active_games = globalResponse.data.active_games

  await fetchData()
  await nextTick()
  setupObserver()
})
</script>

<style scoped>
.sticky-header thead th {
  position: sticky;
  top: 0;
  background-color: #f9fafb;
  box-shadow: inset 0 -1px 0 #d1d5db;
}

#table-scroll-container::-webkit-scrollbar {
  width: 6px;
}

#table-scroll-container::-webkit-scrollbar-thumb {
  background-color: black;
}

#table-scroll-container::-webkit-scrollbar-track {
  background-color: #f3f4f6;
}
</style>
