<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use BelongsToTenant;
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'active_appointment',
        'appointment_type',
        'company_name',
        'mail_contact',
        'location',
        'address',
        'phone',
        'currency_symbol',
        'whatsapp',
        'instagram_href',
        'embedded_content_map',
        'logo',
        'banner',
        'about_us',
        'schedules',
        'image_left',
        'image_right',
        'image_parallax',
        'buttons_background_color',
        'buttons_text_color',
        'icons_color',
        'titles_color',
        'footer_background_color',
        'footer_text_color',
        'btn_whatsapp_background_color',
        'btn_whatsapp_text_color',
        'tenant_id',
    ];
}
