<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

class ItemOrder extends Model
{
    use BelongsToTenant;
    use HasFactory;

    use SoftDeletes;

    protected $table = 'item_order';

    protected $fillable = [
        'item_id',
        'product_id',
        'order_id',
        'price',
        'product_name_snapshot',
        'unit_price_snapshot',
        'line_discount',
        'line_tax',
        'line_total',
        'quantity',
        'tenant_id',
    ];

    protected $casts = [
        'price' => 'float',
        'unit_price_snapshot' => 'float',
        'line_discount' => 'float',
        'line_tax' => 'float',
        'line_total' => 'float',
        'quantity' => 'integer',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
