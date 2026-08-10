<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use BelongsToTenant;
    use HasFactory;

    protected $fillable = [
        'item_id',
        'stock',
        'stock_alert',
        'long_description',
        'tenant_id',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function images()
    {
        return $this->hasMany(Image::class);
    }
}
