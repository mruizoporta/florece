<?php

namespace App\Http\Requests\Api\V1\Catalog;

use Illuminate\Foundation\Http\FormRequest;

class UpdateServiceRequest extends FormRequest
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
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:75'],
            'slug' => ['required', 'string', 'max:255', 'alpha_dash'],
            'price' => ['required', 'numeric', 'min:0'],
            'description' => ['required', 'string', 'max:75'],
            'image' => ['nullable', 'string', 'max:2048'],
            'status' => ['required', 'boolean'],
            'duration_time' => ['required', 'integer', 'min:1'],
        ];
    }
}

