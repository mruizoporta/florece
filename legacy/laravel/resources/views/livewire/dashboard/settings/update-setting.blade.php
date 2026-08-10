<div>
    <form wire:submit="save">

        <!-- company_name -->
        <div class="mb-3">
            <x-input-text name="form.company_name" label="Nombre de empresa" type="text" wire:model="form.company_name" />
        </div><!-- ./company_name -->

        <!-- mail_contact -->
        <div class="mb-3">
            <x-input-text name="form.mail_contact" label="Correo" type="email" wire:model="form.mail_contact" />
        </div><!-- ./mail_contact -->

        <!-- location -->
        <div class="mb-3">
            <x-input-text name="form.location" label="Localidad" type="text" wire:model="form.location" />
        </div><!-- ./location -->

        <!-- address -->
        <div class="mb-3">
            <x-input-text name="form.address" label="Dirección" type="text" wire:model="form.address" />
        </div><!-- ./address -->

        <!-- phone -->
        <div class="mb-3">
            <x-input-text name="form.phone" label="Teléfono" type="number" wire:model="form.phone" />
        </div><!-- ./phone -->

        <!-- currency_symbol -->
        <div class="mb-3">
            <x-input-text name="form.currency_symbol" label="Símbolo de moneda" type="text" wire:model="form.currency_symbol" />
        </div><!-- ./currency_symbol -->

        <!-- instagram_href -->
        <div class="mb-3">
            <x-input-text name="form.instagram_href" label="Instagram URL" type="text" wire:model="form.instagram_href" />
        </div><!-- ./instagram_href -->

        <!-- about_us -->
        <div class="mb-3">
            <x-input-text name="form.about_us" label="Sobre nosotros" type="text" wire:model.blur="form.about_us" />
        </div><!-- ./about_us -->

        <!-- schedules -->
        <div class="mb-3">
            <x-input-text name="form.schedules" label="Horarios de atención" type="text" wire:model.blur="form.schedules" />
        </div><!-- ./schedules -->

        <button type="submit" class="btn btn-warning float-end">
            Actualizar
        </button>

    </form>
</div>
