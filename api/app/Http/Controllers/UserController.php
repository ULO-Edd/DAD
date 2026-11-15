<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\User;
use App\Models\MatchGame;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize("viewAny", User::class);

        $query = User::query();

        if ($request->has("type")) {
            $query->where("type", $request->type);
        }

        if ($request->has("blocked")) {
            $query->where("blocked", $request->type);
        }

        if ($request->has("search")) {
            $query->where(function ($q) use ($request) {
                $q->where("name", "like", "%" . $request->search . "%")
                    ->orWhere("email", "like", "%" . $request->search . "%")
                    ->orWhere("nickname", "like", "%" . $request->search . "%");
            });
        }

        return response()->json($query->paginate(15));
    }

    public function store(Request $request)
    {
        $this->authorize("create", User::class);

        $validated = $request->validate([
            "name" => "required|string|max:255",
            "email" => "required|email|unique:users,email",
            "password" => "required|string|min:3",
            "type" => "required|in:A,U",
        ]);

        $validated["password"] = Hash::make($validated["password"]);

        $user = User::create($validated);

        return response()->json($user, 201);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function show(User $user)
    {
        $currentUser = Auth::user();

        if ($currentUser->type === "A" || $currentUser->id === $user->id) {
            return response()->json($user);
        } else {
            return response()->json([
                "id" => $user->id,
                "name" => $user->name,
                "nickname" => $user->nickname,
                "photo_avatar_filename" => $user->photo_avatar_filename,
                "type" => $user->type,
            ]);
        }
    }

    public function update(Request $request, User $user)
    {
        $this->authorize("update", $user);

        $validated = $request->validate([
            "name" => "sometimes|string|max:255",
            "nickname" => [
                "sometimes",
                "string",
                "max:20",
                Rule::unique("users")->ignore($user->id),
            ],
            "email" => [
                "sometimes",
                "email",
                Rule::unique("users")->ignore($user->id),
            ],
            "password" => "sometimes|string|min:3",
        ]);

        $user->update($validated);

        return response()->json($user);
    }

    public function updatePassword(Request $request, User $user)
    {
        $this->authorize("update", $user);

        $validated = $request->validate([
            "current_password" => "required|string",
            "new_password" => "required|string|min:3|confirmed",
        ]);

        if (!Hash::check($validated["current_password"], $user->password)) {
            return response()->json(
                ["message" => "Current password is incorrect"],
                403,
            );
        }

        $user->password = Hash::make($validated["new_password"]);
        $user->save();

        return response()->json(["message" => "Password updated successfully"]);
    }

    public function destroy(User $user)
    {
        $this->authorize("delete", $user);

        $hasTransactions = $user->transactions()->exists();
        $hasGames = Game::where(function ($q) use ($user) {
            $q->where("player1_user_id", $user->id)->orWhere(
                "player2_user_id",
                $user->id,
            );
        })->exists();

        if ($hasTransactions || $hasGames) {
            $user->delete(); 
            $message =
                "User account deactivated (soft-deleted due to transaction/game history)";
        } else {
            $user->forceDelete(); 
            $message = "User permanently deleted";
        }

        return response()->json(["message" => $message]);
    }

    public function getGames(Request $request, User $user)
    {
        $this->authorize("view", $user);

        $query = \App\Models\Game::query()
            ->where(function ($q) use ($user) {
                $q->where("player1_user_id", $user->id)->orWhere(
                    "player2_user_id",
                    $user->id,
                );
            })
            ->with(["winner", "player1", "player2"]);

        if ($request->has("type")) {
            $query->where("type", $request->type);
        }

        if ($request->has("status")) {
            $query->where("status", $request->status);
        }

        if ($request->has("date_from")) {
            $query->whereDate("began_at", ">=", $request->date_from);
        }

        if ($request->has("date_to")) {
            $query->whereDate("began_at", "<=", $request->date_to);
        }

        $sortColumn = $request->get("sort_by", "began_at");
        $sortDirection = $request->get("sort_direction", "desc");

        $allowedColumns = [
            "began_at",
            "ended_at",
            "total_time",
            "total_points",
        ];
        if (in_array($sortColumn, $allowedColumns)) {
            $query->orderBy($sortColumn, $sortDirection);
        } else {
            $query->orderBy("began_at", $sortDirection);
        }

        $games = $query->paginate(10);

        $games->getCollection()->transform(function ($game) use ($user) {
            if ($game->winner_user_id == $user->id) {
                $game->outcome = "win";
            } elseif ($game->is_draw) {
                $game->outcome = "draw";
            } else {
                $game->outcome = "loss";
            }
            return $game;
        });

        return response()->json($games);
    }

    public function getMatches(Request $request, User $user)
    {
        $this->authorize("view", $user);

        $query = MatchGame::query()
            ->where(function ($q) use ($user) {
                $q->where("player1_user_id", $user->id)->orWhere(
                    "player2_user_id",
                    $user->id,
                );
            })
            ->with(["winner", "player1", "player2"]);

        if ($request->has("type")) {
            $query->where("type", $request->type);
        }

        if ($request->has("status")) {
            $query->where("status", $request->status);
        }

        if ($request->has("date_from")) {
            $query->whereDate("began_at", ">=", $request->date_from);
        }

        if ($request->has("date_to")) {
            $query->whereDate("began_at", "<=", $request->date_to);
        }

        $sortColumn = $request->get("sort_by", "began_at");
        $sortDirection = $request->get("sort_direction", "desc");

        $allowedColumns = ["began_at", "ended_at", "stake", "total_time"];
        if (in_array($sortColumn, $allowedColumns)) {
            $query->orderBy($sortColumn, $sortDirection);
        } else {
            $query->orderBy("began_at", $sortDirection);
        }

        $matches = $query->paginate(10);

        $matches->getCollection()->transform(function ($match) use ($user) {
            if ($match->winner_user_id == $user->id) {
                $match->outcome = "win";
            } elseif (
                $match->winner_user_id &&
                $match->winner_user_id != $user->id
            ) {
                $match->outcome = "loss";
            } else {
                $match->outcome = "interrupted"; 
            }
            return $match;
        });

        return response()->json($matches);
    }

    public function block(User $user)
    {
        $this->authorize("block", $user);

        $user->blocked = true;
        $user->save();

        $user->tokens()->delete();

        return response()->json(["message" => "User blocked successfully"]);
    }

    public function unblock(User $user)
    {
        $this->authorize("unblock", $user);

        $user->blocked = false;
        $user->save();

        return response()->json(["message" => "User unblocked successfully"]);
    }

    public function getTransactions(Request $request, User $user)
    {
        if (
            $request->user()->id !== $user->id &&
            $request->user()->type !== "A"
        ) {
            return response()->json(["message" => "Forbidden"], 403);
        }

        $query = $user->transactions()->with("type");

        if ($request->has("type")) {
            $query->whereHas("type", function ($q) use ($request) {
                $q->where("type", $request->type);
            });
        }

        if ($request->has("date_from")) {
            $query->whereDate(
                "transaction_datetime",
                ">=",
                $request->date_from,
            );
        }

        if ($request->has("date_to")) {
            $query->whereDate("transaction_datetime", "<=", $request->date_to);
        }

        $transactions = $query
            ->orderBy("transaction_datetime", "desc")
            ->paginate(10);

        return response()->json($transactions);
    }

    public function getMyTransactions(Request $request)
    {
        return $this->getTransactions($request, $request->user());
    }
}
