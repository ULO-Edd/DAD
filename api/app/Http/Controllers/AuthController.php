<?php

namespace App\Http\Controllers;

use App\Http\Requests\RegisterRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (! Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = Auth::user();

        if ($user->blocked) {
            Auth::logout();

            return response()->json(['message' => 'Your account is blocked. Please contact support.'], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    public function register(RegisterRequest $request)
    {
        if (User::where('email', $request->email)->exists()) {
            return response()->json(['message' => 'Email already registered'], 409);
        }
        
        if (User::where('nickname', $request->nickname)->exists()) {
            return response()->json(['message' => 'Nickname already registered'], 409);
        }

        $avatarFilename = null;

        if ($request->hasFile('photo_avatar_filename')) {
            $file = $request->file('photo_avatar_filename');
            $path = $file->store('photos_avatars', 'public');
            $avatarFilename = basename($path);
        }

        $user = User::create([
            'email' => $request->email,
            'nickname' => $request->nickname,
            'name' => $request->name,
            'password' => bcrypt($request->password),
            'photo_avatar_filename' => $avatarFilename,
            'type' => 'P',
            'blocked' => false,
            'coins_balance' => 10,
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'User registered successfully',
            'user' => $user,
            'token' => $token,
        ], 201);
    }
}
