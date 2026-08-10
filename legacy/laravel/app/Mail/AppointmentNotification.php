<?php

namespace App\Mail;

use App\Models\Setting;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AppointmentNotification extends Mailable
{
    use Queueable, SerializesModels;

    public $appointment;

    public $setting;

    public function __construct($appointment)
    {
        $this->appointment = $appointment;
        $this->setting = Setting::first();
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: __('app.mail.appointment.subject'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.appointment-notification',
            with: [
                'appointment' => $this->appointment,
                'setting' => $this->setting,
            ],
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
