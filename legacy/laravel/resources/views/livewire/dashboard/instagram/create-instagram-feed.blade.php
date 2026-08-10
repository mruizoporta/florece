<div>
    <form wire:submit="save">

        <!-- content -->
        <div class="form-floating mb-3">
            <x-input-text name="form.content" label="Contenido embebido" type="text" wire:model="form.content" />
        </div>

        <button type="submit" class="btn btn-primary float-end my-3">
            Ingresar
            <div wire:loading.delay class="spinner-border spinner-border-sm" role="status">
                <span class="visually-hidden"></span>
            </div>
        </button>

    </form>
</div>
