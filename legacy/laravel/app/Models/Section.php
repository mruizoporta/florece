<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Section extends Model
{
    use BelongsToTenant;
    use HasFactory;

    protected $fillable = [
        'about_us_show_section',
        'about_us_text',
        'about_us_icon',
        'employees_show_section',
        'employees_text',
        'employees_icon',
        'services_show_section',
        'services_text',
        'services_icon',
        'products_show_section',
        'products_text',
        'products_icon',
        'instagram_show_section',
        'instagram_text',
        'instagram_icon',
        'whatsapp_show_section',
        'whatsapp_title_1',
        'whatsapp_title_2',
        'whatsapp_title_3',
        'whatsapp_icon',
        'btn_whatsapp_button_text',
        'tenant_id',
    ];
}
