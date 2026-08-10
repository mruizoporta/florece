@props(['messages'])

@if ($messages)
    <ul {{ $attributes->merge(['class' => 'text-sm font-medium text-red-700 bg-red-50 border border-red-100/80 rounded-lg px-3 py-2 space-y-0.5']) }} role="alert">
        @foreach ((array) $messages as $message)
            <li>{{ $message }}</li>
        @endforeach
    </ul>
@endif
