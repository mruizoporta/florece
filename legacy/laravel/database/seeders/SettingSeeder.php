<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

use App\Models\Setting;
use App\Models\Tenant;

class SettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $tenantId = Tenant::query()->first()?->id ?? (int) env('SEED_TENANT_ID', 1);

        Setting::firstOrCreate(
            ['tenant_id' => $tenantId],
            [
                'company_name' => 'Blessing S.A',
                'mail_contact' => 'contacto@blessingstar.com',
                'location' => 'Nicaragua',
                'address' => 'Ciudad Doral',
                'phone' => '84368899',
                'whatsapp' => '50584368899',
                'instagram_href' => '',
                'embedded_content_map' => '<iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d6544.182153698619!2d-56.19872150495073!3d-34.90416384253965!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x959f802d934f2cbd%3A0x23b5034c707bf9fe!2sCentro%2C%20Montevideo%2C%20Departamento%20de%20Montevideo!5e0!3m2!1ses!2suy!4v1700766872799!5m2!1ses!2suy" width="400" height="300" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>',
                'about_us' => 'Lorem ipsum, dolor sit amet consectetur adipisicing elit. Facere voluptatibus quasi ratione, mollitia laboriosam temporibus ipsam eum, officia hic ut consectetur animi rem, consequatur expedita?',
                'schedules' => 'Lun a Sab de 10:00 a 18:00',
            ]
        );
    }
}
