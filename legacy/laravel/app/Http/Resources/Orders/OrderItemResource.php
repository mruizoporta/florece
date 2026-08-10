<?php

namespace App\Http\Resources\Orders;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'product_id' => $this->product_id ? (int) $this->product_id : null,
            'item_id' => $this->item_id ? (int) $this->item_id : null,
            'product_name_snapshot' => (string) $this->product_name_snapshot,
            'unit_price_snapshot' => (float) $this->unit_price_snapshot,
            'quantity' => (int) $this->quantity,
            'line_discount' => (float) $this->line_discount,
            'line_tax' => (float) $this->line_tax,
            'line_total' => (float) $this->line_total,
        ];
    }
}

