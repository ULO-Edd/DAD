<?php

namespace App\Http\Controllers;

use App\Models\Game;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class GameController extends Controller
{
    const GHOST_ID = 1;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Game::class);

        $user = Auth::user();
        $query = Game::query()->with(["winner", "player1", "player2"]);

        if ($user->type !== 'A') {
            $query->where(function ($q) use ($user) {
                $q->where('player1_user_id', $user->id)
                  ->orWhere('player2_user_id', $user->id);
            });
        }

        if ($request->has("type") && in_array($request->type, ["3", "9"])) {
            $query->where("type", $request->type);
        }

        if (
            $request->has("status") &&
            in_array($request->status, [
                "Pending",
                "Playing",
                "Ended",
                "Interrupted",
            ])
        ) {
            $query->where("status", $request->status);
        }

        if ($request->has("sort_direction") && in_array($request->sort_direction, ["asc", "desc"])) {
            $query->orderBy("began_at", $request->sort_direction);
        } else {
            $query->orderBy("began_at", "desc");
        }

        return response()->json($query->paginate(15));
    }

    public function host(Request $request)
    {
        $request->validate([
            'type' => 'required|in:3,9'
        ]);

        $user = $request->user();

        $activeGame = Game::where(function ($q) use ($user) {
             $q->where("player1_user_id", $user->id)
               ->orWhere("player2_user_id", $user->id);
        })
        ->whereIn("status", ["Pending", "Playing"])
        ->exists();

        if ($activeGame) {
             return response()->json(["message" => "You already have an active game."], 400);
        }

        $game = Game::create([
            'type' => $request->type,
            'status' => 'Pending',
            'player1_user_id' => $user->id,
            'player2_user_id' => self::GHOST_ID,
            'began_at' => now(),
            'player1_points' => 0,
            'player2_points' => 0,
        ]);

        return response()->json($game, 201);
    }

    public function open(Request $request)
    {
        $type = $request->query('type', '9');
        $GHOST_ID = 1;

        $games = Game::where('status', 'Pending')
            ->where('player2_user_id', $GHOST_ID) 
            ->where('type', $type)
            ->with('player1')
            ->orderBy('began_at', 'asc')
            ->paginate(10);

        return response()->json($games);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Game::class);

        $validated = $request->validate([
            "type" => "required|in:3,9",
            "player2_user_id" => "nullable|integer|exists:users,id",
            "match_id" => "nullable|integer|exists:matches,id",
            "status" => "nullable|in:Pending,Playing",
            "began_at" => "nullable|date"
        ]);

        $user = Auth::user();

        $activeGame = Game::where(function ($q) use ($user) {
             $q->where("player1_user_id", $user->id)
               ->orWhere("player2_user_id", $user->id);
        })
        ->whereIn("status", ["Pending", "Playing"])
        ->exists();

        if ($activeGame) {
             return response()->json(["message" => "You already have an active game."], 400);
        }

        $player2Id = $request->input('player2_user_id', self::GHOST_ID);

        $initialStatus = $request->input('status', 'Pending');

        if ($player2Id !== self::GHOST_ID && !$request->has('status')) {
            $initialStatus = 'Playing';
        }

        $game = Game::create([
            "type" => $validated["type"],
            "status" => $initialStatus,
            "player1_user_id" => $user->id,
            "player2_user_id" => $player2Id,
            "winner_user_id" => null,
            "loser_user_id" => null,
            "match_id" => $request->input('match_id', null),
            "began_at" => $request->input('began_at', now()),
            "player1_points" => 0,
            "player2_points" => 0,
            "custom" => null,
        ]);

        return response()->json([
            "message" => "Game created",
            "game" => $game,
        ], 201);
    }

    public function join(Request $request, Game $game)
    {
        if ($game->status !== 'Pending' || $game->player2_user_id !== self::GHOST_ID) {
            return response()->json(['message' => 'Game is not available'], 400);
        }

        if ($game->player1_user_id === $request->user()->id) {
            return response()->json(['message' => 'Cannot join your own game'], 400);
        }

        $activeGame = Game::where(function ($q) use ($request) {
             $q->where("player1_user_id", $request->user()->id)
               ->orWhere("player2_user_id", $request->user()->id);
        })
        ->whereIn("status", ["Pending", "Playing"])
        ->exists();

        if ($activeGame) {
             return response()->json(["message" => "You already have an active game."], 400);
        }

        $game->update([
            'player2_user_id' => $request->user()->id,
            'status' => 'Playing',
        ]);

        return response()->json($game);
    }

    public function show(Game $game)
    {
        $this->authorize('view', $game);

        $game->load(["player1", "player2", "winner"]);
        return response()->json($game);
    }

    public function update(Request $request, Game $game)
    {
        $this->authorize('update', $game);

        if ($game->status == "Ended") {
            return response()->json(["message" => "Game already ended"], 400);
        }

        $data = $request->validate([
            "status" => "in:Playing,Ended,Interrupted",
            "winner_user_id" => "exists:users,id",
            "loser_user_id" => "exists:users,id",
            "player1_points" => "integer",
            "player2_points" => "integer",
            "is_draw" => "boolean",
            "total_time" => "numeric",
        ]);

        if (isset($data["status"]) && $data["status"] === "Ended") {
            $data["ended_at"] = now();
        }

        $game->update($data);

        return response()->json($game);
    }

    public function resign(Game $game)
    {
        $this->authorize('resign', $game);

        $user = Auth::user();

        $game->update([
            'status' => 'Ended',
            'winner_user_id' => $game->player1_user_id === $user->id
                ? $game->player2_user_id
                : $game->player1_user_id,
            'loser_user_id' => $user->id,
            'ended_at' => now(),
        ]);

        return response()->json([
            'message' => 'You have resigned from the game',
            'game' => $game->fresh(),
        ]);
    }

    public function destroy(Game $game)
    {
        if ($game->player1_user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($game->status !== 'Pending') {
            return response()->json(['message' => 'Cannot delete a game in progress'], 400);
        }

        $game->delete();
        return response()->noContent();
    }
}
