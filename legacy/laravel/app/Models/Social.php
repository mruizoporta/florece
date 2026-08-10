<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Social extends Model
{
    use BelongsToTenant;
    use HasFactory;

    protected $fillable = [
        'name',
        'icon',
        'tenant_id',
    ];

    public function employees()
    {
        return $this->belongsToMany(Employee::class);
    }
}
