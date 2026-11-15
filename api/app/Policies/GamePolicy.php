<?php

namespace App\Policies;

use App\Models\Game;
use App\Models\User;

class GamePolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Game $game): bool
    {
        if ($user->type === "A") {
            return true;
        }

        if (
            $game->player1_user_id === $user->id ||
            $game->player2_user_id === $user->id
        ) {
            return true;
        }

        if ($game->status === "Pending") {
            return true;
        }

        return false;
    }

    public function create(User $user): bool
    {
        if ($user->type === "A") {
            return false;
        }

        return true;
    }

    public function join(User $user, Game $game): bool
    {
        if ($user->type === "A") {
            return false;
        }

        if (
            $game->status !== "Pending" ||
            $game->player1_user_id === $user->id
        ) {
            return false;
        }

        if ($game->player2_user_id !== null && $game->player2_user_id !== 1) {
            return false;
        }

        return true;
    }

    public function resign(User $user, Game $game): bool
    {
        if ($user->type === "A") {
            return false;
        }

        if (
            $game->status !== "Playing" ||
            ($game->player1_user_id !== $user->id &&
                $game->player2_user_id !== $user->id)
        ) {
            return false;
        }

        return true;
    }

    public function update(User $user, Game $game): bool
    {
        if ($user->type === "A") {
            return false;
        }

        if (!in_array($game->status, ['Playing', 'Pending'])) {
            return false;
        }

        if ($game->player1_user_id !== $user->id && $game->player2_user_id !== $user->id) {
            return false;
        }

        return true;
    }

    public function delete(User $user, Game $game): bool
    {
        return $user->type === "A";
    }

    public function restore(User $user, Game $game): bool
    {
        return false;
    }

    public function forceDelete(User $user, Game $game): bool
    {
        return false;
    }
}
