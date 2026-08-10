<div>
    <form wire:submit="save">

        <!-- embedded_content_map -->
        <div class="mb-3">
            <x-input-text name="form.embedded_content_map" label="Contenido embebido" type="text"
                wire:model="form.embedded_content_map" />
        </div><!-- ./embedded_content_map -->


        <div class="row mb-3">
            <div class="col">
                <button type="submit" class="btn btn-warning float-end">
                    Actualizar
                    <div wire:loading class="spinner-border spinner-border-sm" role="status">
                        <span class="visually-hidden">Loading...</span>
                    </div>
                </button>
            </div>
        </div>


        <div style="overflow: hidden">
            {!! $form->embedded_content_map !!}
        </div>

    </form>
</div>
