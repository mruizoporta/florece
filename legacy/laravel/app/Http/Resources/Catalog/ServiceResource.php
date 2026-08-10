<?php

namespace App\Http\Resources\Catalog;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ServiceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'duration_time' => $this->duration_time,
            'item' => $this->whenLoaded('item', function () {
                return [
                    'id' => $this->item->id,
                    'name' => $this->item->name,
                    'slug' => $this->item->slug,
                    'price' => (float) $this->item->price,
                    'description' => $this->item->description,
                    'image' => $this->item->image,
                    'status' => (bool) $this->item->status,
                    'category' => $this->whenLoaded('item.category', function () {
                        return [
                            'id' => $this->item->category->id,
                            'name' => $this->item->category->name,
                            'slug' => $this->item->category->slug,
                        ];
                    }),
                ];
            }),
        ];
    }
}

