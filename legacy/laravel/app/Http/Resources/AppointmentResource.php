<?php

namespace App\Http\Resources;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'phone' => $this->phone,
            'start_time' => $this->start_time ? Carbon::parse($this->start_time)->toIso8601String() : null,
            'end_time' => $this->end_time ? Carbon::parse($this->end_time)->toIso8601String() : null,
            'status_id' => $this->status_id,
            'type_id' => $this->type_id,
            'employee_id' => $this->employee_id,
            'customer_id' => $this->customer_id,
            'status' => $this->whenLoaded('status', fn () => [
                'id' => $this->status->id,
                'name' => $this->status->name ?? null,
            ]),
            'employee' => $this->whenLoaded('employee', fn () => $this->employee ? [
                'id' => $this->employee->id,
                'name' => $this->employee->name,
            ] : null),
        ];
    }
}
