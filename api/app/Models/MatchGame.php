<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MatchGame extends Model
{
    use HasFactory;

    protected $table = 'matches';

    public $timestamps = false;

    protected $fillable = [
        'type',
        'status',
        'player1_user_id',
        'player2_user_id',
        'winner_user_id',
        'loser_user_id',
        'began_at',
        'ended_at',
        'total_time',
        'player1_marks',
        'player2_marks',
        'player1_points',
        'player2_points',
        'stake',
        'custom'
    ];

    protected $casts = [
        'began_at' => 'datetime',
        'ended_at' => 'datetime',
        'player1_marks' => 'integer',
        'player2_marks' => 'integer',
        'player1_points' => 'integer',
        'player2_points' => 'integer',
        'stake' => 'integer',
    ];

    public function player1()
    {
        return $this->belongsTo(User::class, 'player1_user_id');
    }

    public function player2()
    {
        return $this->belongsTo(User::class, 'player2_user_id');
    }

    public function winner()
    {
        return $this->belongsTo(User::class, 'winner_user_id');
    }
}