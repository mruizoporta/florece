<div wire:ignore.self class="modal fade" tabindex="-1" id="modal-update">
    <div class="modal-dialog">
        <div class="modal-content">
            <form wire:submit="save">
                <div class="modal-header">
                    <h5 class="modal-title">Editar sponsor</h5>
                    <button type="button" class="btn-close" data-coreui-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">

                    @include('livewire.dashboard.sponsors.partials.form')

                    <div class="row">
                        <div class="col-6">
                            <label for="">Actual:</label>
                            <br>
                            @if (isset($form->currentImage))
                                <img src="{{ asset($this->verySmall('storage/sponsors/', $form->currentImage)) }}" width="64px" loading="lazy">
                            @endif
                        </div>

                        <div class="col-6">
                            <label for="">Nueva:</label>
                            <br>
                            @if ($form->image)
                                <img src="{{ $form->image->temporaryUrl() }}" width="64px">
                            @endif
                        </div>
                    </div>

                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-coreui-dismiss="modal">Cerrar</button>
                    <button type="submit" class="btn btn-warning">
                        Actualizar
                        <div wire:loading.delay class="spinner-border spinner-border-sm" role="status">
                            <span class="visually-hidden"></span>
                        </div>
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
