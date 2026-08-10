<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Status extends Model
{
    use BelongsToTenant;
    use HasFactory;

    protected $table = 'status';

    public $timestamps = false;

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }
}
