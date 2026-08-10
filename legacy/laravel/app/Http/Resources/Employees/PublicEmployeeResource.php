<?php

namespace App\Http\Resources\Employees;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PublicEmployeeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'image' => $this->image,
            'socials' => $this->whenLoaded('socials', function () {
                return $this->socials->map(fn ($social) => [
                    'id' => $social->id,
                    'name' => $social->name,
                    'icon' => $social->icon,
                    'href' => (string) ($social->pivot?->href ?? ''),
                ])->values();
            }),
        ];
    }
}

