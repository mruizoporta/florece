<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Trial (sin tarjeta al registro)
    |--------------------------------------------------------------------------
    |
    | Días de prueba desde el alta del salón. El usuario puede usar el sistema
    | sin método de pago durante este período. La suscripción en Stripe se
    | crea solo cuando añade tarjeta (Checkout o API).
    |
    */

    'trial_days' => (int) env('BILLING_TRIAL_DAYS', 7),

    /*
    | A partir de cuántos días antes del fin del trial mostramos aviso destacado
    | para añadir método de pago (banner en el dashboard).
    |
    */

    'trial_reminder_days' => (int) env('BILLING_TRIAL_REMINDER_DAYS', 3),

    /*
    |--------------------------------------------------------------------------
    | Past Due Grace Period (days)
    |--------------------------------------------------------------------------
    |
    | Número de días de gracia cuando subscription_status es past_due.
    | Durante este período el tenant mantiene acceso (con advertencia).
    | Después del período se bloquea el acceso hasta actualizar el pago.
    |
    | null = sin gracia, bloquear inmediatamente
    | 3 = 3 días de gracia
    |
    */

    'past_due_grace_days' => env('BILLING_PAST_DUE_GRACE_DAYS', 3),

];
