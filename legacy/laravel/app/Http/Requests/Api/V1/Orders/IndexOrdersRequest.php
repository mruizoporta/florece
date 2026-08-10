<?php

namespace App\Http\Requests\Api\V1\Orders;

use Illuminate\Foundation\Http\FormRequest;

class IndexOrdersRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:150'],
            'status' => ['nullable', 'in:draft,finalized,cancelled'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:200'],
        ];
    }
}

