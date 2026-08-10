<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

class Sponsor extends Model
{
    use BelongsToTenant;
    use HasFactory;

    use SOftDeletes;

    protected $fillable = [
        'name',
        'image',
        'tenant_id',
    ];
}
