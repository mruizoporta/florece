<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Image extends Model
{
    use BelongsToTenant;
    use HasFactory;

    protected $fillable = [
        'product_id',
        'image',
        'order',
        'tenant_id',
    ];

    /**
     * Método para que, al momento de crear una nueva imagen, se obtenga
     * el último valor del campo order
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($image) {
            // Obtén el último orden para el producto actual
            $lastOrder = self::where('product_id', $image->product_id)->max('order');

            // Asigna el siguiente orden
            $image->order = $lastOrder + 1;
        });
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
