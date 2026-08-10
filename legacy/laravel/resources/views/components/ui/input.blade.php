@props([
    'type' => 'text',
    'name' => null,
    'value' => null,
])

<input
    type="{{ $type }}"
    @if($name) name="{{ $name }}" @endif
    value="{{ old($name, $value) }}"
    {{ $attributes->class('form-control shearly-input') }}
/>

