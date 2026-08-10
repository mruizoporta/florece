<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Dominio principal
    |--------------------------------------------------------------------------
    | Ej: shearly.app (producción) o localhost (desarrollo con subdominios)
    */
    'domain' => env('TENANT_DOMAIN') ?: (parse_url(env('APP_URL', 'http://localhost'), PHP_URL_HOST) ?: 'localhost'),

    /*
    |--------------------------------------------------------------------------
    | Fallback local: parámetro de query para simular subdominio
    |--------------------------------------------------------------------------
    | Cuando APP_ENV=local y host es localhost, ?tenant=slug permite probar
    | sin configurar /etc/hosts. Ej: localhost:8000?tenant=mi-salon
    */
    'local_query_fallback' => env('TENANT_LOCAL_QUERY_FALLBACK', true),

];
