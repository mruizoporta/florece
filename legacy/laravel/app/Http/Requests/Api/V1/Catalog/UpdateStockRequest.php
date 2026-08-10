<?php

namespace App\Http\Requests\Api\V1\Catalog;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStockRequest extends FormRequest
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
            'stock' => ['required', 'integer', 'min:0'],
            'stock_alert' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}

