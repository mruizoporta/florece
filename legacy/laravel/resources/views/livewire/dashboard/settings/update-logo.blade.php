<div>
    <form wire:submit="save">

        <div class="row">
            <div class="col-6">
                @if($form->currentLogo)
                    <div>
                        <img src="{{ asset($this->small('storage/logo/', $form->currentLogo)) }}" loading="lazy">
                    </div>
                @endif
            </div>

            <div class="col-6">
                @if ($form->logo)
                    <img src="{{ $form->logo->temporaryUrl() }}" width="150px">
                @endif
            </div>
        </div>

        <!-- logo -->
        <div class="mb-3">
            <x-input-file id="{{ rand() }}" name="form.logo" label="" wire:model="form.logo" />
        </div>

        <button type="submit" class="btn btn-light float-end">
            <svg class="icon">
                <use xlink:href="{{ asset('coreui/vendors/@coreui/icons/svg/free.svg#cil-cloud-upload') }}"></use>
            </svg>
            Reemplazar
            <div wire:loading class="spinner-border spinner-border-sm" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </button>
    </form>
</div>
