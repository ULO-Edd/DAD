<?php

namespace App\Http\Controllers;

use App\Models\CoinTransaction;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    
    public function index(Request $request)
    {

        $this->authorize('viewAny', CoinTransaction::class);

        $query = CoinTransaction::with('user:id,nickname,email', 'type:id,name');
        
        if ($request->has('sort_coins')) {
            $direction = $request->get('sort_coins') === 'asc' ? 'asc' : 'desc';
            $query->orderBy('coins', $direction);
        } 
        
        $dateDirection = $request->get('sort_datetime') === 'asc' ? 'asc' : 'desc';
        $query->orderBy('transaction_datetime', $dateDirection);

       
        $transactions = $query->paginate(15);

        return response()->json($transactions);
    }
}