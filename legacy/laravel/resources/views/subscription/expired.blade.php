<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ config('app.name') }} - Suscripción</title>
    <x-favicon-links />
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="font-sans antialiased bg-gray-100 dark:bg-gray-900 min-h-screen flex items-center justify-center">
    <div class="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow text-center space-y-4">
        <h1 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Suscripción inactiva o vencida
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
            Tu suscripción ha expirado o está cancelada. Actualiza tu método de pago o elige un plan para continuar usando el servicio.
        </p>
        <div class="flex flex-col sm:flex-row gap-2 justify-center">
            @auth
                @if(auth()->user()->hasRole('Admin'))
                    <a href="{{ tenant_url('/billing') }}" class="inline-block px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                        Ir a facturación
                    </a>
                @endif
            @endauth
            <a href="{{ url('/') }}" class="inline-block text-indigo-600 hover:underline">
                Volver al inicio
            </a>
        </div>
    </div>
</body>
</html>
