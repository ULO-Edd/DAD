<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\CoinTransaction;

class StatisticsController extends Controller
{
    public function getPublicStats()
    {
        $totalPlayers = User::where('type', 'P')->count();

        $totalGames = Game::where('status', 'Ended')->count();
        $activeGames = Game::where('status', 'Playing')->count();

        return response()->json([
            'total_players' => $totalPlayers,
            'total_games' => $totalGames,
            'active_games' => $activeGames,
        ]);
    }

    public function getLeaderboard(Request $request)
    {
        $type = $request->query('type');

        $leaderboard = User::where('type', 'P')
            ->withCount(['wonGames' => function ($query) use ($type) {
                if ($type) {
                    $query->where('type', $type);
                }
            }])
            ->orderBy('won_games_count', 'desc')
            ->paginate(10);

        $leaderboard->through(function ($user) {
            return [
                'id' => $user->id,
                'nickname' => $user->nickname,
                'photo_avatar_filename' => $user->photo_avatar_filename,
                'won_games_count' => $user->won_games_count,
            ];
        });

        return response()->json($leaderboard);
    }

    public function getPersonalStats(Request $request)
    {
        $user = $request->user();

        $totalGames = Game::where('status', 'Ended')
            ->where(function ($q) use ($user) {
                $q->where('player1_user_id', $user->id)
                  ->orWhere('player2_user_id', $user->id);
            })
            ->count();

        $totalWins = Game::where('status', 'Ended')
            ->where('winner_user_id', $user->id)
            ->count();

        $totalLosses = $totalGames - $totalWins; 

        $winRate = 0;
        if ($totalGames > 0) {
            $winRate = round(($totalWins / $totalGames) * 100, 1);
        }

        return response()->json([
            'nickname' => $user->nickname,
            'total_games' => $totalGames,
            'total_wins' => $totalWins,
            'total_losses' => $totalLosses,
            'win_rate' => $winRate . '%',
            'current_balance' => $user->coins_balance, 
        ]);
    }

    public function getAdminStats()
    {
        $totalPlayers = User::where('type', 'P')->count();
        $totalGames = Game::count();
        $totalBlockedUsers = User::where('blocked', true)->count();
        
        $gamesByType = Game::select('type', DB::raw('count(*) as total'))
            ->groupBy('type')
            ->get();


        $gamesPerMonth = Game::select(
                DB::raw("strftime('%Y-%m', began_at) as month"), 
                DB::raw('count(*) as total')
            )
            ->whereNotNull('began_at')
            ->groupBy('month')
            ->orderBy('month', 'desc')
            ->limit(12)
            ->get();

        $totalCoinsPurchased = \App\Models\CoinTransaction::whereHas('type', function($q) {
                $q->where('name', 'Coin purchase');
            })
            ->sum('coins');

        $purchasesPerMonth = \App\Models\CoinTransaction::join('coin_transaction_types', 'coin_transactions.coin_transaction_type_id', '=', 'coin_transaction_types.id')
            ->where('coin_transaction_types.name', 'Coin purchase')
            ->select(
                DB::raw("strftime('%Y-%m', coin_transactions.transaction_datetime) as month"), 
                DB::raw('SUM(coin_transactions.coins) as total_coins')
            )
            ->groupBy('month')
            ->orderBy('month', 'desc')
            ->limit(12)
            ->get();

        return response()->json([
            'global_counters' => [
                'total_players' => $totalPlayers,
                'total_games' => $totalGames,
                'blocked_users' => $totalBlockedUsers,
                'total_coins_purchased' => (int) $totalCoinsPurchased,
            ],
            'charts' => [
                'games_by_type' => $gamesByType,
                'games_per_month' => $gamesPerMonth,
                'purchases_per_month' => $purchasesPerMonth,
            ]
        ]);
    }
}