<?php

namespace App\Http\Requests\Api\V1\Employees;

use Illuminate\Foundation\Http\FormRequest;

class SyncEmployeeSocialsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'socials' => ['required', 'array'],
            'socials.*.social_id' => ['required', 'integer'],
            'socials.*.href' => ['required', 'string', 'max:2048'],
        ];
    }
}

