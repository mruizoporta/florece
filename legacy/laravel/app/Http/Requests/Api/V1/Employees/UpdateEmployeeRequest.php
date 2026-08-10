<?php

namespace App\Http\Requests\Api\V1\Employees;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEmployeeRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:120'],
            'description' => ['required', 'string', 'max:500'],
            'image' => ['required', 'string', 'max:2048'],
            'status' => ['required', 'boolean'],
            'visible_public' => ['required', 'boolean'],
        ];
    }
}

