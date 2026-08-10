<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Type extends Model
{
    use BelongsToTenant;
    use HasFactory;

    public $timestamps = false;

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }
}
