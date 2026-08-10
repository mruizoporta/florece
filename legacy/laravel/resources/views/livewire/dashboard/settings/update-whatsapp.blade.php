<div>
    <form wire:submit="update">

        <div class="callout callout-info" role="alert">
            Ingrese a continuación su número de whatsapp incluyendo el código país. Ej: 59812345678. Posteriormente presione la tecla <strong>Enter</strong>.
        </div>

        <!-- whatsapp -->
        <div class="mb-3">
            <x-input-text name="form.whatsapp" label="Número de Whatsapp" type="number" wire:model.blur="form.whatsapp" />
        </div><!-- ./whatsapp -->

        <div class="float-end">
            <a href="https://wa.me/+{{ $form->whatsapp }}" target="_blank" class="btn btn-ghost-success float-end" type="button">
                <svg class="icon">
                    <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/brand.svg#cib-whatsapp') }}"></use>
                </svg>
                Probar
            </a>
        </div>

    </form>
</div>
