<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LocaleController extends Controller
{
    private const SUPPORTED = ['es', 'en'];

    public function set(Request $request, string $locale): RedirectResponse
    {
        abort_unless(in_array($locale, self::SUPPORTED, true), 404);

        $request->session()->put('locale', $locale);
        $request->session()->put('locale_initialized', true);

        return redirect()->back();
    }
}
