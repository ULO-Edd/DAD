<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;


class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        return response()->json($user);
    }

    public function update(Request $request)
    {
        $request->validate([
            "name" => "required|string|max:255",
            "nickname" =>
                "required|string|max:255|unique:users,nickname," .
                $request->user()->id,
        ]);

        $user = $request->user();
        $user->name = $request->name;
        $user->nickname = $request->nickname;
        $user->save();

        return response()->json($user);
    }

    public function destroy(User $user)
    {
        $currentUser = Auth::user();

        if ($currentUser->id !== $user->id && $currentUser->type !== "A") {
            return response()->json(["message" => "Unauthorized"], 403);
        }

        $user->delete();

        return response()->json(["message" => "User deleted successfully"]);
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            "current_password" => "required",
            "new_password" => "required|min:8|confirmed",
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(
                [
                    "message" => "Current password is incorrect",
                ],
                422,
            );
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            "message" => "Password changed successfully",
        ]);
    }

    public function getCoins(Request $request)
    {
        return response()->json([
            'coins' => $request->user()->coins_balance
        ]);
    }

    public function uploadAvatar(Request $request)
    {
        $request->validate([
            "avatar" => "required|image|mimes:jpeg,png,jpg,gif|max:2048",
        ]);

        $user = $request->user();

        if ($user->photo_avatar_filename) {
            Storage::disk("public")->delete(
                "photos_avatars/" . $user->photo_avatar_filename,
            );
        }

        $file = $request->file("avatar");
        $filename =
            str_pad($user->id, 5, "0", STR_PAD_LEFT) .
            "_" .
            Str::random(10) .
            "." .
            $file->extension();
        $file->storeAs("photos_avatars", $filename, "public");

        $user->photo_avatar_filename = $filename;
        $user->save();

        return response()->json($user);
    }
}
