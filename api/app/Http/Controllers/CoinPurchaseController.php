<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\CoinPurchase;
use App\Models\CoinTransaction;
use App\Models\CoinTransactionType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CoinPurchaseController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'euros' => 'required|numeric|min:1|max:100',
            'payment_type' => 'required|in:MBWAY,MB,VISA,PAYPAL',
            'payment_reference' => [
                'required',
                function ($attribute, $value, $fail) use ($request) {
                    $type = $request->payment_type;
                    $regex = null;

                    switch ($type) {
                        case 'MBWAY': $regex = '/^9[0-9]{8}$/'; break;
                        case 'MB':    $regex = '/^[0-9]{5}-[0-9]{9}$/'; break;
                        case 'VISA':  $regex = '/^4[0-9]{15}$/'; break;
                        case 'PAYPAL':
                            if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
                                $fail("Invalid PayPal email.");
                            }
                            return;
                    }

                    if ($regex && !preg_match($regex, $value)) {
                        $fail("Invalid format for $type.");
                    }
                },
            ],
        ]);

        $user = $request->user();
        $coinsAmount = $validated['euros'] * 10; 

        return DB::transaction(function () use ($user, $validated, $coinsAmount) {
            
            $type = CoinTransactionType::firstOrCreate(['name' => 'Coin purchase'], ['type' => 'C']);

            $transaction = CoinTransaction::create([
                'user_id' => $user->id,
                'coin_transaction_type_id' => $type->id,
                'transaction_datetime' => now(),
                'coins' => $coinsAmount,
            ]);

            $purchase = CoinPurchase::create([
                'purchase_datetime' => now(),
                'user_id' => $user->id,
                'coin_transaction_id' => $transaction->id,
                'euros' => $validated['euros'],
                'payment_type' => $validated['payment_type'],
                'payment_reference' => $validated['payment_reference'],
            ]);

            $user->increment('coins_balance', $coinsAmount);

            return response()->json([
                'message' => 'Purchase successful',
                'balance' => $user->coins_balance,
                'transaction_id' => $transaction->id,
                'purchase' => $purchase,
            ], 201);
        });
    }
}