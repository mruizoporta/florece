<?php

/**
 * Valores mostrados en la landing cuando plans.price_*_monthly aún no está en BD.
 * No afecta a Stripe; solo UX / comparación de planes.
 */
return [
    'plan_display_prices' => [
        'basico' => ['ni' => 9, 'us' => 19],
        'pro' => ['ni' => 19, 'us' => 39],
        'premium' => ['ni' => 29, 'us' => 69],
    ],
];
