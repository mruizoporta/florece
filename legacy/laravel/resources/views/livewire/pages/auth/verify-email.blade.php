<?php

use App\Livewire\Actions\Logout;
use App\Providers\RouteServiceProvider;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Session;
use Livewire\Attributes\Layout;
use Livewire\Volt\Component;

new #[Layout('layouts.guest')] class extends Component
{
    /**
     * Send an email verification notification to the user.
     */
    public function sendVerification(): void
    {
        if (Auth::user()->hasVerifiedEmail()) {
            $this->redirect(
                session('url.intended', RouteServiceProvider::HOME),
                navigate: true
            );

            return;
        }

        Auth::user()->sendEmailVerificationNotification();

        Session::flash('status', 'verification-link-sent');
    }

    /**
     * Log the current user out of the application.
     */
    public function logout(Logout $logout): void
    {
        $logout();

        $this->redirect('/', navigate: true);
    }
}; ?>

<div>
    <div class="mb-4 text-sm text-gray-600">
        {{ __('app.auth.verify_email_intro') }}
    </div>

    @if (session('status') == 'verification-link-sent')
        <div class="mb-4 font-medium text-sm text-shearly-800">
            {{ __('app.auth.verify_email_sent') }}
        </div>
    @endif

    <div class="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <x-auth-submit-button type="button" wire:click="sendVerification">
            {{ __('app.auth.resend_verification') }}
        </x-auth-submit-button>

        <button wire:click="logout" type="button" class="text-sm text-gray-500 underline underline-offset-2 hover:text-shearly-800 text-center sm:text-right">
            {{ __('app.auth.log_out') }}
        </button>
    </div>
</div>
