<div class="table-responsive">

    <div x-data="{ darkMode: true }">

        <div class="mb-3">
            <input type="checkbox" class="form-check-input" x-model="darkMode" id="toggleDarkMode">
            <label for="toggleDarkMode">Modo Oscuro</label>
        </div>

        <table class="table align-middle" :class="{ 'table': true, 'table-default': !darkMode, 'table-dark': darkMode }">
            <thead>
                <tr>
                    <th scope="col">#</th>
                    <th scope="col">Nombre</th>
                    <th scope="col">Acción</th>
                </tr>
            </thead>
            <tbody>
                @forelse($sponsors as $sponsor)
                    <div wire:key="{{ $sponsor->id }}">
                        <tr>
                            <th scope="row">
                                <img src="{{ asset($this->small('storage/sponsors/', $sponsor->image)) }}" @if($sponsor->trashed()) style="filter: grayscale(85%)" @endif loading="lazy">
                            </th>
                            <td>
                                {!! $sponsor->trashed() ? '<del>' . $sponsor->name . '</del>' : $sponsor->name !!}
                            </td>
                            <td>
                                @if($sponsor->trashed())
                                    <button wire:click="restore({{ $sponsor->id }})" class="btn btn-ghost-success" type="button" title="Restaurar">
                                        <i class="cil-recycle"></i>
                                    </button>
                                @else
                                    <div class="btn-group" role="group" aria-label="Default button group">
                                        <button @click="$dispatch('edit-sponsor', { sponsor: '{{ $sponsor->id }}' })" class="btn btn-ghost-warning" type="button" title="Editar" data-coreui-toggle="modal" data-coreui-target="#modal-update">
                                            <svg class="icon">
                                                <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-pencil') }}"></use>
                                            </svg>
                                        </button>
                                        <button wire:click="delete({{ $sponsor->id }})" class="btn btn-ghost-danger" type="button" title="Eliminar">
                                            <svg class="icon">
                                                <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-trash') }}"></use>
                                            </svg>
                                        </button>
                                    </div>
                                @endif
                            </td>
                        </tr>
                    </div>
                @empty
                    <tr>
                        <td colspan="3">
                            Sin resultados @if($this->search)para la buśqueda <strong>{{ $this->search }}</strong>@endif
                        </td>
                    </tr>
                @endforelse
            </tbody>
        </table>

        <div>
            {{ $sponsors->links() }}
        </div>

    </div>

</div>
