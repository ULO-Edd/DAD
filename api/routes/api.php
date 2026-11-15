<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\MatchController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\StatisticsController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CoinPurchaseController;
use App\Http\Controllers\TransactionController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);

    Route::get('/statistics/public', [StatisticsController::class, 'getPublicStats']);
    Route::get('/leaderboard', [StatisticsController::class, 'getLeaderboard']);

    Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/coin-purchases', [CoinPurchaseController::class, 'store']);
        Route::get('/statistics/me', [StatisticsController::class, 'getPersonalStats']);
        Route::prefix('users/me')->group(function () {
            Route::get('/', [ProfileController::class, 'show']);
            Route::put('/', [ProfileController::class, 'update']);
            Route::patch('/password', [ProfileController::class, 'updatePassword']);
            Route::delete('/', [ProfileController::class, 'destroy']);
            Route::get('/coins', [ProfileController::class, 'getCoins']);
            Route::put('/password', [
                ProfileController::class,
                'updatePassword',
            ]);
            Route::post('/avatar', [ProfileController::class, 'uploadAvatar']);
            Route::get('/transactions', [UserController::class, 'getMyTransactions']);
        });

        Route::prefix('/users')->group(function () {
            Route::get('/{user}', [UserController::class, 'show']);
            Route::get('/{user}/transactions', [UserController::class, 'getTransactions']);
            Route::get('/{user}/games', [UserController::class, 'getGames']);
            Route::get('/{user}/matches', [UserController::class, 'getMatches']);
        });

        Route::prefix('games')->group(function () {
            Route::post('host', [GameController::class, 'host']);
            Route::get('open', [GameController::class, 'open']);
            Route::get('/', [GameController::class, 'index']);
            Route::get('/{game}', [GameController::class, 'show']);
            Route::post('/', [GameController::class, 'store']);
            Route::put('/{game}', [GameController::class, 'update']);
            Route::delete('/{game}', [GameController::class, 'destroy']);
            Route::post('/{game}/resign', [GameController::class, 'resign']);
            Route::post('/{game}/join', [GameController::class, 'join']);
        });

        Route::prefix('matches')->group(function () {
            Route::post('host', [MatchController::class, 'host']);
            Route::get('open', [MatchController::class, 'open']);
            Route::post('/{match}/join', [MatchController::class, 'join']);
            Route::post('/{match}/start', [MatchController::class, 'start']); 
            Route::delete('/{match}', [MatchController::class, 'destroy']);
            Route::apiResource('/', MatchController::class)->parameters(['' => 'match']);
        });

        Route::middleware('user.type:A')
            ->prefix('admin')
            ->group(function () {
                Route::get('/statistics', [StatisticsController::class, 'getAdminStats']);
                Route::get('/transactions', [TransactionController::class, 'index']);
                Route::get('/games', [GameController::class, 'index']);
                Route::get('/matches', [MatchController::class, 'index']);
                Route::prefix('users')->group(function () {
                    Route::get('/', [UserController::class, 'index']);
                    Route::post('/', [UserController::class, 'store']);
                    Route::put('/{user}', [UserController::class, 'update']);
                    Route::delete('/{user}', [
                        UserController::class,
                        'destroy',
                    ]);
                    Route::post('/{user}/block', [
                        UserController::class,
                        'block',
                    ]);
                    Route::post('/{user}/unblock', [
                        UserController::class,
                        'unblock',
                    ]);
                });
            });
    });
});
