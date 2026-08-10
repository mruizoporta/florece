<div>

    <code>Seleccione el texto para comenzar a editar</code>

    <div wire:ignore id="editor" class="my-3"></div>

    <button type="button" @click="$dispatch('update-long_description')" class="btn btn-warning float-end my-3">
        Actualizar
    </button>

    @push('js')
        <script src="https://cdn.ckeditor.com/ckeditor5/40.0.0/balloon/ckeditor.js"></script>

        <script>
            let editor;

            BalloonEditor
            .create( document.querySelector( '#editor' ) )
            .then( newEditor => {
                editor = newEditor;
            } )
            .catch( error => {
                console.error( error );
            } );

            window.addEventListener('load-ckeditor-content', event => {
                var data = event.detail.content;
                editor.setData(data);
            });

            window.addEventListener('update-long_description', () => {
                const data = editor.getData();
                @this.dispatch('getLongDescription', { data: data });
            });
        </script>
    @endpush

</div>
