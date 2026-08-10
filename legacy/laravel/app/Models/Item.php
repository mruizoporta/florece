<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Models\Setting;

class Item extends Model
{
    use BelongsToTenant;
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'slug',
        'price',
        'description',
        'image',
        'status',
        'tenant_id',
    ];

    public function getPriceFormattedAttribute()
    {
        $currencySymbol = \App\Support\TenantDataCache::setting()?->currency_symbol
            ?? Setting::query()->value('currency_symbol')
            ?? '$';

        return $currencySymbol.' '.number_format($this->attributes['price'], 2);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Antes estaba "products", checkear luego que todo funcione con "product"
     */
    public function product()
    {
        return $this->hasOne(Product::class);
    }

    public function service()
    {
        return $this->hasOne(Service::class);
    }

    public function orders()
    {
        return $this->belongsToMany(Order::class, 'item_order', 'item_id', 'order_id')
            ->withPivot('price', 'quantity');
    }
}
