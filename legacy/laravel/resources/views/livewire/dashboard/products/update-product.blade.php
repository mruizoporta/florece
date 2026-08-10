<div>
    <form wire:submit="save">

        <!-- stock -->
        <div class="form-floating mb-3">
            <x-input-text name="form.stock" label="Stock" type="number" wire:model.blur="form.stock" wire:keyup.enter="updateStock"/>
        </div>

        <!-- stock_alert -->
        <div class="form-floating mb-3">
            <x-input-text name="form.stock_alert" label="Alerta de stock" type="number" wire:model.blur="form.stock_alert" wire:keyup.enter="updateStockAlert" />
        </div>

    </form>
</div>
