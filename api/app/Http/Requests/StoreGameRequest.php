<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;

class StoreGameRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Auth::check();
    }

    public function rules(): array
    {
        return [
            'type' => 'required|in:3,9',
        ];
    }

    public function messages(): array
    {
        return [
            'type.required' => 'You must choose a game type (Bisca de 3 or 9).',
            'type.in' => 'Invalid game type. Choose 3 or 9.',
        ];
    }
}