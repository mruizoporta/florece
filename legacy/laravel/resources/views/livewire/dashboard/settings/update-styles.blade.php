<div class="card-body">
    <div class="callout callout-primary">
        A continuación establezca el valor de los colores para modificar los estilos de la Landing Page.
    </div>

    <div class="row justify-content-center">

        <div class="row mb-4">
            <div class="col-6">
                <label class="form-label">Títulos</label>
                <input wire:model.change="titles_color" type="color" class="form-control form-control-color" title="Seleccione color">
            </div>

            <div class="col-6">
                <label class="form-label">Iconos</label>
                <input wire:model.change="icons_color" type="color" class="form-control form-control-color" title="Seleccione color">
            </div>
        </div>

        <div class="row mb-4">
            <div class="col-6">
                <label class="form-label">Botones (Fondo)</label>
                <input wire:model.change="buttons_background_color" type="color" class="form-control form-control-color" title="Seleccione color">
            </div>

            <div class="col-6">
                <label class="form-label">Botones (Texto)</label>
                <input wire:model.change="buttons_text_color" type="color" class="form-control form-control-color" title="Seleccione color">
            </div>
        </div>

        <div class="row mb-4">
            <div class="col-6">
                <label class="form-label">Whatsapp (Fondo)</label>
                <input wire:model.change="btn_whatsapp_background_color" type="color" class="form-control form-control-color" title="Seleccione color">
            </div>

            <div class="col-6">
                <label class="form-label">Whatsapp (Texto)</label>
                <input wire:model.change="btn_whatsapp_text_color" type="color" class="form-control form-control-color" title="Seleccione color">
            </div>
        </div>

        <div class="row">
            <div class="col-6">
                <label class="form-label">Footer (Fondo)</label>
                <input wire:model.change="footer_background_color" type="color" class="form-control form-control-color" title="Seleccione color">
            </div>

            <div class="col-6">
                <label class="form-label">Footer (Texto)</label>
                <input wire:model.change="footer_text_color" type="color" class="form-control form-control-color" title="Seleccione color">
            </div>
        </div>

    </div>
</div>
