<?php

namespace App\Http\Resources\Orders;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderPaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'method' => $this->method,
            'amount' => (float) $this->amount,
            'reference' => $this->reference,
            'paid_at' => $this->paid_at?->toISOString(),
        ];
    }
}

