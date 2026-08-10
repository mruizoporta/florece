@props(['title' => null, 'padding' => true])

<section {{ $attributes->class('shearly-card') }}>
    @if($title || isset($header) || isset($actions))
        <header class="shearly-card-header">
            <div class="d-flex align-items-center gap-2 min-w-0">
                @if(isset($header))
                    {{ $header }}
                @elseif($title)
                    <h3 class="mb-0 fs-6 fw-semibold text-brand-ink text-truncate">{{ $title }}</h3>
                @endif
            </div>
            @if(isset($actions))
                <div class="d-flex align-items-center gap-2">
                    {{ $actions }}
                </div>
            @endif
        </header>
    @endif

    <div @class(['shearly-card-body' => $padding])>
        {{ $slot }}
    </div>
</section>

