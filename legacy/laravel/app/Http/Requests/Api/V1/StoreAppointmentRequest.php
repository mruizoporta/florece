<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class StoreAppointmentRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:75'],
            'phone' => ['nullable', 'string', 'max:15'],
            'type_id' => ['required', 'integer'],
            'employee_id' => ['required', 'integer', 'exists:employees,id'],
            'date' => ['required', 'date', 'after_or_equal:today'],
            'time' => ['required', 'date_format:H:i'],
            'service_ids' => ['required', 'array', 'min:1'],
            'service_ids.*' => ['integer', 'exists:services,id'],
            'status_id' => ['sometimes', 'integer'],
            'customer_id' => ['sometimes', 'integer', 'min:1'],
        ];
    }
}
