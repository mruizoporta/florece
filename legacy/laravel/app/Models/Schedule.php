<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    use BelongsToTenant;
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'weekday',
        'start_time',
        'end_time',
        'status',
        'tenant_id',
    ];

    protected $casts = [
        'status' => 'boolean',
        'weekday' => 'integer',
    ];

    public function getDayName($weekday)
    {
        switch ($weekday) {
            case 1:
                return 'Lunes';
                break;
            case 2:
                return 'Martes';
                break;
            case 3:
                return 'Miércoles';
                break;
            case 4:
                return 'Jueves';
                break;
            case 5:
                return 'Viernes';
                break;
            case 6:
                return 'Sábado';
                break;
            case 7:
                return 'Domingo';
                break;

            default:
                return 'Error';
                break;
        }
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
