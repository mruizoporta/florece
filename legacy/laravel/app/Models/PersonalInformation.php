<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PersonalInformation extends Model
{
    use BelongsToTenant;
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'document',
        'location',
        'address',
        'phone',
        'tenant_id',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
