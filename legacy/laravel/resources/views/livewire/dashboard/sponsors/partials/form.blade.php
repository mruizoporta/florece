<!-- name -->
<div class="mb-3">
    <x-input-text name="form.name" label="Nombre" type="text" wire:model.blur="form.name" />
</div><!-- ./name -->

<!-- image -->
<div class="mb-3">
    <x-input-file name="form.image" label="Avatar" wire:model="form.image" id="{{ rand() }}" />
</div><!-- ./image -->
