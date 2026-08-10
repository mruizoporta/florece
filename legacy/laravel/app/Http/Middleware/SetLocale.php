<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    private const SUPPORTED = ['es', 'en'];

    public function handle(Request $request, Closure $next): Response
    {
        $locale = null;

        if ($request->session()->has('locale')) {
            $candidate = $request->session()->get('locale');
            if (in_array($candidate, self::SUPPORTED, true)) {
                $locale = $candidate;
            }
        }

        if ($locale === null && ! $request->session()->has('locale_initialized')) {
            $preferred = $request->getPreferredLanguage(self::SUPPORTED);
            $locale = $preferred === 'en' ? 'en' : 'es';
            $request->session()->put('locale', $locale);
            $request->session()->put('locale_initialized', true);
        }

        if ($locale === null) {
            $locale = config('app.locale');
        }

        App::setLocale($locale);

        return $next($request);
    }
}
