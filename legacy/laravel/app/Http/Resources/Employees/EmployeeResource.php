<?php

namespace App\Http\Resources\Employees;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
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
            'status' => (bool) $this->status,
            'visible_public' => (bool) $this->visible_public,
            'socials' => $this->whenLoaded('socials', function () {
                return $this->socials->map(fn ($social) => [
                    'id' => $social->id,
                    'name' => $social->name,
                    'icon' => $social->icon,
                    'href' => (string) ($social->pivot?->href ?? ''),
                ])->values();
            }),
            'schedules' => $this->whenLoaded('schedules', function () {
                return $this->schedules->map(fn ($schedule) => [
                    'weekday' => (int) $schedule->weekday,
                    'start_time' => substr((string) $schedule->start_time, 0, 5),
                    'end_time' => substr((string) $schedule->end_time, 0, 5),
                    'status' => (bool) $schedule->status,
                ])->values();
            }),
        ];
    }
}

