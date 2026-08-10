@props(['name', 'label', 'type'])
@php
    $inputId = 'fld_' . preg_replace('/[^a-zA-Z0-9_]/', '_', $name);
@endphp
<div class="form-floating">
    <input id="{{ $inputId }}"
           type="{{ $type }}"
           name="{{ $name }}"
           class="form-control @error($name) is-invalid @enderror"
           {{ $attributes->merge(['placeholder' => ' '], false) }}>
    <label for="{{ $inputId }}">{{ $label }}</label>
    @error($name)<div class="invalid-feedback">{{ $message }}</div>@enderror
</div>
