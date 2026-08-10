<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use BelongsToTenant;
    use HasFactory;

    protected $fillable = [
        'user_id',
        'tenant_id',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Agendas
     */
    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }
}
