@props(['tone' => 'muted'])

@php
    $toneClass = match ($tone) {
        'success' => 'shearly-badge-success',
        'danger' => 'shearly-badge-danger',
        default => 'shearly-badge-muted',
    };
@endphp

<span {{ $attributes->class('badge shearly-badge '.$toneClass) }}>
    {{ $slot }}
</span>

