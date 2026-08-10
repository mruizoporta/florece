<?php

namespace App\Http\Requests\Api\V1\Employees;

use Illuminate\Foundation\Http\FormRequest;

class ReplaceWeeklyScheduleRequest extends FormRequest
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
            'week' => ['required', 'array'],
            'week.*' => ['array'],
            'week.*.*.start' => ['required', 'date_format:H:i'],
            'week.*.*.end' => ['required', 'date_format:H:i'],
        ];
    }
}

