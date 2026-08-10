<div>
    <div class="callout callout-info">
        El contenido carga de forma diferida, recarga la página para visualizar los cambios.
    </div>
    <div class="row">
        @forelse($instagram_feeds as $feed)

        <div class="col-sm-12 col-md-6 col-lg-4">
            <button type="button" @click="$dispatch('delete-instagram-feed', { id: '{{ $feed->id }}' })" class="btn btn-ghost-danger float-end my-3" title="Remover">
                <svg class="icon">
                    <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-x') }}"></use>
                </svg>
            </button>

            {!! $feed->content !!}
        </div>
        @empty
            <p>Sin resultados</p>
        @endforelse
    </div>

    <div class="toast-container position-fixed top-0 end-0 p-3">
        <div id="liveToast2" class="toast" role="alert" aria-live="assertive" aria-atomic="true" data-coreui-autohide="false">
            <div class="toast-body">
                <span id="toastQuestion"></span>
                <div class="mt-2 pt-2 border-top">
                    <button type="button" wire:click="delete($event.target.getAttribute('data-instagram-feed-id'))" id="btn-delete-instagram-feed" class="btn btn-danger btn-sm text-white">Eliminar</button>
                    <button type="button" class="btn btn-secondary btn-sm" data-coreui-dismiss="toast">Cerrar</button>
                </div>
            </div>
        </div>
    </div>

    @push('js')
        <script>
            window.addEventListener('delete-instagram-feed', event => {
                var id = event.detail.id

                const toastLiveExample = document.getElementById('liveToast2')

                const deleteButton = toastLiveExample.querySelector('#btn-delete-instagram-feed');
                deleteButton.setAttribute('data-instagram-feed-id', id);

                toastQuestion.textContent = '¿Deseas eliminalo?'

                const toast = new coreui.Toast(toastLiveExample)
                toast.show()
            });
        </script>
    @endpush

</div>
