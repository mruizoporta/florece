<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use BelongsToTenant;
    use HasFactory;

    use SoftDeletes;

    protected $fillable = [
        'customer_id',
        'employee_id',
        'payment_status',
        'name',
        'status',
        'subtotal',
        'discount',
        'discount_total',
        'tax_total',
        'total',
        'finalized_at',
        'cancelled_at',
        'cancelled_reason',
        'tenant_id',
    ];

    protected $casts = [
        'subtotal' => 'float',
        'discount' => 'float',
        'discount_total' => 'float',
        'tax_total' => 'float',
        'total' => 'float',
        'payment_status' => 'boolean',
        'finalized_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function items()
    {
        return $this->hasMany(ItemOrder::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function payments()
    {
        return $this->hasMany(OrderPayment::class);
    }
}
