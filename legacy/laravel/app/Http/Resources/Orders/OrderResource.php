<?php

namespace App\Http\Resources\Orders;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'status' => (string) $this->status,
            'customer_id' => $this->customer_id ? (int) $this->customer_id : null,
            'employee_id' => $this->employee_id ? (int) $this->employee_id : null,
            'subtotal' => (float) $this->subtotal,
            'discount_total' => (float) ($this->discount_total ?? $this->discount ?? 0),
            'tax_total' => (float) ($this->tax_total ?? 0),
            'total' => (float) $this->total,
            'payment_status' => (bool) $this->payment_status,
            'finalized_at' => $this->finalized_at?->toISOString(),
            'cancelled_at' => $this->cancelled_at?->toISOString(),
            'cancelled_reason' => $this->cancelled_reason,
            'customer' => $this->whenLoaded('customer', function () {
                return [
                    'id' => $this->customer->id,
                    'user' => $this->customer->relationLoaded('user') && $this->customer->user
                        ? ['id' => $this->customer->user->id, 'name' => $this->customer->user->name]
                        : null,
                ];
            }),
            'employee' => $this->whenLoaded('employee', function () {
                return $this->employee
                    ? ['id' => $this->employee->id, 'name' => $this->employee->name]
                    : null;
            }),
            'items' => $this->whenLoaded('items', fn () => OrderItemResource::collection($this->items)->resolve()),
            'payments' => $this->whenLoaded('payments', fn () => OrderPaymentResource::collection($this->payments)->resolve()),
        ];
    }
}

