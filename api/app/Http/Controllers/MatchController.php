<?php

namespace App\Http\Controllers;

use App\Models\MatchGame;
use App\Models\CoinTransaction;
use App\Models\CoinTransactionType;
use Illuminate\Http\Request;
use App\Http\Requests\StoreMatchRequest;
use Illuminate\Support\Facades\DB;

class MatchController extends Controller
{
    public function index(Request $request)
    {
        $query = MatchGame::query()->with(["winner", "player1", "player2"]);

        if ($request->has("type")) {
            $query->where("type", $request->type);
        }

        if ($request->has("status")) {
            $query->where("status", $request->status);
        }

        if ($request->has("pot") && in_array($request->pot, ["asc", "desc"])) {
            $query->orderBy("stake", $request->pot);
        } elseif (
            $request->has("sort_direction") &&
            in_array($request->sort_direction, ["asc", "desc"])
        ) {
            $query->orderBy("began_at", $request->sort_direction);
        } else {
            $query->orderBy("began_at", "desc");
        }

        return response()->json($query->paginate(15));
    }

    public function store(StoreMatchRequest $request)
    {
        $validated = $request->validated();
        $user = $request->user();
        $stake = $validated['stake'];

        if ($user->coins_balance < $stake) {
            return response()->json(
                ["message" => "Insufficient coin balance"],
                400,
            );
        }

        $activeMatch = MatchGame::where(function ($q) use ($user) {
            $q->where("player1_user_id", $user->id)->orWhere(
                "player2_user_id",
                $user->id,
            );
        })
            ->whereIn("status", ["Pending", "Playing"])
            ->exists();

        if ($activeMatch) {
            return response()->json(['message' => 'You already have an active match.'], 400);
        }

        return DB::transaction(function () use ($validated, $user, $stake) {
            $GHOST_ID = 1;

            $user->decrement("coins_balance", $stake);

            $stakeType = CoinTransactionType::firstOrCreate(
                ["name" => "Match stake"],
                ["type" => "D"], 
            );

            $match = MatchGame::create([
                "type" => $validated["type"],
                "status" => "Pending",
                "player1_user_id" => $user->id,
                "player2_user_id" => $GHOST_ID,
                "winner_user_id" => $GHOST_ID,
                "loser_user_id" => $GHOST_ID,
                "stake" => $stake,
                "began_at" => now(),
                "player1_marks" => 0,
                "player2_marks" => 0,
                "player1_points" => 0,
                "player2_points" => 0,
            ]);

            CoinTransaction::create([
                "user_id" => $user->id,
                "match_id" => $match->id,
                "coin_transaction_type_id" => $stakeType->id,
                "transaction_datetime" => now(),
                "coins" => -$stake,
            ]);

            return response()->json(
                [
                    "message" => "Match created successfully",
                    "match" => $match,
                    "balance" => $user->coins_balance,
                ],
                201,
            );
        });
    }

    public function show(MatchGame $match)
    {
        $match->load(["player1", "player2", "winner"]);
        return response()->json($match);
    }

    public function join(MatchGame $match)
    {
        $user = request()->user();

        if ($match->player1_user_id == $user->id) {
            return response()->json(
                ["message" => "You cannot join your own match"],
                400,
            );
        }
        if ($match->status !== "Pending") {
            return response()->json(
                ["message" => "Match is full or started"],
                400,
            );
        }

        if ($user->coins_balance < $match->stake) {
            return response()->json(
                ["message" => "Insufficient coin balance to join this match"],
                400,
            );
        }

        $activeMatch = MatchGame::where(function ($q) use ($user) {
            $q->where("player1_user_id", $user->id)->orWhere(
                "player2_user_id",
                $user->id,
            );
        })
            ->whereIn("status", ["Pending", "Playing"])
            ->exists();

        if ($activeMatch) {
            return response()->json(
                ["message" => "You are already in another active match."],
                400,
            );
        }

        return DB::transaction(function () use ($match, $user) {
            $user->decrement("coins_balance", $match->stake);

            $stakeType = CoinTransactionType::firstOrCreate(
                ["name" => "Match stake"],
                ["type" => "D"],
            );

            CoinTransaction::create([
                'user_id' => $user->id,
                'match_id' => $match->id,
                'coin_transaction_type_id' => $stakeType->id,
                'transaction_datetime' => now(),
                'coins' => -$match->stake,
            ]);

            $match->update([
                "status" => "Playing",
                "player2_user_id" => $user->id,
            ]);

            return response()->json([
                "message" => "Joined match successfully!",
                "match" => $match,
                "balance" => $user->coins_balance,
            ]);
        });
    }

    public function update(Request $request, MatchGame $match)
    {
        if ($match->status == "Ended") {
            return response()->json(["message" => "Match already ended"], 400);
        }

        $data = $request->validate([
            "status" => "in:Playing,Ended,Interrupted",
            "winner_user_id" => "exists:users,id",
            "loser_user_id" => "exists:users,id",
            "player1_marks" => "integer",
            "player2_marks" => "integer",
            "player1_points" => "integer",
            "player2_points" => "integer",
            "total_time" => "numeric",
        ]);

        return DB::transaction(function () use ($match, $data) {
            if (isset($data['status']) && $data['status'] === 'Ended') {
                $data['ended_at'] = now();
            }

            $match->update($data);

            if (
                $match->status === "Ended" &&
                $match->stake > 0 &&
                $match->winner_user_id
            ) {
                $payoutType = CoinTransactionType::firstOrCreate(
                    ["name" => "Match payout"],
                    ["type" => "C"], 
                );

                $totalPrize = $match->stake * 2;

                CoinTransaction::create([
                    "user_id" => $match->winner_user_id,
                    "match_id" => $match->id,
                    "coin_transaction_type_id" => $payoutType->id,
                    "transaction_datetime" => now(),
                    "coins" => $totalPrize,
                ]);

                $match->winner->increment("coins_balance", $totalPrize);
            }

            return response()->json($match);
        });
    }

    public function host(Request $request)
    {
        $request->validate([
            "type" => "required|in:3,9",
            "stake" => "required|integer|min:0",
        ]);

        $user = $request->user();
        $stake = $request->stake;

        if ($user->coins_balance < $stake) {
            return response()->json(
                ["message" => "Insufficient coin balance"],
                400,
            );
        }

        $activeMatch = MatchGame::where(function ($q) use ($user) {
            $q->where("player1_user_id", $user->id)->orWhere(
                "player2_user_id",
                $user->id,
            );
        })
            ->whereIn("status", ["Pending", "Playing"])
            ->exists();

        if ($activeMatch) {
            return response()->json(
                ["message" => "You already have an active match."],
                400,
            );
        }

        return DB::transaction(function () use ($request, $user, $stake) {
            $GHOST_ID = 1;

            $user->decrement("coins_balance", $stake);

            $stakeType = CoinTransactionType::firstOrCreate(
                ["name" => "Match stake"],
                ["type" => "D"],
            );

            $match = MatchGame::create([
                'type' => $request->type,
                'status' => 'Pending',
                'player1_user_id' => $user->id,
                'player2_user_id' => $GHOST_ID,
                'winner_user_id' => null,
                'loser_user_id' => null,
                'stake' => $stake,
                'began_at' => now(),
                'player1_marks' => 0, 'player2_marks' => 0,
                'player1_points' => 0, 'player2_points' => 0,

            ]);

            CoinTransaction::create([
                "user_id" => $user->id,
                "match_id" => $match->id,
                "coin_transaction_type_id" => $stakeType->id,
                "transaction_datetime" => now(),
                "coins" => -$stake,
            ]);

            return response()->json($match, 201);
        });
    }

    public function open(Request $request)
    {
        $query = MatchGame::where('status', 'Pending')
            ->where(function($q) {
                $q->whereNull('player2_user_id')
                  ->orWhere('player2_user_id', 1); 
            });

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        $matches = $query->with('player1:id,nickname')
            ->orderBy('began_at', 'desc')
            ->paginate(10);

        return response()->json($matches);
    }

    public function destroy(MatchGame $match)
    {
        $user = request()->user();

        if ($match->player1_user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($match->status !== 'Pending') {
            return response()->json(['message' => 'Cannot cancel a match that has already started'], 400);
        }

        return DB::transaction(function () use ($match, $user) {
            DB::table('games')->where('match_id', $match->id)->delete();

            CoinTransaction::where('match_id', $match->id)->update(['match_id' => null]);

            if ($match->stake > 0) {
                 $user->increment('coins_balance', $match->stake);

                 $refundType = CoinTransactionType::firstOrCreate(
                     ['name' => 'Refund'],
                     ['type' => 'C']
                 );

                 CoinTransaction::create([
                     'user_id' => $user->id,
                     'match_id' => null, 
                     'coin_transaction_type_id' => $refundType->id,
                     'transaction_datetime' => now(),
                     'coins' => $match->stake,
                     'custom' => "Refund for Match #{$match->id}"
                 ]);
            }

            $match->delete();

            return response()->json([
                'message' => 'Match canceled and refunded',
                'balance' => $user->coins_balance
            ]);
        });
    }
}
