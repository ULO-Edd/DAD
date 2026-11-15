<?php

namespace App\Policies;

use App\Models\CoinTransaction;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class CoinTransactionPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->type === 'A' ? true : false;
    }
}
